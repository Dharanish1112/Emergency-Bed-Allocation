import { useState, useEffect } from 'react';
import {
  Building2, BookOpen, TrendingUp, Clock, Plus, Trash2,
  MapPin, BarChart3, PieChart, Shield, Phone, Hash, Activity
} from 'lucide-react';
import toast from 'react-hot-toast';
import GovHeader from '../components/GovHeader';
import StatsCard from '../components/StatsCard';
import { adminStats, adminHospitals as EXCEL_ADMIN_HOSPITALS } from '../data/dummy';
import { getLiveStats, getRequests } from '../data/store';

// ── i18n ─────────────────────────────────────────────────────
const LANG = {
  en: {
    govTitle:       'Government of Tamil Nadu',
    govSub:         'Health & Family Welfare Department',
    sysTitle:       'Smart Emergency Bed Booking System',
    portalLabel:    'Admin Portal',
    adminPortal:    'Admin Portal',
    systemAdmin:    'System Administrator',
    logout:         'Logout',
    langToggle:     'தமிழ்',
    totalHospitals: 'Total Hospitals',
    totalBookings:  'Total Bookings',
    successRate:    'Success Rate',
    today:          'Today',
    registered:     'Registered',
    allTime:        'All time',
    completed:      'Completed',
    peakTime:       'Peak Time',
    weeklyBookings: 'Weekly Bookings',
    weeklySub:      "This week's emergency requests",
    analytics:      'Analytics',
    emergencyTypes: 'Emergency Types',
    hospitalMap:    'Hospital Network Map',
    mapSub:         'Hover over pins to see hospitals',
    interactiveMap: 'Interactive Map',
    hospitalMgmt:   'Hospital Management',
    hospitalMgmtSub:'hospitals registered',
    addHospital:    'Add Hospital',
    hospitalName:   'Hospital Name *',
    location:       'Location / City *',
    beds:           'Total Beds',
    cancel:         'Cancel',
    hospital:       'Hospital',
    locationCol:    'Location',
    bedsCol:        'Beds',
    bookings:       'Bookings',
    status:         'Status',
    active:         'Active',
    maintenance:    'Maintenance',
    footerNote:     'This is an official portal of the Tamil Nadu Health Department. For emergencies call 108.',
    adminId:        'Admin ID',
    adminLocation:  'Location',
  },
  ta: {
    govTitle:       'தமிழ்நாடு அரசு',
    govSub:         'சுகாதாரம் மற்றும் குடும்ப நலத்துறை',
    sysTitle:       'அவசர படுக்கை முன்பதிவு அமைப்பு',
    portalLabel:    'நிர்வாக போர்டல்',
    adminPortal:    'நிர்வாக போர்டல்',
    systemAdmin:    'கணினி நிர்வாகி',
    logout:         'வெளியேறு',
    langToggle:     'English',
    totalHospitals: 'மொத்த மருத்துவமனைகள்',
    totalBookings:  'மொத்த முன்பதிவுகள்',
    successRate:    'வெற்றி விகிதம்',
    today:          'இன்று',
    registered:     'பதிவு செய்யப்பட்டது',
    allTime:        'மொத்தம்',
    completed:      'நிறைவு செய்யப்பட்டது',
    peakTime:       'உச்ச நேரம்',
    weeklyBookings: 'வாராந்திர முன்பதிவுகள்',
    weeklySub:      'இந்த வாரத்தின் அவசர கோரிக்கைகள்',
    analytics:      'பகுப்பாய்வு',
    emergencyTypes: 'அவசர வகைகள்',
    hospitalMap:    'மருத்துவமனை வலைப்பட வரைபடம்',
    mapSub:         'மருத்துவமனைகளை காண குறிகளை நகர்த்தவும்',
    interactiveMap: 'ஊடாடும் வரைபடம்',
    hospitalMgmt:   'மருத்துவமனை மேலாண்மை',
    hospitalMgmtSub:'மருத்துவமனைகள் பதிவு செய்யப்பட்டன',
    addHospital:    'மருத்துவமனை சேர்க்க',
    hospitalName:   'மருத்துவமனை பெயர் *',
    location:       'இடம் / நகரம் *',
    beds:           'மொத்த படுக்கைகள்',
    cancel:         'ரத்து செய்',
    hospital:       'மருத்துவமனை',
    locationCol:    'இடம்',
    bedsCol:        'படுக்கைகள்',
    bookings:       'முன்பதிவுகள்',
    status:         'நிலை',
    active:         'செயலில்',
    maintenance:    'பராமரிப்பு',
    footerNote:     'இது தமிழ்நாடு சுகாதாரத்துறையின் அதிகாரப்பூர்வ போர்டல். அவசரநிலைக்கு 108 அழைக்கவும்.',
    adminId:        'நிர்வாகி எண்',
    adminLocation:  'இடம்',
  },
};

function getStoredUser() {
  try { return JSON.parse(localStorage.getItem('currentUser') || 'null'); } catch { return null; }
}

export default function Admin() {
  const user = getStoredUser();
  const [lang, setLang] = useState('en');
  const [hospitals, setHospitals] = useState(EXCEL_ADMIN_HOSPITALS);
  const [form, setForm] = useState({ name: '', location: '', beds: '' });
  const [showForm, setShowForm] = useState(false);
  const [liveStats, setLiveStats] = useState(getLiveStats());
  const [recentBookings, setRecentBookings] = useState([]);

  const t = LANG[lang];

  // Poll live stats every 3s
  useEffect(() => {
    const sync = () => {
      const stats = getLiveStats();
      setLiveStats(stats);
      const reqs = getRequests().slice(0, 5); // latest 5
      setRecentBookings(reqs);
      // bump booking count in hospital table
      setHospitals(prev => prev.map(h => {
        const count = getRequests().filter(r => r.hospitalName === h.name).length;
        return count > 0 ? { ...h, bookings: h.bookings + count } : h;
      }));
    };
    sync();
    const interval = setInterval(sync, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!form.name || !form.location) return;
    const newH = {
      id: Date.now(),
      name: form.name,
      location: form.location,
      beds: parseInt(form.beds) || 0,
      status: 'active',
      bookings: 0,
    };
    setHospitals(prev => [newH, ...prev]);
    setForm({ name: '', location: '', beds: '' });
    setShowForm(false);
    toast.success(`${form.name} added successfully`);
  };

  const handleDelete = (id, name) => {
    setHospitals(prev => prev.filter(h => h.id !== id));
    toast.error(`${name} removed`);
  };

  const chartData = [
    { label: 'Mon', value: 42 },
    { label: 'Tue', value: 68 },
    { label: 'Wed', value: 55 },
    { label: 'Thu', value: 89 },
    { label: 'Fri', value: 73 },
    { label: 'Sat', value: 95 },
    { label: 'Sun', value: 61 },
  ];
  const maxVal = Math.max(...chartData.map(d => d.value));

  const pieData = [
    { label: 'Cardiac', pct: 32, color: 'bg-red-500' },
    { label: 'Trauma',  pct: 28, color: 'bg-orange-500' },
    { label: 'Stroke',  pct: 18, color: 'bg-purple-500' },
    { label: 'Other',   pct: 22, color: 'bg-blue-500' },
  ];

  const infoItems = [
    { icon: <Hash size={11} />,    label: t.adminId,       value: user?.id || '—' },
    { icon: <MapPin size={11} />,  label: t.adminLocation, value: user?.location || '—' },
    { icon: <Activity size={11} />,label: t.status,        value: t.systemAdmin, green: true },
  ];

  return (
    <div className="min-h-screen bg-[#f0f4f8] font-sans flex flex-col">

      {/* ── GOVERNMENT HEADER ─────────────────────────────── */}
      <GovHeader
        role="admin"
        user={user}
        lang={lang}
        setLang={setLang}
        t={{ ...t, status: t.systemAdmin }}
        infoItems={infoItems}
      />

      {/* ── STATS BAR ─────────────────────────────────────── */}
      <div className="bg-[#1e4d8c] border-b border-[#163d73]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatTile value={adminStats.totalHospitals} label={t.totalHospitals} color="blue" />
            <StatTile value={adminStats.totalBookings + liveStats.totalBookings} label={t.totalBookings} color="green" />
            <StatTile value={`${adminStats.successRate}%`} label={t.successRate} color="purple" />
            <StatTile value={liveStats.totalBookings || adminStats.todayBookings} label={t.today} color="orange" />
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ──────────────────────────────────── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard icon={Building2}  label={t.totalHospitals} value={adminStats.totalHospitals} sub={t.registered} color="blue" trend={4} />
          <StatsCard icon={BookOpen}   label={t.totalBookings}  value={(adminStats.totalBookings + liveStats.totalBookings).toLocaleString()} sub={t.allTime} color="green" trend={18} />
          <StatsCard icon={TrendingUp} label={t.successRate}    value={`${adminStats.successRate}%`} sub={t.completed} color="purple" trend={2} />
          <StatsCard icon={Clock}      label={t.peakTime}       value="10AM" sub={adminStats.peakTime} color="orange" />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Bar Chart */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <SectionHeader
              icon={<BarChart3 size={16} className="text-[#1a3a6b]" />}
              title={t.weeklyBookings}
              subtitle={t.weeklySub}
              action={
                <div className="flex items-center gap-1 text-[#1a3a6b] bg-blue-50 px-3 py-1.5 rounded-lg text-xs font-semibold">
                  <BarChart3 size={13} />
                  {t.analytics}
                </div>
              }
            />
            <div className="flex items-end gap-2 h-36 px-1 mt-2">
              {chartData.map(d => (
                <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-gray-500 font-medium">{d.value}</span>
                  <div
                    className="w-full bg-[#1a3a6b] hover:bg-[#163060] rounded-t-lg transition-all cursor-pointer opacity-80 hover:opacity-100"
                    style={{ height: `${(d.value / maxVal) * 100}%` }}
                    title={`${d.label}: ${d.value} bookings`}
                  />
                  <span className="text-xs text-gray-400">{d.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pie Chart */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <SectionHeader
              icon={<PieChart size={16} className="text-[#1a3a6b]" />}
              title={t.emergencyTypes}
            />
            <div className="flex items-center justify-center my-4">
              <div className="relative w-28 h-28">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  {(() => {
                    const colors = ['#ef4444', '#f97316', '#a855f7', '#3b82f6'];
                    let offset = 0;
                    return pieData.map((d, i) => {
                      const dash = d.pct;
                      const el = (
                        <circle
                          key={d.label}
                          cx="18" cy="18" r="15.9"
                          fill="none"
                          stroke={colors[i]}
                          strokeWidth="3.8"
                          strokeDasharray={`${dash} ${100 - dash}`}
                          strokeDashoffset={-offset}
                        />
                      );
                      offset += dash;
                      return el;
                    });
                  })()}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-lg font-bold text-[#1a3a6b]">100%</p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              {pieData.map(d => (
                <div key={d.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${d.color}`} />
                    <span className="text-xs text-gray-600">{d.label}</span>
                  </div>
                  <span className="text-xs font-bold text-[#1a3a6b]">{d.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <SectionHeader
            icon={<MapPin size={16} className="text-[#1a3a6b]" />}
            title={t.hospitalMap}
            subtitle={t.mapSub}
          />
          <div className="h-44 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl flex items-center justify-center relative overflow-hidden mt-3">
            {/* Grid lines */}
            <div className="absolute inset-0 opacity-20">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="absolute w-px bg-blue-300" style={{ left: `${(i + 1) * 12.5}%`, top: 0, bottom: 0 }} />
              ))}
              {[...Array(5)].map((_, i) => (
                <div key={i} className="absolute h-px bg-blue-300" style={{ top: `${(i + 1) * 20}%`, left: 0, right: 0 }} />
              ))}
            </div>
            {/* Hospital pins */}
            {[
              { x: '20%', y: '30%', name: 'Apollo' },
              { x: '45%', y: '55%', name: 'AIIMS' },
              { x: '65%', y: '25%', name: 'Fortis' },
              { x: '75%', y: '65%', name: 'Max' },
              { x: '35%', y: '70%', name: 'Manipal' },
            ].map(p => (
              <div key={p.name} className="absolute" style={{ left: p.x, top: p.y }}>
                <div className="relative group cursor-pointer">
                  <div className="w-4 h-4 bg-[#1a3a6b] rounded-full border-2 border-white shadow-md animate-pulse" />
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    {p.name}
                  </div>
                </div>
              </div>
            ))}
            <div className="text-center z-10">
              <MapPin size={32} className="text-[#1a3a6b] opacity-40 mx-auto mb-2" />
              <p className="text-[#1a3a6b] font-semibold text-sm">{t.interactiveMap}</p>
              <p className="text-blue-400 text-xs">{t.mapSub}</p>
            </div>
          </div>
        </div>

        {/* Live Bookings Feed */}
        {recentBookings.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                  <Activity size={16} className="text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-[#1a3a6b] text-sm">Live Bookings Feed</h3>
                  <p className="text-xs text-gray-400">{liveStats.totalBookings} total · {liveStats.pending} pending · {liveStats.accepted} accepted</p>
                </div>
              </div>
              <span className="flex items-center gap-1.5 text-xs text-green-600 font-semibold">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Live
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-5 py-2.5">Booking ID</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-2.5">Patient</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-2.5">Hospital</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-2.5">Emergency</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-2.5">Bed</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-2.5">Driver</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.map(r => (
                    <tr key={r.bookingId} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 text-xs font-mono text-[#1a3a6b] font-semibold">{r.bookingId}</td>
                      <td className="px-3 py-3 text-sm text-gray-700">{r.patientName} <span className="text-gray-400 text-xs">({r.patientAge}y)</span></td>
                      <td className="px-3 py-3 text-sm text-gray-700">{r.hospitalName}</td>
                      <td className="px-3 py-3">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded border bg-red-50 text-red-700 border-red-200">{r.emergencyType}</span>
                      </td>
                      <td className="px-3 py-3 text-xs font-semibold text-gray-600 uppercase">{r.bedType}</td>
                      <td className="px-3 py-3 text-xs text-gray-500">{r.driverName} <span className="text-gray-400">({r.driverId})</span></td>
                      <td className="px-3 py-3">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded border ${
                          r.status === 'accepted' ? 'bg-green-50 text-green-700 border-green-200' :
                          r.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-200' :
                          'bg-orange-50 text-orange-600 border-orange-200'
                        }`}>
                          {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Hospital Management */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <Building2 size={16} className="text-[#1a3a6b]" />
              </div>
              <div>
                <h3 className="font-bold text-[#1a3a6b] text-sm">{t.hospitalMgmt}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{hospitals.length} {t.hospitalMgmtSub}</p>
              </div>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2 bg-[#1a3a6b] hover:bg-[#163060] text-white rounded-lg text-sm font-semibold transition-all"
            >
              <Plus size={15} />
              {t.addHospital}
            </button>
          </div>

          {/* Add Form */}
          {showForm && (
            <form onSubmit={handleAdd} className="bg-blue-50 border-b border-blue-200 p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder={t.hospitalName}
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
                className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b] bg-white"
              />
              <input
                type="text"
                placeholder={t.location}
                value={form.location}
                onChange={e => setForm({ ...form, location: e.target.value })}
                required
                className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b] bg-white"
              />
              <input
                type="number"
                placeholder={t.beds}
                value={form.beds}
                onChange={e => setForm({ ...form, beds: e.target.value })}
                className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b] bg-white"
              />
              <div className="sm:col-span-3 flex gap-2">
                <button type="submit" className="px-5 py-2 bg-[#1a3a6b] text-white rounded-lg text-sm font-semibold hover:bg-[#163060] transition-all">
                  {t.addHospital}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-all">
                  {t.cancel}
                </button>
              </div>
            </form>
          )}

          {/* Table */}
          <div className="overflow-x-auto p-5">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-3">{t.hospital}</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-3">{t.locationCol}</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-3">{t.bedsCol}</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-3">{t.bookings}</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-3">{t.status}</th>
                  <th className="pb-3" />
                </tr>
              </thead>
              <tbody>
                {hospitals.map(h => (
                  <tr key={h.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                          <Building2 size={14} className="text-[#1a3a6b]" />
                        </div>
                        <span className="font-semibold text-[#1a3a6b] text-sm">{h.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 text-sm text-gray-500">{h.location}</td>
                    <td className="py-3.5 text-sm font-semibold text-gray-700">{h.beds}</td>
                    <td className="py-3.5 text-sm text-gray-700">{h.bookings}</td>
                    <td className="py-3.5">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded border
                        ${h.status === 'active'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                        {h.status === 'active' ? t.active : t.maintenance}
                      </span>
                    </td>
                    <td className="py-3.5 text-right">
                      <button
                        onClick={() => handleDelete(h.id, h.name)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* ── FOOTER ────────────────────────────────────────── */}
      <footer className="bg-[#1a3a6b] text-white mt-4">
        <div className="flex h-1">
          <div className="flex-1 bg-[#FF9933]" />
          <div className="flex-1 bg-white" />
          <div className="flex-1 bg-[#138808]" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-blue-300">
          <p>{t.footerNote}</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><Phone size={11} /> 108</span>
            <span className="flex items-center gap-1"><Phone size={11} /> 112</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────

function StatTile({ value, label, color }) {
  const colors = {
    blue:   'text-blue-300',
    green:  'text-green-400',
    orange: 'text-orange-400',
    purple: 'text-purple-400',
  };
  return (
    <div className="flex items-center gap-3">
      <div>
        <p className={`text-xl font-bold ${colors[color]}`}>{value}</p>
        <p className="text-xs text-blue-300 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function SectionHeader({ icon, title, subtitle, action }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-1">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div>
          <h2 className="font-bold text-[#1a3a6b] text-sm">{title}</h2>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
