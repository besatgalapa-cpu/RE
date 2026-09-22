import { useEffect, useState } from "react";
import api, { apiError } from "@/lib/api";
import { fmtNum, fmtPct, titleCase, reStatus } from "@/lib/format";
import { Building2, Loader2, Search, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function Kecamatan() {
  const [res, setRes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [periodId, setPeriodId] = useState(null);
  const [periods, setPeriods] = useState([]);

  const load = (pid) => {
    setLoading(true);
    api.get("/kecamatan", { params: pid ? { period_id: pid } : {} })
      .then((r) => { setRes(r.data); setPeriodId(r.data.period?.id || null); })
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(null); api.get("/periods").then((r) => setPeriods(r.data)); }, []);

  const rows = (res?.data || []).filter((r) => r.nama.toLowerCase().includes(q.toLowerCase()));

  const exportCsv = () => {
    const head = ["No", "Kecamatan", "Ibu Kota", "Desa/Kel", "Total RT", "RT PLN", "RT Non-PLN", "RT Belum", "RE PLN %", "RE Non-PLN %", "RE %"];
    const lines = rows.map((r) => [r.no, r.nama, r.ibu_kota || "-", r.jumlah_desa_kel, r.total_rt, r.rt_pln, r.rt_nonpln, r.rt_belum, r.re_pln, r.re_nonpln, r.re_total].join(","));
    const blob = new Blob([[head.join(","), ...lines].join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `kecamatan_${res.period?.kode}.csv`; a.click();
    toast.success("Data diekspor");
  };

  return (
    <div className="space-y-5" data-testid="kecamatan-page">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Data Kecamatan</h2>
          <p className="text-sm text-slate-500">Rekap elektrifikasi per kecamatan · {res?.period?.label || "-"}</p>
        </div>
        <div className="flex gap-2">
          <Select value={periodId || ""} onValueChange={load}>
            <SelectTrigger className="w-44 h-10 rounded-xl bg-white" data-testid="kec-period"><SelectValue placeholder="Periode" /></SelectTrigger>
            <SelectContent>{periods.map((p) => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}</SelectContent>
          </Select>
          <button onClick={exportCsv} data-testid="btn-export-kec" className="h-10 px-4 rounded-xl bg-white border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari kecamatan..." className="pl-10 h-11 rounded-xl bg-white" data-testid="kec-search" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64"><Loader2 className="w-7 h-7 animate-spin text-teal-600" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-slate-500 text-xs uppercase tracking-wide">
                  <th className="px-4 py-3 font-semibold">No</th>
                  <th className="px-4 py-3 font-semibold">Kecamatan</th>
                  <th className="px-4 py-3 font-semibold text-center">Desa/Kel</th>
                  <th className="px-4 py-3 font-semibold text-right">Total RT</th>
                  <th className="px-4 py-3 font-semibold text-right text-sky-600">PLN</th>
                  <th className="px-4 py-3 font-semibold text-right text-emerald-600">Non-PLN</th>
                  <th className="px-4 py-3 font-semibold text-right text-amber-600">Belum</th>
                  <th className="px-4 py-3 font-semibold text-right">RE (%)</th>
                  <th className="px-4 py-3 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => {
                  const st = reStatus(r.re_total);
                  return (
                    <tr key={r.no} className="hover:bg-slate-50/70 transition-colors" data-testid={`kec-row-${r.no}`}>
                      <td className="px-4 py-3 text-slate-400 font-mono">{r.no}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{titleCase(r.nama)}</div>
                        <div className="text-xs text-slate-400">{r.ibu_kota}</div>
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600">{r.jumlah_desa_kel}</td>
                      <td className="px-4 py-3 text-right font-mono font-medium">{fmtNum(r.total_rt)}</td>
                      <td className="px-4 py-3 text-right font-mono text-sky-700">{fmtNum(r.rt_pln)}</td>
                      <td className="px-4 py-3 text-right font-mono text-emerald-700">{fmtNum(r.rt_nonpln)}</td>
                      <td className="px-4 py-3 text-right font-mono text-amber-700">{fmtNum(r.rt_belum)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-mono font-bold text-slate-900">{fmtPct(r.re_total)}</span>
                        <div className="mt-1 h-1.5 w-20 ml-auto bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-teal-500 rounded-full" style={{ width: `${Math.min(r.re_total, 100)}%` }} />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${st.cls}`}>{st.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {rows.length === 0 && <div className="text-center py-12 text-slate-400 text-sm">Tidak ada data.</div>}
          </div>
        )}
      </div>
    </div>
  );
}
