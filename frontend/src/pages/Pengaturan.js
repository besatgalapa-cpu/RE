import { useEffect, useState } from "react";
import api, { apiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Settings, Loader2, Save, Building, Target, Database, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Pengaturan() {
  const { can } = useAuth();
  const [s, setS] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { api.get("/settings").then((r) => setS(r.data)).finally(() => setLoading(false)); }, []);

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await api.put("/settings", {
        instansi_nama: s.instansi_nama, provinsi: s.provinsi, kepala_dinas: s.kepala_dinas,
        target_re: Number(s.target_re), target_tahun: Number(s.target_tahun), bobot_non_pln: Number(s.bobot_non_pln),
      });
      setS(data); toast.success("Pengaturan disimpan");
    } catch (e) { toast.error(apiError(e)); } finally { setSaving(false); }
  };

  const canWrite = can("data:write");

  if (loading || !s) return <div className="flex justify-center h-40 items-center"><Loader2 className="w-7 h-7 animate-spin text-teal-600" /></div>;

  const set = (k) => (e) => setS({ ...s, [k]: e.target.value });

  return (
    <div className="space-y-6 max-w-3xl" data-testid="pengaturan-page">
      <div><h2 className="text-2xl font-extrabold text-slate-900">Pengaturan Sistem</h2><p className="text-sm text-slate-500">Konfigurasi instansi & target elektrifikasi daerah</p></div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h3 className="font-bold text-slate-900 flex items-center gap-2"><Building className="w-4 h-4 text-teal-600" /> Profil Instansi</h3>
        <div><Label className="text-sm">Nama Instansi</Label><Input value={s.instansi_nama} onChange={set("instansi_nama")} className="mt-1 rounded-xl" data-testid="set-instansi" /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><Label className="text-sm">Provinsi</Label><Input value={s.provinsi} onChange={set("provinsi")} className="mt-1 rounded-xl" data-testid="set-provinsi" /></div>
          <div><Label className="text-sm">Kepala Dinas</Label><Input value={s.kepala_dinas} onChange={set("kepala_dinas")} className="mt-1 rounded-xl" data-testid="set-kepala" /></div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h3 className="font-bold text-slate-900 flex items-center gap-2"><Target className="w-4 h-4 text-teal-600" /> Target Rasio Elektrifikasi Daerah (RUKD)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div><Label className="text-sm">Target RE (%)</Label><Input type="number" step="0.01" value={s.target_re} onChange={set("target_re")} className="mt-1 rounded-xl font-mono" data-testid="set-target-re" /></div>
          <div><Label className="text-sm">Tahun Target</Label><Input type="number" value={s.target_tahun} onChange={set("target_tahun")} className="mt-1 rounded-xl font-mono" data-testid="set-target-tahun" /></div>
          <div><Label className="text-sm">Bobot Non-PLN (%)</Label><Input type="number" step="0.1" value={s.bobot_non_pln} onChange={set("bobot_non_pln")} className="mt-1 rounded-xl font-mono" data-testid="set-bobot" /></div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-2"><Database className="w-4 h-4 text-teal-600" /> Basis Data</h3>
        <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          <ShieldCheck className="w-4 h-4" /> Data terhubung dengan MongoDB. Backup otomatis aktif pada server.
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving || !canWrite} className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold disabled:opacity-50" data-testid="save-settings-btn">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />} {canWrite ? "Simpan Pengaturan" : "Hanya Baca"}
        </Button>
      </div>
    </div>
  );
}
