import { useEffect, useState } from "react";
import api from "@/lib/api";
import { fmtNum } from "@/lib/format";
import { Users, Loader2, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Keluarga() {
  const [res, setRes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [kec, setKec] = useState("ALL");
  const [page, setPage] = useState(1);
  const limit = 25;

  const load = () => {
    setLoading(true);
    api.get("/households", { params: { search, kecamatan: kec, page, limit } })
      .then((r) => setRes(r.data)).finally(() => setLoading(false));
  };
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [search, kec, page]);
  useEffect(() => { setPage(1); }, [search, kec]);

  const rows = res?.data || [];
  const total = res?.total || 0;
  const pages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-5" data-testid="keluarga-page">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900">Data Keluarga / Rumah Tangga</h2>
        <p className="text-sm text-slate-500">Daftar kepala keluarga terdata · {fmtNum(total)} rumah tangga</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama, NIK, atau desa..." className="pl-10 h-11 rounded-xl bg-white" data-testid="hh-search" />
        </div>
        <Select value={kec} onValueChange={setKec}>
          <SelectTrigger className="w-56 h-11 rounded-xl bg-white" data-testid="hh-kec-filter"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua Kecamatan</SelectItem>
            {(res?.kecamatan_list || []).map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
          </SelectContent>
        </Select>
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
                  <th className="px-4 py-3 font-semibold">Nama Kepala Keluarga</th>
                  <th className="px-4 py-3 font-semibold">NIK</th>
                  <th className="px-4 py-3 font-semibold">Alamat</th>
                  <th className="px-4 py-3 font-semibold">Desa/Kel</th>
                  <th className="px-4 py-3 font-semibold">Kecamatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50/70 transition-colors" data-testid={`hh-row-${i}`}>
                    <td className="px-4 py-3 text-slate-400 font-mono">{(page - 1) * limit + i + 1}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{r.nama}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{r.nik || "-"}</td>
                    <td className="px-4 py-3 text-slate-600">{r.alamat || "-"}</td>
                    <td className="px-4 py-3 text-slate-600">{r.desa || "-"}</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 text-xs font-medium">{r.kecamatan || "-"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && <div className="text-center py-12 text-slate-400 text-sm">Tidak ada data rumah tangga.</div>}
          </div>
        )}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-sm">
          <span className="text-slate-500">Halaman {page} dari {pages}</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50" data-testid="hh-prev"><ChevronLeft className="w-4 h-4" /></button>
            <button disabled={page >= pages} onClick={() => setPage(page + 1)} className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50" data-testid="hh-next"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
