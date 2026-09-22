import { useEffect, useState } from "react";
import api, { apiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { UserCog, Loader2, Plus, Trash2, ShieldCheck, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

const ROLES = ["Super Admin", "Verifikator Data", "Viewer Eksekutif"];

export default function Pengguna() {
  const { user: me } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ username: "", name: "", password: "", role: "Verifikator Data" });

  const load = () => { setLoading(true); api.get("/users").then((r) => setRows(r.data)).finally(() => setLoading(false)); };
  useEffect(load, []);

  const create = async () => {
    try { await api.post("/users", form); toast.success("Pengguna ditambahkan"); setOpen(false); setForm({ username: "", name: "", password: "", role: "Verifikator Data" }); load(); }
    catch (e) { toast.error(apiError(e)); }
  };
  const toggle = async (u) => { await api.patch(`/users/${u.id}`, { is_active: !u.is_active }); load(); };
  const del = async (id) => { try { await api.delete(`/users/${id}`); toast.success("Pengguna dihapus"); load(); } catch (e) { toast.error(apiError(e)); } };

  const roleColor = (r) => r === "Super Admin" ? "bg-teal-50 text-teal-700 border-teal-200" : r === "Verifikator Data" ? "bg-sky-50 text-sky-700 border-sky-200" : "bg-slate-100 text-slate-600 border-slate-200";

  return (
    <div className="space-y-5" data-testid="pengguna-page">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-extrabold text-slate-900">Pengguna Admin</h2><p className="text-sm text-slate-500">Kelola operator & verifikator data</p></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white" data-testid="add-user-btn"><Plus className="w-4 h-4 mr-2" /> Tambah Pengguna</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Tambah Pengguna Baru</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label className="text-sm">Nama Lengkap</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 rounded-xl" data-testid="user-name" /></div>
              <div><Label className="text-sm">Username</Label><Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="mt-1 rounded-xl" data-testid="user-username" /></div>
              <div><Label className="text-sm">Password</Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="mt-1 rounded-xl" data-testid="user-password" /></div>
              <div><Label className="text-sm">Peran</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}><SelectTrigger className="mt-1 rounded-xl" data-testid="user-role"><SelectValue /></SelectTrigger>
                  <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select>
              </div>
            </div>
            <DialogFooter><Button onClick={create} className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white" data-testid="save-user-btn">Simpan</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? <div className="flex justify-center h-40 items-center"><Loader2 className="w-7 h-7 animate-spin text-teal-600" /></div> : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 text-left text-slate-500 text-xs uppercase tracking-wide">
              <th className="px-4 py-3 font-semibold">Pengguna</th><th className="px-4 py-3 font-semibold">Username</th>
              <th className="px-4 py-3 font-semibold">Peran</th><th className="px-4 py-3 font-semibold text-center">Status</th><th className="px-4 py-3 font-semibold text-right">Aksi</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/70" data-testid={`user-row-${u.username}`}>
                  <td className="px-4 py-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-teal-600 text-white flex items-center justify-center text-sm font-bold">{(u.name || "?").slice(0, 1)}</div>
                    <span className="font-semibold text-slate-900">{u.name}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-500">{u.username}</td>
                  <td className="px-4 py-3"><span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${roleColor(u.role)}`}>{u.role === "Super Admin" && <ShieldCheck className="w-3 h-3" />}{u.role}</span></td>
                  <td className="px-4 py-3 text-center">
                    <Switch checked={u.is_active} onCheckedChange={() => toggle(u)} disabled={u.id === me?.id} data-testid={`toggle-${u.username}`} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    {u.id !== me?.id && <button onClick={() => del(u.id)} className="text-red-500 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50" data-testid={`del-user-${u.username}`}><Trash2 className="w-4 h-4" /></button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
