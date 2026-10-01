/**
 * Categorical series colours, assigned in this fixed order (never cycled).
 * From the dataviz skill's validated reference palette, light mode: adjacent
 * pairs pass colourblind (CVD ΔE ≥ 8) and normal-vision separation checks.
 * More than 5 series → fold into "Other" or split into separate charts.
 */
export const SERIES = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4"];

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });
const plain = new Intl.NumberFormat("en", { maximumFractionDigits: 2 });

export type Format = "number" | "compact" | "percent" | "currency" | ((v: number) => string);

/** Opinionated number formatting for axes and tooltips. */
export function formatter(format: Format = "compact"): (v: unknown) => string {
  if (typeof format === "function") return (v) => format(v as number);
  return (v) => {
    if (typeof v !== "number" || !Number.isFinite(v)) return String(v ?? "");
    switch (format) {
      case "percent":
        return `${plain.format(v * 100)}%`;
      case "currency":
        return Math.abs(v) >= 10_000 ? `$${compact.format(v)}` : `$${plain.format(v)}`;
      case "number":
        return plain.format(v);
      default:
        return Math.abs(v) >= 10_000 ? compact.format(v) : plain.format(v);
    }
  };
}

/** x-axis labels: dates as year (or month-year for short spans), year-like integers without commas. */
export function xFormatter(sample: unknown, spanDays = Infinity): (v: unknown) => string {
  if (sample instanceof Date) {
    const opts: Intl.DateTimeFormatOptions = spanDays < 730 ? { month: "short", year: "2-digit" } : { year: "numeric" };
    const f = new Intl.DateTimeFormat("en", opts);
    return (v) => (v instanceof Date ? f.format(v) : String(v));
  }
  if (typeof sample === "number" && Number.isInteger(sample) && sample > 1000 && sample < 3000) {
    return (v) => String(v);
  }
  return typeof sample === "number" ? formatter("compact") : (v) => String(v);
}
