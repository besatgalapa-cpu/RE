export const fmtNum = (n) =>
  new Intl.NumberFormat("id-ID").format(Math.round(n || 0));

export const fmtPct = (n) =>
  `${Number(n || 0).toFixed(2)}%`;

export const titleCase = (s) =>
  (s || "").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

export const COLORS = {
  pln: "#0284C7",
  nonpln: "#16A34A",
  belum: "#F59E0B",
  primary: "#0D9488",
};

export function reStatus(re) {
  if (re >= 95) return { label: "Sangat Baik", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  if (re >= 85) return { label: "Baik", cls: "bg-teal-50 text-teal-700 border-teal-200" };
  if (re >= 70) return { label: "Cukup", cls: "bg-sky-50 text-sky-700 border-sky-200" };
  if (re >= 50) return { label: "Rendah", cls: "bg-amber-50 text-amber-700 border-amber-200" };
  return { label: "Kritis", cls: "bg-red-50 text-red-700 border-red-200" };
}
