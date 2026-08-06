/**
 * Minimal Code 128 (Code Set B) encoder. Returns the black bars in module
 * units, so a renderer (the card PDF) can scale them to any width. Self
 * contained, no dependencies, so the barcodes are standard and scannable.
 */

const CODE128 = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213",
  "122312", "132212", "221213", "221312", "231212", "112232", "122132",
  "122231", "113222", "123122", "123221", "223211", "221132", "221231",
  "213212", "223112", "312131", "311222", "321122", "321221", "312212",
  "322112", "322211", "212123", "212321", "232121", "111323", "131123",
  "131321", "112313", "132113", "132311", "211313", "231113", "231311",
  "112133", "112331", "132131", "113123", "113321", "133121", "313121",
  "211331", "231131", "213113", "213311", "213131", "311123", "311321",
  "331121", "312113", "312311", "332111", "314111", "221411", "431111",
  "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  "112412", "122114", "122411", "142112", "142211", "241211", "221114",
  "413111", "241112", "134111", "111242", "121142", "121241", "114212",
  "124112", "124211", "411212", "421112", "421211", "212141", "214121",
  "412121", "111143", "111341", "131141", "114113", "114311", "411113",
  "411311", "113141", "114131", "311141", "411131", "211412", "211214",
  "211232", "2331112",
];

export type Barcode = {
  /** Total width in module units, including the quiet zones on each side. */
  totalModules: number;
  /** Black bars, each with an x offset and width in module units. */
  bars: Array<{ x: number; w: number }>;
};

/**
 * Encodes text as a Code 128 (Set B) string ready for a Code 128 barcode FONT,
 * using the common Grand Zebu mapping. When a print shop applies that font to
 * the cell, it renders a scannable barcode. This is the "formula" some printers
 * ask for. Printers that generate their own barcodes just use the plain code.
 */
export function code128FontText(text: string): string {
  let checksum = 104; // Start Code B
  let out = String.fromCharCode(204); // Start B glyph
  for (let i = 0; i < text.length; i++) {
    const value = text.charCodeAt(i) - 32;
    checksum += value * (i + 1);
    out += String.fromCharCode(value < 95 ? value + 32 : value + 100);
  }
  const check = checksum % 103;
  out += String.fromCharCode(check < 95 ? check + 32 : check + 100);
  out += String.fromCharCode(206); // Stop glyph
  return out;
}

export function code128(text: string): Barcode {
  const quiet = 10;
  const values = [104]; // Start Code B
  let checksum = 104;
  for (let i = 0; i < text.length; i++) {
    const value = text.charCodeAt(i) - 32;
    values.push(value);
    checksum += value * (i + 1);
  }
  values.push(checksum % 103);
  values.push(106); // Stop

  const bars: Array<{ x: number; w: number }> = [];
  let x = quiet;
  for (const value of values) {
    const pattern = CODE128[value];
    let isBar = true;
    for (const ch of pattern) {
      const w = Number(ch);
      if (isBar) bars.push({ x, w });
      x += w;
      isBar = !isBar;
    }
  }

  return { totalModules: x + quiet, bars };
}
