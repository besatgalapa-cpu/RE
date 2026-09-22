import { useEffect, useRef, useState } from "react";
import api, { apiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { MapPin, X, ZoomIn, Loader2, Plus, Trash2, UploadCloud, ImageOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

const KATEGORI = ["Wilayah", "Energi Terbarukan", "Jaringan Listrik", "Kegiatan"];

function PhotoImg({ item, variant = "full", className }) {
  const [src, setSrc] = useState(item.external_url || null);
  useEffect(() => {
    if (item.external_url) { setSrc(item.external_url); return; }
    let url;
    const v = variant === "thumb" && item.has_thumb ? "?variant=thumb" : "";
    api.get(`/galeri/file/${item.id}${v}`, { responseType: "blob" })
      .then((r) => { url = URL.createObjectURL(r.data); setSrc(url); })
      .catch(() => setSrc(null));
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [item.id, item.external_url, variant, item.has_thumb]);
  if (!src) return <div className={`flex items-center justify-center bg-slate-100 ${className}`}><ImageOff className="w-8 h-8 text-slate-300" /></div>;
  return <img src={src} alt={item.judul} loading="lazy" className={className} />;
}

export default function Galeri() {
  const { can } = useAuth();
  const canWrite = can("galeri:write");
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kat, setKat] = useState("Semua");
  const [lightbox, setLightbox] = useState(null);
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ judul: "", kecamatan: "", kategori: "Wilayah" });
  const [file, setFile] = useState(null);
  const fileRef = useRef();

  const load = () => {
    setLoading(true);
    api.get("/galeri").then((r) => setPhotos(r.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const filtered = kat === "Semua" ? photos : photos.filter((p) => p.kategori === kat);

  const upload = async () => {
    if (!file) { toast.error("Pilih foto terlebih dahulu"); return; }
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("judul", form.judul);
    fd.append("kecamatan", form.kecamatan);
    fd.append("kategori", form.kategori);
    try {
      await api.post("/galeri/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Foto berhasil diunggah");
      setOpen(false); setFile(null); setForm({ judul: "", kecamatan: "", kategori: "Wilayah" });
      load();
    } catch (e) { toast.error(apiError(e)); }
    finally { setUploading(false); }
  };

  const del = async (id) => {
    try { await api.delete(`/galeri/${id}`); toast.success("Foto dihapus"); setLightbox(null); load(); }
    catch (e) { toast.error(apiError(e)); }
  };

  return (
    <div className="space-y-6" data-testid="galeri-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Galeri Foto</h2>
          <p className="text-sm text-slate-500">Dokumentasi program elektrifikasi Kabupaten Murung Raya</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          {canWrite && (
          <DialogTrigger asChild>
            <Button className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white" data-testid="galeri-upload-btn">
              <Plus className="w-4 h-4 mr-2" /> Upload Foto
            </Button>
          </DialogTrigger>
          )}
          <DialogContent>
            <DialogHeader><DialogTitle>Upload Foto Dokumentasi</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center cursor-pointer hover:border-teal-400 hover:bg-slate-50 transition-colors"
                data-testid="galeri-dropzone"
              >
                <UploadCloud className="w-8 h-8 text-teal-600 mx-auto" />
                <p className="text-sm font-medium text-slate-700 mt-2">{file ? file.name : "Klik untuk pilih foto"}</p>
                <p className="text-xs text-slate-400">JPG / PNG / WEBP · Maks 10 MB</p>
                <input ref={fileRef} type="file" accept="image/*" hidden data-testid="galeri-file-input"
                  onChange={(e) => setFile(e.target.files[0] || null)} />
              </div>
              <div><Label className="text-sm">Judul Foto</Label>
                <Input value={form.judul} onChange={(e) => setForm({ ...form, judul: e.target.value })} className="mt-1 rounded-xl" placeholder="Contoh: PLTS Terpusat Desa X" data-testid="galeri-judul" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-sm">Kecamatan</Label>
                  <Input value={form.kecamatan} onChange={(e) => setForm({ ...form, kecamatan: e.target.value })} className="mt-1 rounded-xl" placeholder="Contoh: Murung" data-testid="galeri-kecamatan" /></div>
                <div><Label className="text-sm">Kategori</Label>
                  <Select value={form.kategori} onValueChange={(v) => setForm({ ...form, kategori: v })}>
                    <SelectTrigger className="mt-1 rounded-xl" data-testid="galeri-kategori"><SelectValue /></SelectTrigger>
                    <SelectContent>{KATEGORI.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
                  </Select></div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={upload} disabled={uploading || !file} className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white" data-testid="galeri-save">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UploadCloud className="w-4 h-4 mr-2" />} Unggah
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap gap-2">
        {["Semua", ...KATEGORI].map((k) => (
          <button key={k} onClick={() => setKat(k)} data-testid={`galeri-filter-${k}`}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors ${kat === k ? "bg-teal-600 text-white border-teal-600" : "bg-white text-slate-600 border-slate-200 hover:border-teal-400"}`}>
            {k}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center h-40 items-center"><Loader2 className="w-7 h-7 animate-spin text-teal-600" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400" data-testid="galeri-empty">
          <ImageOff className="w-10 h-10 mx-auto mb-3 text-slate-300" /> Belum ada foto. Klik "Upload Foto" untuk menambahkan.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filtered.map((p, i) => (
            <div key={p.id} data-testid={`galeri-card-${i}`}
              className="group relative bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:shadow-slate-200/60 hover:-translate-y-1 transition-all duration-300 animate-fade-up"
              style={{ animationDelay: `${i * 60}ms` }}>
              <div className="aspect-[4/3] overflow-hidden bg-slate-100 cursor-pointer" onClick={() => setLightbox(p)}>
                <PhotoImg item={p} variant="thumb" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-slate-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <ZoomIn className="absolute top-1/3 left-1/2 -translate-x-1/2 w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <div className="p-4 flex items-start justify-between gap-2">
                <div onClick={() => setLightbox(p)} className="cursor-pointer">
                  <div className="font-bold text-slate-900 text-sm">{p.judul}</div>
                  <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                    <MapPin className="w-3.5 h-3.5" /> {p.kecamatan ? `Kec. ${p.kecamatan}` : "Kab. Murung Raya"}
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 font-medium">{p.kategori}</span>
                  </div>
                </div>
                <button onClick={() => del(p.id)} className={`p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors ${canWrite ? "" : "hidden"}`} data-testid={`galeri-del-${i}`}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {lightbox && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setLightbox(null)} data-testid="galeri-lightbox">
          <button className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white" data-testid="galeri-close"><X className="w-5 h-5" /></button>
          <div className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <PhotoImg item={lightbox} variant="full" className="w-full max-h-[75vh] object-contain rounded-2xl" />
            <div className="mt-4 text-center text-white">
              <div className="font-bold text-lg">{lightbox.judul}</div>
              <div className="text-sm text-slate-300">{lightbox.kecamatan ? `Kec. ${lightbox.kecamatan} · ` : ""}{lightbox.kategori}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
