import { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard, FileSpreadsheet, Building2, MapPin, Users,
  Calendar, UserCog, Settings, LogOut, Menu, Zap, ChevronDown, Images,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const NAV = [
  { to: "/dashboard", label: "Ringkasan", icon: LayoutDashboard, tid: "nav-dashboard" },
  { to: "/upload", label: "Upload Excel", icon: FileSpreadsheet, tid: "nav-upload", perm: "data:write" },
  { to: "/kecamatan", label: "Data Kecamatan", icon: Building2, tid: "nav-kecamatan" },
  { to: "/desa", label: "Data Desa & Kelurahan", icon: MapPin, tid: "nav-desa" },
  { to: "/periode", label: "Periode Data", icon: Calendar, tid: "nav-periode" },
  { to: "/pengguna", label: "Pengguna Admin", icon: UserCog, tid: "nav-pengguna", perm: "user:manage" },
  { to: "/pengaturan", label: "Pengaturan", icon: Settings, tid: "nav-pengaturan" },
  { to: "/galeri", label: "Galeri Foto", icon: Images, tid: "nav-galeri" },
];

export default function Layout({ children }) {
  const [open, setOpen] = useState(false);
  const { user, logout, can } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const active = NAV.find((n) => location.pathname.startsWith(n.to));
  const visibleNav = NAV.filter((n) => !n.perm || can(n.perm));

  const doLogout = async () => {
    await logout();
    toast.success("Anda telah keluar");
    navigate("/login");
  };

  const initials = (user?.name || "AD").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 bottom-0 z-40 w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
        data-testid="sidebar"
      >
        <div className="h-20 flex items-center gap-3 px-6 border-b border-slate-100">
          <img
            src="https://thumb.wikimedia.org/wikipedia/commons/thumb/9/95/Lambang_Kabupaten_Murung_Raya.png/250px-Lambang_Kabupaten_Murung_Raya.png"
            alt="Lambang Kabupaten Murung Raya"
            className="w-11 h-11 object-contain drop-shadow-sm"
            data-testid="logo-murung-raya"
          />
          <div className="leading-tight">
            <div className="font-extrabold text-slate-900 text-[15px]">Rasio Elektrifikasi</div>
            <div className="text-xs text-slate-500 font-medium">Kab. Murung Raya</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <div className="px-3 pb-2 font-mono text-[10px] uppercase tracking-widest text-slate-400">Menu Utama</div>
          {visibleNav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              onClick={() => setOpen(false)}
              data-testid={n.tid}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-200 ${
                  isActive
                    ? "bg-teal-50 text-teal-700 shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <n.icon className={`w-[18px] h-[18px] ${isActive ? "text-teal-600" : "text-slate-400"}`} />
                  <span>{n.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="rounded-xl bg-gradient-to-br from-teal-600 to-teal-700 p-4 text-white">
            <div className="text-xs font-semibold opacity-90">Bagian Perekonomian &amp; SDA Setda</div>
            <div className="text-[11px] opacity-75 mt-0.5">Pemerintah Kabupaten Murung Raya, Kalimantan Tengah</div>
          </div>
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Main */}
      <div className="lg:pl-72">
        <header className="h-20 bg-white/85 backdrop-blur-md border-b border-slate-200 sticky top-0 z-20 px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setOpen(!open)}
              className="lg:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-100"
              data-testid="sidebar-toggle"
            >
              <Menu className="w-5 h-5 text-slate-700" />
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900">{active?.label || "Dashboard"}</h1>
              <p className="hidden sm:block text-xs text-slate-500">Sistem Informasi Laporan Rasio Elektrifikasi</p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full hover:bg-slate-100 transition-colors" data-testid="user-menu">
                <div className="w-9 h-9 rounded-full bg-teal-600 text-white flex items-center justify-center text-sm font-bold">{initials}</div>
                <div className="hidden sm:block text-left leading-tight">
                  <div className="text-sm font-semibold text-slate-900">{user?.username}</div>
                  <div className="text-[11px] text-slate-500">{user?.role}</div>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>{user?.username}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/pengaturan")} data-testid="menu-settings">
                <Settings className="w-4 h-4 mr-2" /> Pengaturan
              </DropdownMenuItem>
              <DropdownMenuItem onClick={doLogout} className="text-red-600 focus:text-red-600" data-testid="menu-logout">
                <LogOut className="w-4 h-4 mr-2" /> Keluar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="p-4 sm:p-8 max-w-[1500px] mx-auto">{children}</main>
      </div>
    </div>
  );
}
