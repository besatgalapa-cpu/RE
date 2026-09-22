import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { apiError } from "@/lib/api";
import { Zap, Lock, User, Loader2, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user && user !== false) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const u = await login(username, password);
      toast.success(`Selamat datang, ${u.name}`);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left visual panel */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden bg-slate-900">
        <img
          src="https://images.pexels.com/photos/21832812/pexels-photo-21832812.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
          alt="Energi terbarukan"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-teal-950/70" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
              <Zap className="w-7 h-7 text-white" fill="white" />
            </div>
            <div className="font-bold text-lg leading-tight">
              Pemerintah Kabupaten<br />Murung Raya
            </div>
          </div>
          <div>
            <h2 className="text-4xl font-extrabold leading-tight tracking-tight">
              Sistem Laporan<br />Rasio Elektrifikasi
            </h2>
            <p className="mt-4 text-teal-100/90 max-w-md text-[15px] leading-relaxed">
              Pemantauan cakupan listrik rumah tangga per kecamatan, desa, dan kelurahan
              di Kabupaten Murung Raya, Provinsi Kalimantan Tengah.
            </p>
            <div className="mt-8 flex items-center gap-2 text-sm text-teal-200/80">
              <ShieldCheck className="w-4 h-4" /> Dinas Energi dan Sumber Daya Mineral
            </div>
          </div>
          <div className="font-mono text-xs text-teal-300/60">© 2026 · ESDM Murung Raya</div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-md animate-fade-up">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-11 h-11 rounded-xl bg-teal-600 flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" fill="white" />
            </div>
            <div className="font-extrabold text-slate-900">Rasio Elektrifikasi</div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 p-8">
            <h1 className="text-2xl font-extrabold text-slate-900">Masuk Admin</h1>
            <p className="text-sm text-slate-500 mt-1">Silakan masuk untuk mengelola data laporan.</p>

            <form onSubmit={submit} className="mt-7 space-y-4">
              <div>
                <Label className="text-slate-700 text-sm font-medium">Username</Label>
                <div className="relative mt-1.5">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    data-testid="login-username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin"
                    className="pl-10 h-12 rounded-xl"
                    autoComplete="username"
                    required
                  />
                </div>
              </div>
              <div>
                <Label className="text-slate-700 text-sm font-medium">Password</Label>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    data-testid="login-password"
                    type={show ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 pr-10 h-12 rounded-xl"
                    autoComplete="current-password"
                    required
                  />
                  <button type="button" onClick={() => setShow(!show)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2" data-testid="login-error">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                data-testid="login-submit"
                disabled={loading}
                className="w-full h-12 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-[15px] transition-colors"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Masuk ke Dashboard"}
              </Button>
            </form>

            <div className="mt-6 rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-500">
              <span className="font-semibold text-slate-600">Demo:</span> username <span className="font-mono text-teal-700">admin</span> · password <span className="font-mono text-teal-700">adminRE1234#</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
