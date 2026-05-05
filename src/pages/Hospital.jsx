import { useState, useEffect } from 'react';
import {
  Activity, Users, CheckCircle, Clock, AlertTriangle,
  Bell, Save, Bed, Building2, MapPin, Hash, Phone
} from 'lucide-react';
import toast from 'react-hot-toast';
import GovHeader from '../components/GovHeader';
import StatsCard from '../components/StatsCard';
import RequestCard from '../components/RequestCard';
import VoiceBookingList from '../components/VoiceBookingList';
import { incomingRequests, getHospitalById } from '../data/dummy';
import {
  getRequestsForHospital,
  setRequestStatus,
  getBedsForHospital,
  setBedsForHospital,
} from '../data/store';

// ── i18n ─────────────────────────────────────────────────────
const LANG = {
  en: {
    govTitle:        'Government of Tamil Nadu',
    govSub:          'Health & Family Welfare Department',
    sysTitle:        'Smart Emergency Bed Booking System',
    portalLabel:     'Hospital Portal',
    hospitalPortal:  'Hospital Portal',
    logout:          'Logout',
    langToggle:      'தமிழ்',
    totalRequests:   'Total Requests',
    accepted:        'Accepted',
    pending:         'Pending',
    critical:        'Critical',
    today:           'Today',
    confirmed:       'Confirmed',
    awaitingAction:  'Awaiting action',
    highPriority:    'High priority',
    incomingRequests:'Incoming Requests',
    newRequest:      'new',
    pendingLabel:    'pending',
    updateBeds:      'Update Bed Count',
    icuBeds:         'ICU Beds',
    emergencyBeds:   'Emergency Beds',
    generalBeds:     'General Beds',
    update:          'Update Beds',
    saving:          'Saving...',
    currentAvail:    'Current Availability',
    live:            'Live',
    hospitalId:      'Hospital ID',
    location:        'Location',
    footerNote:      'This is an official portal of the Tamil Nadu Health Department. For emergencies call 108.',
    accept:          'Accept',
    reject:          'Reject',
  },
  ta: {
    govTitle:        'தமிழ்நாடு அரசு',
    govSub:          'சுகாதாரம் மற்றும் குடும்ப நலத்துறை',
    sysTitle:        'அவசர படுக்கை முன்பதிவு அமைப்பு',
    portalLabel:     'மருத்துவமனை போர்டல்',
    hospitalPortal:  'மருத்துவமனை போர்டல்',
    logout:          'வெளியேறு',
    langToggle:      'English',
    totalRequests:   'மொத்த கோரிக்கைகள்',
    accepted:        'ஏற்றுக்கொள்ளப்பட்டது',
    pending:         'நிலுவையில்',
    critical:        'நெருக்கடி',
    today:           'இன்று',
    confirmed:       'உறுதிப்படுத்தப்பட்டது',
    awaitingAction:  'நடவடிக்கை எதிர்பார்க்கிறது',
    highPriority:    'அதிக முன்னுரிமை',
    incomingRequests:'வரும் கோரிக்கைகள்',
    newRequest:      'புதியது',
    pendingLabel:    'நிலுவையில்',
    updateBeds:      'படுக்கை எண்ணிக்கை புதுப்பிக்க',
    icuBeds:         'ICU படுக்கைகள்',
    emergencyBeds:   'அவசர படுக்கைகள்',
    generalBeds:     'பொது படுக்கைகள்',
    update:          'புதுப்பிக்க',
    saving:          'சேமிக்கிறது...',
    currentAvail:    'தற்போதைய கிடைக்கும் தன்மை',
    live:            'நேரடி',
    hospitalId:      'மருத்துவமனை எண்',
    location:        'இடம்',
    footerNote:      'இது தமிழ்நாடு சுகாதாரத்துறையின் அதிகாரப்பூர்வ போர்டல். அவசரநிலைக்கு 108 அழைக்கவும்.',
    accept:          'ஏற்க',
    reject:          'நிராகரி',
  },
};

function getStoredUser() {
  try { return JSON.parse(localStorage.getItem('currentUser') || 'null'); } catch { return null; }
}

export default function Hospital() {
  const user = getStoredUser();
  const [lang, setLang] = useState('en');

  const hospitalId = user?.id || null;
  // Get this hospital's data from the Excel dataset
  const hospitalData = hospitalId ? getHospitalById(hospitalId) : null;

  // Merge dummy seed requests + live store requests, deduplicated by id/bookingId
  const buildRequests = () => {
    const live = hospitalId ? getRequestsForHospital(hospitalId) : [];
    // Map live store requests to the shape RequestCard expects
    const liveFormatted = live.map(r => ({
      id:            r.bookingId,
      patientName:   r.patientName,
      age:           r.patientAge,
      emergencyType: r.emergencyType,
      bedType:       r.bedType === 'icu' ? 'ICU' : r.bedType === 'emergency' ? 'Emergency' : 'General',
      eta:           r.eta,
      distance:      r.distance,
      status:        r.status,
      time:          new Date(r.bookedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      isNew:         r.isNew,
      driverName:    r.driverName,
      driverId:      r.driverId,
      notes:         r.notes,
      patientPhone:  r.patientPhone,
      fromStore:     true,
    }));
    // Seed dummy requests only if no live requests yet
    const seeds = liveFormatted.length === 0 ? incomingRequests : [];
    return [...liveFormatted, ...seeds];
  };

  const [requests, setRequests] = useState(buildRequests);

  // Restore beds from store (hospital may have updated them before)
  const initBeds = () => {
    if (hospitalId) {
      const stored = getBedsForHospital(hospitalId);
      if (stored) return stored;
    }
    // Fall back to Excel dataset beds
    if (hospitalData?.beds) return hospitalData.beds;
    return { icu: 5, emergency: 12, general: 40 };
  };
  const [beds, setBeds] = useState(initBeds);
  const [saving, setSaving] = useState(false);

  const t = LANG[lang];

  // Poll store every 2s for new requests
  useEffect(() => {
    const interval = setInterval(() => {
      setRequests(buildRequests());
    }, 2000);
    return () => clearInterval(interval);
  }, [hospitalId]);

  const newCount = requests.filter(r => r.isNew && r.status === 'pending').length;
  const accepted = requests.filter(r => r.status === 'accepted').length;
  const pending  = requests.filter(r => r.status === 'pending').length;
  const critical = requests.filter(r =>
    r.emergencyType === 'Cardiac Arrest' || r.emergencyType === 'Stroke'
  ).length;

  const handleAccept = (id) => {
    // Update store if it's a live request
    const req = requests.find(r => r.id === id);
    if (req?.fromStore) setRequestStatus(id, 'accepted');
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'accepted', isNew: false } : r));
    toast.success('Request accepted successfully');
  };

  const handleReject = (id) => {
    const req = requests.find(r => r.id === id);
    if (req?.fromStore) setRequestStatus(id, 'rejected');
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected', isNew: false } : r));
    toast.error('Request rejected');
  };

  const handleUpdateBeds = (e) => {
    e.preventDefault();
    setSaving(true);
    // Write to store so driver page picks up live bed counts
    if (hospitalId) setBedsForHospital(hospitalId, beds);
    setTimeout(() => {
      setSaving(false);
      toast.success('Bed availability updated — visible to drivers in real time');
    }, 600);
  };

  const infoItems = [
    { icon: <Hash size={11} />,   label: t.hospitalId, value: user?.id || '—' },
    { icon: <MapPin size={11} />, label: t.location,   value: hospitalData?.city || user?.location || '—' },
    { icon: <Activity size={11} />, label: t.live,     value: t.live, green: true },
  ];

  return (
    <div className="min-h-screen bg-[#f0f4f8] font-sans flex flex-col">

      {/* ── GOVERNMENT HEADER ─────────────────────────────── */}
      <GovHeader
        role="hospital"
        user={{ ...user, name: hospitalData?.name || user?.name }}
        lang={lang}
        setLang={setLang}
        t={t}
        infoItems={infoItems}
      />

      {/* ── STATS BAR ─────────────────────────────────────── */}
      <div className="bg-[#1e4d8c] border-b border-[#163d73]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatTile value={requests.length} label={t.totalRequests} color="blue" />
            <StatTile value={accepted}        label={t.accepted}      color="green" />
            <StatTile value={pending}         label={t.pending}       color="orange" />
            <StatTile value={critical}        label={t.critical}      color="red" />
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ──────────────────────────────────── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">

        {/* ── HOSPITAL PROFILE CARD ─────────────────────── */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
          <div className="flex h-1">
            <div className="flex-1 bg-[#FF9933]" />
            <div className="flex-1 bg-white border-t border-gray-100" />
            <div className="flex-1 bg-[#138808]" />
          </div>
          <div className="p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              {/* Avatar */}
              <div className="w-16 h-16 bg-[#1a3a6b] rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                <Building2 size={30} className="text-white" />
              </div>
              {/* Details */}
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <ProfileField
                  label={lang === 'ta' ? 'மருத்துவமனை பெயர்' : 'Hospital Name'}
                  value={hospitalData?.name || user?.name || '—'}
                  highlight
                />
                <ProfileField
                  label={lang === 'ta' ? t.hospitalId : 'Hospital ID'}
                  value={user?.id || '—'}
                />
                <ProfileField
                  label={lang === 'ta' ? t.location : 'Location'}
                  value={hospitalData?.city || user?.location || '—'}
                />
                <ProfileField
                  label={lang === 'ta' ? 'சிறப்பு' : 'Speciality'}
                  value={hospitalData?.speciality || 'General'}
                />
              </div>
              {/* Live badge */}
              <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-green-700 text-xs font-bold uppercase tracking-wide">
                  {lang === 'ta' ? 'நேரடி' : 'Live'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatsCard icon={Users}         label={t.totalRequests} value={requests.length} sub={t.today}          color="blue"   trend={12} />
          <StatsCard icon={CheckCircle}   label={t.accepted}      value={accepted}        sub={t.confirmed}      color="green"  trend={8} />
          <StatsCard icon={Clock}         label={t.pending}       value={pending}         sub={t.awaitingAction} color="orange" />
          <StatsCard icon={AlertTriangle} label={t.critical}      value={critical}        sub={t.highPriority}   color="red"    trend={-5} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Incoming Requests ─────────────────────────── */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Section header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Bell size={16} className="text-[#1a3a6b]" />
                  </div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-[#1a3a6b] text-sm">{t.incomingRequests}</h2>
                    {newCount > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Bell size={10} />
                        {newCount} {t.newRequest}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xs text-gray-500">{pending} {t.pendingLabel}</span>
              </div>

              <div className="p-4 space-y-3">
                {requests.length === 0 ? (
                  <div className="py-14 text-center text-gray-400">
                    <Bell size={36} className="mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-semibold text-gray-500">
                      {lang === 'ta' ? 'இன்னும் கோரிக்கைகள் இல்லை' : 'No requests yet'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {lang === 'ta'
                        ? 'ஓட்டுநர் படுக்கை முன்பதிவு செய்தால் இங்கே தெரியும்'
                        : 'Requests from drivers will appear here in real time'}
                    </p>
                  </div>
                ) : (
                  requests.map(req => (
                    <RequestCard
                      key={req.id}
                    request={req}
                    onAccept={handleAccept}
                    onReject={handleReject}
                    lang={lang}
                    t={t}
                  />
                ))
                )}
              </div>
            </div>
          </div>

          {/* ── Bed Management ────────────────────────────── */}
          <div className="space-y-4">

            {/* Update Bed Count */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Bed size={16} className="text-[#1a3a6b]" />
                </div>
                <h2 className="font-bold text-[#1a3a6b] text-sm">{t.updateBeds}</h2>
              </div>

              <form onSubmit={handleUpdateBeds} className="p-5 space-y-4">
                <BedInput label={t.icuBeds}       value={beds.icu}       onChange={v => setBeds({ ...beds, icu: v })}       color="red" />
                <BedInput label={t.emergencyBeds} value={beds.emergency} onChange={v => setBeds({ ...beds, emergency: v })} color="orange" />
                <BedInput label={t.generalBeds}   value={beds.general}   onChange={v => setBeds({ ...beds, general: v })}   color="blue" />
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[#1a3a6b] hover:bg-[#163060] text-white rounded-lg font-semibold text-sm transition-all disabled:opacity-60"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : <Save size={15} />}
                  {saving ? t.saving : t.update}
                </button>
              </form>
            </div>

            {/* Current Availability */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Activity size={16} className="text-[#1a3a6b]" />
                </div>
                <h3 className="font-bold text-[#1a3a6b] text-sm">{t.currentAvail}</h3>
              </div>
              <div className="p-5 space-y-3">
                <AvailBar label={t.icuBeds}       current={beds.icu}       max={10} color="red" />
                <AvailBar label={t.emergencyBeds} current={beds.emergency} max={20} color="orange" />
                <AvailBar label={t.generalBeds}   current={beds.general}   max={60} color="blue" />
              </div>
            </div>
          </div>
        </div>

        {/* ── Voice Bookings ─────────────────────────────── */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Section header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900">Voice Bookings</h3>
              </div>
            </div>

            <div className="p-5">
              <VoiceBookingList />
            </div>
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
    red:    'text-red-400',
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

function BedInput({ label, value, onChange, color }) {
  const colorMap = {
    red:    'text-red-600 bg-red-50',
    orange: 'text-orange-600 bg-orange-50',
    blue:   'text-blue-600 bg-blue-50',
  };
  return (
    <div>
      <label className="block text-sm font-semibold text-[#1a3a6b] mb-1.5">{label}</label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 font-bold transition-colors"
        >
          −
        </button>
        <input
          type="number"
          value={value}
          onChange={e => onChange(Math.max(0, parseInt(e.target.value) || 0))}
          className="flex-1 text-center py-2 border border-gray-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]"
        />
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 font-bold transition-colors"
        >
          +
        </button>
      </div>
    </div>
  );
}

function AvailBar({ label, current, max, color }) {
  const pct = Math.round((current / max) * 100);
  const colorMap = { red: 'bg-red-500', orange: 'bg-orange-500', blue: 'bg-[#1a3a6b]' };
  const textMap  = { red: 'text-red-600', orange: 'text-orange-600', blue: 'text-[#1a3a6b]' };
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-600 font-medium">{label}</span>
        <span className={`font-bold ${textMap[color]}`}>{current}/{max}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${colorMap[color]} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function ProfileField({ label, value, highlight, green }) {
  return (
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
      <p className={`text-sm font-bold ${highlight ? 'text-[#1a3a6b]' : green ? 'text-green-600' : 'text-gray-700'}`}>
        {value}
      </p>
    </div>
  );
}
