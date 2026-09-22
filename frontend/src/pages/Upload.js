import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api, { apiError, API } from "@/lib/api";
import { fmtNum, titleCase } from "@/lib/format";
import {
  FileSpreadsheet, UploadCloud, CheckCircle2, AlertTriangle, Loader2,
  X, Database, ArrowRight, FileCheck2, Save,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const STEPS = ["Pilih Periode", "Upload File", "Validasi", "Simpan"];

export default function Upload() {
  const navigate = useNavigate();
  const fileRef = useRef();
  const [triwulan, setTriwulan] = useState("I");
  const [tahun, setTahun] = useState("2026");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [drag, setDrag] = useState(false);
  const step = preview ? 2 : file ? 1 : 0;

  const handleFile = async (f) => {
    if (!f) return;
    if (!/\.(xlsx|xls)$/i.test(f.name)) { toast.error("Format harus .xlsx / .xls"); return; }
    setFile(f); setPreview(null); setParsing(true);
    const fd = new FormData();
    fd.append("file", f);
    try {
      const token = localStorage.getItem("re_token");
      const { data } = await api.post("/upload/preview", fd, { headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${token}` } });
      setPreview(data);
      toast.success(`${data.summary.valid_rows} baris valid terbaca`);
    } catch (e) {
      toast.error(apiError(e));
      setFile(null);
    } finally { setParsing(false); }
  };

  const commit = async () => {
    setSaving(true);
    try {
      const { data } = await api.post("/upload/commit", {
        triwulan, tahun: Number(tahun), rows: preview.rows, set_active: true,
      });
      toast.success(data.message);
      setTimeout(() => navigate("/dashboard"), 800);
    } catch (e) { toast.error(apiError(e)); }
    finally { setSaving(false); }
  };

  const reset = () => { setFile(null); setPreview(null); };

  return (
    <div className="space-y-6 max-w-5xl" data-testid="upload-page">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900">Upload Data Excel</h2>
        <p className="text-sm text-slate-500">Alur: Upload → Validasi → Simpan → Dashboard diperbarui</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 sm:gap-4 bg-white rounded-2xl border border-slate-200 p-4">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2 sm:gap-4 flex-1">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i <= step ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-400"}`}>
                {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-xs sm:text-sm font-medium hidden sm:block ${i <= step ? "text-slate-900" : "text-slate-400"}`}>{s}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`h-0.5 flex-1 rounded ${i < step ? "bg-teal-500" : "bg-slate-100"}`} />}
          </div>
        ))}
      </div>

      {/* Periode */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><Database className="w-4 h-4 text-teal-600" /> 1. Pilih Periode Data</h3>
        <div className="flex flex-wrap gap-3">
          <div>
            <label className="text-xs text-slate-500">Triwulan</label>
            <Select value={triwulan} onValueChange={setTriwulan}>
              <SelectTrigger className="w-40 h-10 rounded-xl mt-1" data-testid="upload-triwulan"><SelectValue /></SelectTrigger>
              <SelectContent>{["I", "II", "III", "IV"].map((t) => <SelectItem key={t} value={t}>Triwulan {t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-slate-500">Tahun</label>
            <Select value={tahun} onValueChange={setTahun}>
              <SelectTrigger className="w-32 h-10 rounded-xl mt-1" data-testid="upload-tahun"><SelectValue /></SelectTrigger>
              <SelectContent>{["2024", "2025", "2026", "2027"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Dropzone */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><UploadCloud className="w-4 h-4 text-teal-600" /> 2. Unggah File Excel</h3>
        {!file ? (
          <div
            data-testid="upload-dropzone"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]); }}
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors ${drag ? "border-teal-500 bg-teal-50" : "border-slate-200 hover:border-teal-400 hover:bg-slate-50"}`}
          >
            <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto"><FileSpreadsheet className="w-7 h-7 text-teal-600" /></div>
            <p className="mt-4 font-semibold text-slate-900">Tarik file ke sini atau klik untuk memilih</p>
            <p className="text-sm text-slate-400 mt-1">Format .xlsx sesuai template RE Murung Raya</p>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" hidden onChange={(e) => handleFile(e.target.files[0])} data-testid="upload-input" />
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center"><FileCheck2 className="w-5 h-5 text-teal-700" /></div>
              <div>
                <div className="font-semibold text-slate-900 text-sm">{file.name}</div>
                <div className="text-xs text-slate-400">{(file.size / 1024).toFixed(0)} KB</div>
              </div>
            </div>
            <button onClick={reset} className="w-8 h-8 rounded-lg hover:bg-slate-200 flex items-center justify-center" data-testid="upload-remove"><X className="w-4 h-4 text-slate-500" /></button>
          </div>
        )}
        {parsing && <div className="flex items-center gap-2 mt-3 text-sm text-teal-600"><Loader2 className="w-4 h-4 animate-spin" /> Memvalidasi file...</div>}
      </div>

      {/* Validation results */}
      {preview && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 animate-fade-up" data-testid="validation-results">
          <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-600" /> 3. Hasil Validasi</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3"><div className="text-xs text-slate-500">Total Baris</div><div className="text-xl font-extrabold font-mono text-slate-900">{preview.summary.total_rows}</div></div>
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3"><div className="text-xs text-emerald-600">Baris Valid</div><div className="text-xl font-extrabold font-mono text-emerald-700">{preview.summary.valid_rows}</div></div>
            <div className="rounded-xl bg-red-50 border border-red-200 p-3"><div className="text-xs text-red-600">Baris Error</div><div className="text-xl font-extrabold font-mono text-red-700">{preview.summary.error_rows}</div></div>
            <div className="rounded-xl bg-sky-50 border border-sky-200 p-3"><div className="text-xs text-sky-600">Total RT</div><div className="text-xl font-extrabold font-mono text-sky-700">{fmtNum(preview.summary.totals.total_rt)}</div></div>
          </div>

          {preview.summary.error_rows > 0 && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 mb-4 text-sm text-amber-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <div>{preview.summary.errors.map((e, i) => <div key={i}>{titleCase(e.nama)}: {e.errors.join(", ")}</div>)}</div>
            </div>
          )}

          {/* Preview table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead><tr className="bg-slate-50 text-left text-slate-500 text-xs uppercase">
                <th className="px-3 py-2">Kecamatan</th><th className="px-3 py-2 text-right">Total RT</th>
                <th className="px-3 py-2 text-right">PLN</th><th className="px-3 py-2 text-right">Non-PLN</th>
                <th className="px-3 py-2 text-right">Belum</th><th className="px-3 py-2 text-right">RE %</th><th className="px-3 py-2 text-center">Status</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {preview.rows.map((r, i) => (
                  <tr key={i} data-testid={`preview-row-${i}`}>
                    <td className="px-3 py-2 font-medium text-slate-800">{titleCase(r.nama)}</td>
                    <td className="px-3 py-2 text-right font-mono">{fmtNum(r.total_rt)}</td>
                    <td className="px-3 py-2 text-right font-mono text-sky-700">{fmtNum(r.rt_pln)}</td>
                    <td className="px-3 py-2 text-right font-mono text-emerald-700">{fmtNum(r.rt_nonpln)}</td>
                    <td className="px-3 py-2 text-right font-mono text-amber-700">{fmtNum(r.rt_belum)}</td>
                    <td className="px-3 py-2 text-right font-mono font-semibold">{r.re_total}%</td>
                    <td className="px-3 py-2 text-center">
                      {r.valid ? <CheckCircle2 className="w-4 h-4 text-emerald-500 inline" /> : <AlertTriangle className="w-4 h-4 text-red-500 inline" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-3 mt-5">
            <Button variant="outline" onClick={reset} className="rounded-xl" data-testid="upload-cancel">Batal</Button>
            <Button onClick={commit} disabled={saving || preview.summary.valid_rows === 0}
              className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold" data-testid="upload-commit">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Simpan & Perbarui Dashboard
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
