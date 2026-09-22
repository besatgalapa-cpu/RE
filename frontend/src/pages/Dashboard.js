import { useEffect, useState } from "react";
import api from "@/lib/api";
import { fmtNum, fmtPct, titleCase, COLORS, reStatus } from "@/lib/format";
import {
  Home, Zap, PlugZap, Sun, AlertTriangle, TrendingUp, TrendingDown,
  Building2, MapPin, Loader2, Target,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart, Legend,
} from "recharts";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const KPI_META = [
  { key: "total_rt", title: "Total Rumah Tangga", icon: Home, color: "text-slate-700", bg: "bg-slate-100", tid: "kpi-total-rt" },
  { key: "re_total", title: "Rasio Elektrifikasi", icon: Zap, color: "text-teal-600", bg: "bg-teal-50", pct: true, tid: "kpi-rasio-elektrifikasi" },
  { key: "rt_pln", title: "RT Berlistrik PLN", icon: PlugZap, color: "text-sky-600", bg: "bg-sky-50", tid: "kpi-rt-pln" },
  { key: "rt_nonpln", title: "RT Berlistrik Non-PLN", icon: Sun, color: "text-emerald-600", bg: "bg-emerald-50", tid: "kpi-rt-nonpln" },
  { key: "rt_belum", title: "RT Belum Berlistrik", icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50", tid: "kpi-rt-belum" },
];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [periodId, setPeriodId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [kecMetric, setKecMetric] = useState("re_pln");

  const load = (pid) => {
    setLoading(true);
    api.get("/dashboard", { params: pid ? { period_id: pid } : {} })
      .then((r) => { setData(r.data); setPeriodId(r.data.period?.id || null); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(null); }, []);

  if (loading && !data)
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-teal-600" /></div>;

  if (!data?.kpi)
    return <div className="text-center py-24 text-slate-500" data-testid="dashboard-empty">Belum ada data. Silakan unggah Excel terlebih dahulu.</div>;

  const { kpi, per_kecamatan, proporsi, trend, period, periods } = data;
  const pieColors = [COLORS.pln, COLORS.nonpln, COLORS.belum];
  const subtext = {
    total_rt: `${kpi.jumlah_kecamatan} Kecamatan · ${fmtNum(kpi.jumlah_desa_kel)} Desa/Kel`,
    re_total: kpi.re_delta != null ? `${kpi.re_delta >= 0 ? "+" : ""}${kpi.re_delta}% dari ${kpi.prev_label}` : "Periode dasar",
    rt_pln: `${fmtPct(kpi.re_pln)} dari total RT`,
    rt_nonpln: `${fmtPct(kpi.re_nonpln)} · PLTS / EBT / Mandiri`,
    rt_belum: `${fmtPct(kpi.pct_belum)} perlu intervensi`,
  };

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      {/* Header + period selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-extrabold text-slate-900">Ringkasan Elektrifikasi</h2>
            <span className="px-2.5 py-1 rounded-full bg-teal-600 text-white text-xs font-semibold" data-testid="active-period-badge">{period?.label}</span>
          </div>
          <p className="text-sm text-slate-500 mt-1">Kabupaten Murung Raya · Provinsi Kalimantan Tengah</p>
        </div>
        <Select value={periodId || ""} onValueChange={(v) => load(v)}>
          <SelectTrigger className="w-56 h-11 rounded-xl bg-white" data-testid="period-selector">
            <SelectValue placeholder="Pilih Periode" />
          </SelectTrigger>
          <SelectContent>
            {periods.map((p) => (
              <SelectItem key={p.id} value={p.id} data-testid={`period-opt-${p.kode}`}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {KPI_META.map((m, i) => {
          const val = m.pct ? fmtPct(kpi[m.key]) : fmtNum(kpi[m.key]);
          const up = m.key === "re_total" && kpi.re_delta != null && kpi.re_delta >= 0;
          const down = m.key === "re_total" && kpi.re_delta != null && kpi.re_delta < 0;
          return (
            <div key={m.key} data-testid={m.tid}
              className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg hover:shadow-slate-200/60 hover:-translate-y-0.5 transition-all duration-300 animate-fade-up"
              style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex items-center justify-between">
                <div className={`w-11 h-11 rounded-xl ${m.bg} flex items-center justify-center`}>
                  <m.icon className={`w-[22px] h-[22px] ${m.color}`} />
                </div>
                {(up || down) && (
                  <span className={`flex items-center gap-1 text-xs font-semibold ${up ? "text-emerald-600" : "text-red-500"}`}>
                    {up ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    {Math.abs(kpi.re_delta)}%
                  </span>
                )}
              </div>
              <div className={`mt-4 text-2xl font-extrabold ${m.color} font-mono`}>{val}</div>
              <div className="text-sm font-semibold text-slate-700 mt-0.5">{m.title}</div>
              <div className="text-xs text-slate-400 mt-1">{subtext[m.key]}</div>
            </div>
          );
        })}
      </div>

      {/* Target banner */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-white" data-testid="target-banner">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center"><Target className="w-6 h-6" /></div>
          <div>
            <div className="font-bold">Rasio Elektrifikasi Saat Ini: {fmtPct(kpi.re_total)}</div>
            <div className="text-sm text-teal-100">Menuju target daerah 92,50% pada 2026</div>
          </div>
        </div>
        <div className="w-full sm:w-72">
          <div className="h-3 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: `${Math.min(kpi.re_total / 92.5 * 100, 100)}%` }} />
          </div>
          <div className="text-xs text-teal-100 mt-1 text-right">{fmtPct(Math.min(kpi.re_total / 92.5 * 100, 100))} dari target</div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Donut */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5" data-testid="chart-proporsi">
          <h3 className="font-bold text-slate-900">Proporsi Sumber Listrik</h3>
          <p className="text-xs text-slate-500 mb-2">PLN vs Non-PLN vs Belum Berlistrik</p>
          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie data={proporsi} dataKey="value" nameKey="name" innerRadius={58} outerRadius={90} paddingAngle={3}>
                {proporsi.map((e, i) => <Cell key={i} fill={pieColors[i]} />)}
              </Pie>
              <Tooltip formatter={(v) => fmtNum(v) + " RT"} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {proporsi.map((p, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm" style={{ background: pieColors[i] }} />{p.name}</span>
                <span className="font-mono font-semibold text-slate-700">{fmtNum(p.value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar per kecamatan */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 lg:col-span-2" data-testid="chart-kecamatan">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <div>
              <h3 className="font-bold text-slate-900">
                {kecMetric === "re_pln" ? "Rasio Elektrifikasi PLN per Kecamatan"
                  : kecMetric === "re_nonpln" ? "Rasio Elektrifikasi Non-PLN per Kecamatan"
                  : "Rasio Elektrifikasi per Kecamatan"}
              </h3>
              <p className="text-xs text-slate-500 mb-2">{per_kecamatan.length} kecamatan, diurutkan tertinggi</p>
            </div>
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50" data-testid="kec-metric-toggle">
              {[
                { k: "re_pln", label: "PLN" },
                { k: "re_nonpln", label: "Non-PLN" },
                { k: "re_total", label: "Total" },
              ].map((m) => (
                <button key={m.k} onClick={() => setKecMetric(m.k)} data-testid={`kec-metric-${m.k}`}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${kecMetric === m.k ? "bg-white shadow-sm text-teal-700" : "text-slate-500 hover:text-slate-700"}`}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={[...per_kecamatan].sort((a, b) => b[kecMetric] - a[kecMetric])} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "#94a3b8" }} unit="%" />
              <YAxis type="category" dataKey="nama" width={120} tick={{ fontSize: 11, fill: "#475569" }} tickFormatter={titleCase} />
              <Tooltip formatter={(v) => fmtPct(v)} cursor={{ fill: "#f8fafc" }} />
              <Bar dataKey={kecMetric} radius={[0, 6, 6, 0]} barSize={16}>
                {per_kecamatan.map((e, i) => (
                  <Cell key={i} fill={kecMetric === "re_pln" ? COLORS.pln : kecMetric === "re_nonpln" ? COLORS.nonpln
                    : (e.re_total >= 90 ? COLORS.primary : e.re_total >= 70 ? COLORS.pln : COLORS.belum)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Trend + PLN/NonPLN stacked */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5" data-testid="chart-trend">
          <h3 className="font-bold text-slate-900">Tren Rasio Elektrifikasi Antar Triwulan</h3>
          <p className="text-xs text-slate-500 mb-2">Progres cakupan listrik per periode</p>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={trend} margin={{ left: -10, right: 10 }}>
              <defs>
                <linearGradient id="reGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="periode" tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#94a3b8" }} unit="%" />
              <Tooltip formatter={(v) => fmtPct(v)} />
              <Area type="monotone" dataKey="re" stroke={COLORS.primary} strokeWidth={3} fill="url(#reGrad)" name="Rasio Elektrifikasi" dot={{ r: 4, fill: COLORS.primary }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5" data-testid="chart-stacked">
          <h3 className="font-bold text-slate-900">Komposisi PLN vs Non-PLN per Kecamatan</h3>
          <p className="text-xs text-slate-500 mb-2">Jumlah rumah tangga berlistrik</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={per_kecamatan} margin={{ left: -5, right: 10 }}>
              <CartesianGrid vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="nama" tick={{ fontSize: 9, fill: "#94a3b8" }} interval={0} angle={-35} textAnchor="end" height={70} tickFormatter={(v) => titleCase(v).slice(0, 10)} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <Tooltip formatter={(v) => fmtNum(v) + " RT"} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="rt_pln" stackId="a" fill={COLORS.pln} name="PLN" radius={[0, 0, 0, 0]} />
              <Bar dataKey="rt_nonpln" stackId="a" fill={COLORS.nonpln} name="Non-PLN" />
              <Bar dataKey="rt_belum" stackId="a" fill={COLORS.belum} name="Belum" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
