import { useEffect, useState } from "react";
import api from "@/lib/api";
import { fmtNum, titleCase } from "@/lib/format";
import { MapPin, Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Desa() {
  const [res, setRes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [kec, setKec] = useState("ALL");

  const load = () => {
    setLoading(true);
    api.get("/desa", { params: { search, kecamatan: kec } })
      .then((r) => setRes(r.data)).finally(() => setLoading(false));
  };
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [search, kec]);

  const rows = res?.data || [];

  return (
    <div className="space-y-5" data-testid="desa-page">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900">Data Desa & Kelurahan</h2>
        <p className="text-sm text-slate-500">Daftar resmi 125 desa & kelurahan beserta cakupan listrik rumah tangga</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari desa/kelurahan..." className="pl-10 h-11 rounded-xl bg-white" data-testid="desa-search" />
        </div>
        <Select value={kec} onValueChange={setKec}>
          <SelectTrigger className="w-56 h-11 rounded-xl bg-white" data-testid="desa-kec-filter"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua Kecamatan</SelectItem>
            {(res?.kecamatan_list || []).map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-xs text-slate-500">Total Desa/Kel</div>
          <div className="text-2xl font-extrabold text-teal-600 font-mono">{fmtNum(rows.reduce((a, r) => a + 1, 0))}</div>
          <div className="text-[11px] text-slate-400">{rows.filter((r) => r.jenis === "Desa").length} Desa · {rows.filter((r) => r.jenis === "Kelurahan").length} Kelurahan</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-xs text-slate-500">Total Rumah Tangga</div>
          <div className="text-2xl font-extrabold text-slate-800 font-mono">{fmtNum(rows.reduce((a, r) => a + (r.total_rt || 0), 0))}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-xs text-slate-500">RT Berlistrik</div>
          <div className="text-2xl font-extrabold text-emerald-600 font-mono">{fmtNum(rows.reduce((a, r) => a + (r.rt_pln || 0) + (r.rt_nonpln || 0), 0))}</div>
          <div className="text-[11px] text-slate-400">PLN {fmtNum(rows.reduce((a, r) => a + (r.rt_pln || 0), 0))} · Non-PLN {fmtNum(rows.reduce((a, r) => a + (r.rt_nonpln || 0), 0))}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-xs text-slate-500">RT Belum Berlistrik</div>
          <div className="text-2xl font-extrabold text-amber-600 font-mono">{fmtNum(rows.reduce((a, r) => a + (r.rt_belum || 0), 0))}</div>
        </div>
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
                  <th className="px-4 py-3 font-semibold">Nama Desa / Kelurahan</th>
                  <th className="px-4 py-3 font-semibold">Kecamatan</th>
                  <th className="px-4 py-3 font-semibold">Jenis</th>
                  <th className="px-4 py-3 font-semibold text-right">Total RT</th>
                  <th className="px-4 py-3 font-semibold text-right text-sky-600">PLN</th>
                  <th className="px-4 py-3 font-semibold text-right text-emerald-600">Non-PLN</th>
                  <th className="px-4 py-3 font-semibold text-right text-amber-600">Belum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50/70 transition-colors" data-testid={`desa-row-${i}`}>
                    <td className="px-4 py-3 text-slate-400 font-mono">{r.no || i + 1}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900 flex items-center gap-2"><MapPin className="w-4 h-4 text-teal-500" />{r.nama}</td>
                    <td className="px-4 py-3 text-slate-600">{r.kecamatan}</td>
                    <td className="px-4 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${r.jenis === "Kelurahan" ? "bg-teal-50 text-teal-700" : "bg-slate-100 text-slate-600"}`}>{r.jenis || "Desa"}</span></td>
                    <td className="px-4 py-3 text-right font-mono font-medium">{fmtNum(r.total_rt)}</td>
                    <td className="px-4 py-3 text-right font-mono text-sky-700">{fmtNum(r.rt_pln)}</td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-700">{fmtNum(r.rt_nonpln)}</td>
                    <td className="px-4 py-3 text-right font-mono text-amber-700 font-medium">{fmtNum(r.rt_belum)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && <div className="text-center py-12 text-slate-400 text-sm">Tidak ada data desa.</div>}
          </div>
        )}
      </div>
    </div>
  );
}
