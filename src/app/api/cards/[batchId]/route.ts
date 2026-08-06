import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFImage,
  type PDFFont,
} from "pdf-lib";
import ExcelJS from "exceljs";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrganization } from "@/lib/organizations/queries";
import { code128, code128FontText } from "@/lib/cards/code128";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MM = 2.83465; // points per millimetre
const BLEED = 3;
const CARD_W = 85.6;
const CARD_H = 54;

function hexColor(hex: string) {
  const match = /^#?([0-9a-fA-F]{6})$/.exec(hex || "");
  if (!match) return rgb(0.76, 0.07, 0.12);
  const n = parseInt(match[1], 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

/** Break text into lines that fit maxWidth at the given font size. */
function wrapText(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(test, size) > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ batchId: string }> },
) {
  const { batchId } = await params;
  const format = new URL(_request.url).searchParams.get("format");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const [org, cardsResult] = await Promise.all([
    getCurrentOrganization(),
    supabase
      .from("cards")
      .select("code, status")
      .eq("batch_id", batchId)
      .order("created_at", { ascending: true }),
  ]);

  if (cardsResult.error) return new Response("Error", { status: 500 });
  const cards = (cardsResult.data ?? []) as { code: string; status: string }[];
  if (cards.length === 0) return new Response("Not found", { status: 404 });

  // Excel of the barcode numbers, for print shops that do their own barcodes.
  if (format === "xlsx") {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Cards");
    sheet.columns = [
      { header: "Card number", key: "code", width: 20 },
      { header: "Barcode (apply Code 128 font)", key: "barcode", width: 30 },
      { header: "Status", key: "status", width: 14 },
    ];
    sheet.getRow(1).font = { bold: true };
    for (const c of cards) {
      sheet.addRow({
        code: c.code,
        barcode: code128FontText(c.code),
        status: c.status,
      });
    }
    const buffer = await workbook.xlsx.writeBuffer();
    return new Response(buffer as BodyInit, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="cards-${batchId.slice(0, 8)}.xlsx"`,
      },
    });
  }

  const pdf = await PDFDocument.create();
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const brand = hexColor(org.brand_color);
  const businessName = (org.admin_name?.trim() || org.name || "Loyalty").trim();
  const cardTitle = org.card_title?.trim() || "Member Card";
  const cardTagline = org.card_tagline?.trim() || "";
  const backEnabled = org.card_back_enabled;
  const backText = org.card_back_text?.trim() || "";

  // Embed the business logo, whether it is a bucket URL or a legacy data URL.
  let logo: PDFImage | null = null;
  if (org.logo_url) {
    try {
      let bytes: Uint8Array;
      let isJpg = false;
      if (org.logo_url.startsWith("data:image")) {
        const [meta, b64] = org.logo_url.split(",");
        isJpg = meta.includes("jpeg") || meta.includes("jpg");
        bytes = Buffer.from(b64, "base64");
      } else {
        const res = await fetch(org.logo_url);
        const contentType = res.headers.get("content-type") ?? "";
        const lowered = org.logo_url.toLowerCase();
        isJpg =
          contentType.includes("jpeg") ||
          lowered.endsWith(".jpg") ||
          lowered.endsWith(".jpeg");
        bytes = new Uint8Array(await res.arrayBuffer());
      }
      logo = isJpg ? await pdf.embedJpg(bytes) : await pdf.embedPng(bytes);
    } catch {
      logo = null;
    }
  }

  const pageW = (CARD_W + BLEED * 2) * MM;
  const pageH = (CARD_H + BLEED * 2) * MM;
  const barH = 15 * MM;

  for (const card of cards) {
    const page = pdf.addPage([pageW, pageH]);

    // Brand header band across the full (bleed) width.
    page.drawRectangle({
      x: 0,
      y: pageH - barH,
      width: pageW,
      height: barH,
      color: brand,
    });

    // Logo and business name on the band.
    let nameX = (BLEED + 4) * MM;
    if (logo) {
      const size = barH * 0.62;
      const ratio = logo.width / logo.height;
      const w = size * ratio;
      page.drawImage(logo, {
        x: (BLEED + 3) * MM,
        y: pageH - barH + (barH - size) / 2,
        width: w,
        height: size,
      });
      nameX = (BLEED + 3) * MM + w + 5;
    }
    page.drawText(businessName, {
      x: nameX,
      y: pageH - barH / 2 - 5,
      size: 11,
      font: bold,
      color: rgb(1, 1, 1),
    });

    // Card title and optional tagline.
    page.drawText(cardTitle.toUpperCase(), {
      x: (BLEED + 4) * MM,
      y: pageH - barH - 15,
      size: 7.5,
      font: bold,
      color: rgb(0.35, 0.35, 0.35),
    });
    if (cardTagline) {
      page.drawText(cardTagline, {
        x: (BLEED + 4) * MM,
        y: pageH - barH - 27,
        size: 7,
        font: regular,
        color: rgb(0.5, 0.5, 0.5),
      });
    }

    // Barcode.
    const barcode = code128(card.code);
    const bcW = 62 * MM;
    const bcH = 13 * MM;
    const bcX = (pageW - bcW) / 2;
    const bcY = (BLEED + 13) * MM;
    const scale = bcW / barcode.totalModules;
    for (const bar of barcode.bars) {
      page.drawRectangle({
        x: bcX + bar.x * scale,
        y: bcY,
        width: bar.w * scale,
        height: bcH,
        color: rgb(0, 0, 0),
      });
    }

    // Human-readable code, centred under the barcode.
    const codeSize = 10;
    const codeW = regular.widthOfTextAtSize(card.code, codeSize);
    page.drawText(card.code, {
      x: (pageW - codeW) / 2,
      y: bcY - 14,
      size: codeSize,
      font: regular,
      color: rgb(0.1, 0.1, 0.1),
    });

    // Thin brand accent along the bottom trim.
    page.drawRectangle({
      x: 0,
      y: BLEED * MM,
      width: pageW,
      height: 2 * MM,
      color: brand,
    });

    // Back of the card (optional).
    if (backEnabled) {
      const back = pdf.addPage([pageW, pageH]);

      back.drawRectangle({
        x: 0,
        y: pageH - barH,
        width: pageW,
        height: barH,
        color: brand,
      });

      let backNameX = (BLEED + 4) * MM;
      if (logo) {
        const size = barH * 0.62;
        const ratio = logo.width / logo.height;
        const w = size * ratio;
        back.drawImage(logo, {
          x: (BLEED + 3) * MM,
          y: pageH - barH + (barH - size) / 2,
          width: w,
          height: size,
        });
        backNameX = (BLEED + 3) * MM + w + 5;
      }
      back.drawText(businessName, {
        x: backNameX,
        y: pageH - barH / 2 - 5,
        size: 11,
        font: bold,
        color: rgb(1, 1, 1),
      });

      const contentX = (BLEED + 4) * MM;
      const contentW = pageW - contentX * 2;
      const text =
        backText ||
        "Show this card on each visit to earn and redeem points.";
      const size = 8;
      const lineH = 11;
      let y = pageH - barH - 20;
      for (const paragraph of text.split(/\r?\n/)) {
        const lines =
          paragraph.trim() === ""
            ? [""]
            : wrapText(paragraph, regular, size, contentW);
        for (const line of lines) {
          if (y < (BLEED + 6) * MM) break;
          back.drawText(line, {
            x: contentX,
            y,
            size,
            font: regular,
            color: rgb(0.2, 0.2, 0.2),
          });
          y -= lineH;
        }
      }

      back.drawRectangle({
        x: 0,
        y: BLEED * MM,
        width: pageW,
        height: 2 * MM,
        color: brand,
      });
    }
  }

  const bytes = await pdf.save();
  const filename = `cards-${batchId.slice(0, 8)}.pdf`;

  return new Response(bytes as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
