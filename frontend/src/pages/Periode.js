import { useEffect, useState } from "react";
import api, { apiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Calendar, Loader2, Plus, CheckCircle2, Lock, Unlock, Trash2, Circle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function Periode() {
  const { can } = useAuth();
  const canWrite = can("data:write");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [triwulan, setTriwulan] = useState("III");
  const [tahun, setTahun] = useState("2026");

  const load = () => { setLoading(true); api.get("/periods").then((r) => setRows(r.data)).finally(() => setLoading(false)); };
  useEffect(load, []);

  const create = async () => {
    try { await api.post("/periods", { triwulan, tahun: Number(tahun) }); toast.success("Periode ditambahkan"); setOpen(false); load(); }
    catch (e) { toast.error(apiError(e)); }
  };
  const activate = async (id) => { await api.patch(`/periods/${id}/activate`); toast.success("Periode diaktifkan"); load(); };
  const lock = async (id) => { await api.patch(`/periods/${id}/lock`); toast.success("Status kunci diperbarui"); load(); };
  const del = async (id) => { await api.delete(`/periods/${id}`); toast.success("Periode dihapus"); load(); };
  const downloadExcel = async (p) => {
    try {
      const r = await api.get(`/periods/${p.id}/excel`, { responseType: "blob" });
      const url = URL.createObjectURL(r.data);
      const a = document.createElement("a");
      a.href = url; a.download = p.excel_filename || `${p.kode}.xlsx`; a.click();
      URL.revokeObjectURL(url);
      toast.success("Arsip Excel diunduh");
    } catch (e) { toast.error("Arsip Excel tidak tersedia"); }
  };

  return (
    <div className="space-y-5" data-testid="periode-page">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-extrabold text-slate-900">Periode Data</h2><p className="text-sm text-slate-500">Kelola periode triwulan laporan</p></div>
        <Dialog open={open} onOpenChange={setOpen}>
          {canWrite && (
          <DialogTrigger asChild>
            <Button className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white" data-testid="add-period-btn"><Plus className="w-4 h-4 mr-2" /> Tambah Periode</Button>
          </DialogTrigger>
          )}
          <DialogContent>
            <DialogHeader><DialogTitle>Tambah Periode Baru</DialogTitle></DialogHeader>
            <div className="flex gap-3">
              <div className="flex-1"><label className="text-xs text-slate-500">Triwulan</label>
                <Select value={triwulan} onValueChange={setTriwulan}><SelectTrigger className="mt-1 rounded-xl" data-testid="new-period-triwulan"><SelectValue /></SelectTrigger>
                  <SelectContent>{["I", "II", "III", "IV"].map((t) => <SelectItem key={t} value={t}>Triwulan {t}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="flex-1"><label className="text-xs text-slate-500">Tahun</label>
                <Select value={tahun} onValueChange={setTahun}><SelectTrigger className="mt-1 rounded-xl" data-testid="new-period-tahun"><SelectValue /></SelectTrigger>
                  <SelectContent>{["2024", "2025", "2026", "2027"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
              </div>
            </div>
            <DialogFooter><Button onClick={create} className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white" data-testid="save-period-btn">Simpan</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? <div className="flex justify-center h-40 items-center"><Loader2 className="w-7 h-7 animate-spin text-teal-600" /></div> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map((p) => (
            <div key={p.id} className={`bg-white rounded-2xl border p-5 transition-all ${p.is_active ? "border-teal-400 ring-2 ring-teal-100" : "border-slate-200"}`} data-testid={`period-card-${p.kode}`}>
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center"><Calendar className="w-5 h-5 text-teal-600" /></div>
                {p.is_active ? <span className="flex items-center gap-1 text-xs font-semibold text-teal-600"><CheckCircle2 className="w-4 h-4" /> Aktif</span>
                  : <span className="flex items-center gap-1 text-xs text-slate-400"><Circle className="w-3 h-3" /> Nonaktif</span>}
              </div>
              <div className="mt-4 font-extrabold text-lg text-slate-900">{p.label}</div>
              <div className="text-xs text-slate-400 font-mono">{p.kode} · {p.kecamatan_count} kecamatan</div>
              <div className="flex items-center gap-2 mt-4 flex-wrap">
                {p.has_excel && (
                  <Button size="sm" variant="outline" className="rounded-lg text-xs" onClick={() => downloadExcel(p)} data-testid={`download-excel-${p.kode}`}>
                    <Download className="w-3.5 h-3.5 mr-1" /> Unduh Excel
                  </Button>
                )}
                {canWrite && !p.is_active && <Button size="sm" variant="outline" className="rounded-lg text-xs" onClick={() => activate(p.id)} data-testid={`activate-${p.kode}`}>Aktifkan</Button>}
                {canWrite && (
                  <Button size="sm" variant="outline" className="rounded-lg text-xs" onClick={() => lock(p.id)} data-testid={`lock-${p.kode}`}>
                    {p.is_locked ? <><Lock className="w-3.5 h-3.5 mr-1" /> Terkunci</> : <><Unlock className="w-3.5 h-3.5 mr-1" /> Terbuka</>}
                  </Button>
                )}
                {canWrite && !p.is_active && <Button size="sm" variant="ghost" className="rounded-lg text-xs text-red-500 hover:text-red-600 ml-auto" onClick={() => del(p.id)} data-testid={`del-${p.kode}`}><Trash2 className="w-3.5 h-3.5" /></Button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
