import ExcelJS from "exceljs";
import { createClient } from "@/lib/supabase/server";
import { currentPeriod } from "@/lib/reports/queries";
import { getExportData, type ExportTransaction } from "@/lib/reports/export";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function colomboDateTime(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Colombo",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function colomboDate(value: string | null): string {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Colombo",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function monthLabel(year: number, month: number): string {
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

function styleHeader(row: ExcelJS.Row) {
  row.font = { bold: true };
}

/**
 * On-demand full-backup export. Builds a five-sheet xlsx for the chosen month
 * and returns it as a download. Transaction sheets are limited to the period;
 * customers and settings are full snapshots so the file can rebuild everything.
 */
export async function GET(request: Request) {
  // Defence in depth: the proxy already gates this, but verify here too.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = new URL(request.url);
  const current = currentPeriod();
  const parsedYear = Number(url.searchParams.get("year"));
  const parsedMonth = Number(url.searchParams.get("month"));
  const year =
    Number.isInteger(parsedYear) && parsedYear >= 2000 && parsedYear <= 2100
      ? parsedYear
      : current.year;
  const month =
    Number.isInteger(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12
      ? parsedMonth
      : current.month;

  const data = await getExportData(year, month);

  const earns = data.transactions.filter((t) => t.entry_type === "earn");
  const redeems = data.transactions.filter((t) => t.entry_type === "redeem");

  const sumPoints = (rows: ExportTransaction[]) =>
    rows
      .filter((t) => !t.voided)
      .reduce((total, t) => total + t.points, 0);

  const pointsIssued = sumPoints(earns);
  const pointsRedeemed = -sumPoints(redeems); // redeem points are negative
  const outstanding = data.customers.reduce(
    (total, c) => total + c.points_balance,
    0,
  );

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Loyalty System";
  workbook.created = new Date();

  // --- Summary -------------------------------------------------------------
  const summary = workbook.addWorksheet("Summary");
  summary.columns = [
    { key: "label", width: 32 },
    { key: "value", width: 28 },
  ];
  summary.addRow({ label: "Loyalty export" }).font = { bold: true, size: 14 };
  summary.addRow({ label: "Period", value: monthLabel(year, month) });
  summary.addRow({
    label: "Generated",
    value: colomboDateTime(new Date().toISOString()),
  });
  summary.addRow({});
  styleHeader(summary.addRow({ label: "This period" }));
  summary.addRow({ label: "Points issued", value: pointsIssued });
  summary.addRow({ label: "Points redeemed", value: pointsRedeemed });
  summary.addRow({ label: "Net points", value: pointsIssued - pointsRedeemed });
  summary.addRow({ label: "Earn transactions", value: earns.length });
  summary.addRow({ label: "Redeem transactions", value: redeems.length });
  summary.addRow({});
  styleHeader(summary.addRow({ label: "All customers (snapshot)" }));
  summary.addRow({ label: "Total outstanding points", value: outstanding });
  summary.addRow({
    label: "Worth (LKR)",
    value: outstanding * data.config.redemption_value,
  });

  // --- Transactions (Earn) -------------------------------------------------
  const earnSheet = workbook.addWorksheet("Transactions (Earn)");
  earnSheet.columns = [
    { header: "Date", key: "date", width: 20 },
    { header: "Customer", key: "customer", width: 24 },
    { header: "Description", key: "description", width: 30 },
    { header: "Amount (LKR)", key: "amount", width: 14 },
    { header: "Category", key: "paint_type", width: 16 },
    { header: "Rate (%)", key: "rate", width: 10 },
    { header: "Points earned", key: "points", width: 14 },
    { header: "Voided", key: "voided", width: 10 },
  ];
  styleHeader(earnSheet.getRow(1));
  for (const t of earns) {
    earnSheet.addRow({
      date: colomboDateTime(t.created_at),
      customer: t.customer?.full_name ?? "",
      description: t.description ?? "",
      amount: t.amount,
      paint_type: t.paint_type?.name ?? "",
      rate: t.earning_percentage ?? "",
      points: t.points,
      voided: t.voided ? "Yes" : "No",
    });
  }

  // --- Redemptions ---------------------------------------------------------
  const redeemSheet = workbook.addWorksheet("Redemptions");
  redeemSheet.columns = [
    { header: "Date", key: "date", width: 20 },
    { header: "Customer", key: "customer", width: 24 },
    { header: "Product given", key: "description", width: 30 },
    { header: "Value (LKR)", key: "amount", width: 14 },
    { header: "LKR per point", key: "value", width: 14 },
    { header: "Points deducted", key: "points", width: 16 },
    { header: "Voided", key: "voided", width: 10 },
  ];
  styleHeader(redeemSheet.getRow(1));
  for (const t of redeems) {
    redeemSheet.addRow({
      date: colomboDateTime(t.created_at),
      customer: t.customer?.full_name ?? "",
      description: t.description ?? "",
      amount: t.amount,
      value: t.redemption_value ?? "",
      points: -t.points, // stored negative; show as points removed
      voided: t.voided ? "Yes" : "No",
    });
  }

  // --- Customers -----------------------------------------------------------
  const customerSheet = workbook.addWorksheet("Customers");
  customerSheet.columns = [
    { header: "Name", key: "name", width: 24 },
    { header: "Phone", key: "phone", width: 16 },
    { header: "Date of birth", key: "dob", width: 16 },
    { header: "Address", key: "address", width: 30 },
    { header: "Default category", key: "type", width: 18 },
    { header: "Barcode", key: "barcode", width: 18 },
    { header: "Points balance", key: "balance", width: 16 },
    { header: "Registered", key: "registered", width: 16 },
  ];
  styleHeader(customerSheet.getRow(1));
  for (const c of data.customers) {
    customerSheet.addRow({
      name: c.full_name,
      phone: c.phone_number ?? "",
      dob: colomboDate(c.date_of_birth),
      address: c.address ?? "",
      type: c.default_paint_type?.name ?? "",
      barcode: c.barcode_id ?? "",
      balance: c.points_balance,
      registered: colomboDate(c.created_at),
    });
  }

  // --- Settings ------------------------------------------------------------
  const settingsSheet = workbook.addWorksheet("Settings");
  settingsSheet.columns = [
    { key: "a", width: 28 },
    { key: "b", width: 20 },
  ];
  styleHeader(settingsSheet.addRow({ a: "Category", b: "Earning rate (%)" }));
  for (const p of data.paintTypes) {
    settingsSheet.addRow({ a: p.name, b: p.earning_percentage });
  }
  settingsSheet.addRow({});
  styleHeader(settingsSheet.addRow({ a: "Redemption" }));
  settingsSheet.addRow({
    a: "Threshold (points)",
    b: data.config.redemption_threshold,
  });
  settingsSheet.addRow({
    a: "Value (LKR per point)",
    b: data.config.redemption_value,
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `loyalty-export-${year}-${String(month).padStart(2, "0")}.xlsx`;

  return new Response(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
