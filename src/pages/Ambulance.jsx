import { useState, useEffect } from 'react';
import {
  MapPin, Clock, Activity, Map, Bed, AlertTriangle,
  ChevronDown, CheckCircle, XCircle, Globe, Truck,
  Shield, Phone, Hash, LogOut, Search
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import BookingModal from '../components/BookingModal';
import SimpleMap from '../components/SimpleMap';
import CreateRequest from '../components/CreateRequest';
import { hospitals as ALL_HOSPITALS, emergencyTypes, getHospitalsByCity } from '../data/dummy';
import { getBedsForHospital, getRequests } from '../data/store';

// ── i18n strings ─────────────────────────────────────────────
const LANG = {
  en: {
    govTitle:      'Government of Tamil Nadu',
    govSub:        'Health & Family Welfare Department',
    sysTitle:      'Smart Emergency Bed Booking System',
    driverPortal:  'Driver Portal',
    welcome:       'Welcome',
    driverId:      'Driver ID',
    location:      'Location',
    status:        'Status',
    active:        'Active',
    shift:         'On Duty',
    totalBeds:     'Total Beds',
    available:     'Available',
    avgEta:        'Avg. ETA',
    nearby:        'Nearby Hospitals',
    nearbyMap:     'Hospital Network Map',
    mapSub:        'Click on markers to view hospital details',
    filterAll:     'All Hospitals',
    filterAvail:   'Available',
    filterIcu:     'ICU Available',
    emergFilter:   'Filter by Emergency Type',
    hospitalList:  'Nearby Hospitals',
    noHospitals:   'No hospitals match the selected filter.',
    bookBed:       'Book Bed',
    noBeds:        'No Beds',
    booked:        'Booked',
    legend:        'Map Legend',
    legAvail:      'Available',
    legCritical:   'Critical',
    legFull:       'Full',
    logout:        'Logout',
    langToggle:    'தமிழ்',
    helpline:      'Emergency Helpline',
    todayBookings: "Today's Bookings",
    accepted:      'Accepted',
    pending:       'Awaiting',
    minutes:       'min',
    hospitals:     'Hospitals',
    footerNote:    'This is an official portal of the Tamil Nadu Health Department. For emergencies call 108.',
  },
  ta: {
    govTitle:      'தமிழ்நாடு அரசு',
    govSub:        'சுகாதாரம் மற்றும் குடும்ப நலத்துறை',
    sysTitle:      'அவசர படுக்கை முன்பதிவு அமைப்பு',
    driverPortal:  'ஓட்டுநர் போர்டல்',
    welcome:       'வணக்கம்',
    driverId:      'ஓட்டுநர் எண்',
    location:      'இடம்',
    status:        'நிலை',
    active:        'செயலில்',
    shift:         'பணியில்',
    totalBeds:     'மொத்த படுக்கைகள்',
    available:     'கிடைக்கும்',
    avgEta:        'சராசரி வருகை நேரம்',
    nearby:        'அருகில் உள்ள மருத்துவமனைகள்',
    nearbyMap:     'மருத்துவமனை வலைப்பட வரைபடம்',
    mapSub:        'மருத்துவமனை விவரங்களுக்கு குறிகளை கிளிக் செய்யவும்',
    filterAll:     'அனைத்தும்',
    filterAvail:   'கிடைக்கும்',
    filterIcu:     'ICU உள்ளது',
    emergFilter:   'அவசர வகை வடிகட்டு',
    hospitalList:  'அருகில் உள்ள மருத்துவமனைகள்',
    noHospitals:   'தேர்ந்தெடுத்த வடிகட்டிக்கு மருத்துவமனைகள் இல்லை.',
    bookBed:       'படுக்கை முன்பதிவு',
    noBeds:        'படுக்கை இல்லை',
    booked:        'முன்பதிவு செய்யப்பட்டது',
    legend:        'வரைபட குறியீடு',
    legAvail:      'கிடைக்கும்',
    legCritical:   'நெருக்கடி',
    legFull:       'நிரம்பியது',
    logout:        'வெளியேறு',
    langToggle:    'English',
    helpline:      'அவசர உதவி எண்',
    todayBookings: 'இன்றைய முன்பதிவுகள்',
    accepted:      'ஏற்றுக்கொள்ளப்பட்டது',
    pending:       'காத்திருக்கிறது',
    minutes:       'நிமிடம்',
    hospitals:     'மருத்துவமனைகள்',
    footerNote:    'இது தமிழ்நாடு சுகாதாரத்துறையின் அதிகாரப்பூர்வ போர்டல். அவசரநிலைக்கு 108 அழைக்கவும்.',
  },
};

function getStoredUser() {
  try { return JSON.parse(localStorage.getItem('currentUser') || 'null'); } catch { return null; }
}

export default function Ambulance() {
  const user = getStoredUser();
  const navigate = useNavigate();

  const [lang, setLang] = useState('en');
  const [filter, setFilter] = useState('all');
  const [emergencyFilter, setEmergencyFilter] = useState('');
  const [cityFilter, setCityFilter] = useState(user?.location || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [bookingHospital, setBookingHospital] = useState(null);
  const [bookedIds, setBookedIds] = useState([]);
  const [hospitals, setHospitals] = useState(ALL_HOSPITALS);
  const [bookingStatuses, setBookingStatuses] = useState({});
  const [activeRoute, setActiveRoute] = useState(null); // hospital to route to

  const t = LANG[lang];

  // All unique cities from dataset
  const ALL_CITIES = [...new Set(ALL_HOSPITALS.map(h => h.city))].sort();

  // Merge static hospital data with live bed counts from store every 2s
  useEffect(() => {
    const sync = () => {
      setHospitals(ALL_HOSPITALS.map(h => {
        const liveBeds = getBedsForHospital(h.id);
        if (!liveBeds) return h;
        const totalBeds = liveBeds.icu + liveBeds.emergency + liveBeds.general;
        const status = totalBeds === 0 ? 'full'
          : (liveBeds.icu === 0 && liveBeds.emergency <= 1) ? 'critical'
          : 'available';
        return { ...h, beds: liveBeds, status };
      }));
      const allReqs = getRequests();
      const myReqs = allReqs.filter(r => r.driverId === user?.id);
      const statusMap = {};
      myReqs.forEach(r => { statusMap[r.hospitalId] = r.status; });
      setBookingStatuses(statusMap);
    };
    sync();
    const interval = setInterval(sync, 2000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const handleLogout = () => {
    localStorage.removeItem('auth');
    localStorage.removeItem('currentUser');
    navigate('/login');
  };

  const handleBookingConfirmed = (booking) => {
    setBookedIds(prev => [...prev, booking.hospital.id]);
    setActiveRoute(booking.hospital); // ← show route on map
    toast.success(
      lang === 'en'
        ? `Booking confirmed at ${booking.hospital.name}!`
        : `${booking.hospital.name} இல் முன்பதிவு உறுதிப்படுத்தப்பட்டது!`,
      { duration: 4000 }
    );
  };

  // Apply all filters
  const filtered = hospitals.filter(h => {
    if (cityFilter !== 'all' && h.city !== cityFilter) return false;
    if (filter === 'available' && h.status !== 'available') return false;
    if (filter === 'icu' && h.beds.icu === 0) return false;
    if (searchQuery && !h.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const cityHospitals = cityFilter === 'all' ? hospitals : hospitals.filter(h => h.city === cityFilter);
  const availableCount = cityHospitals.filter(h => h.status === 'available').length;
  const totalBeds = cityHospitals.reduce((s, h) => s + h.beds.icu + h.beds.emergency + h.beds.general, 0);
  const todayBookings = bookedIds.length;

  // Live booking counts from store (updates when hospital accepts/rejects)
  const allStatuses = Object.values(bookingStatuses);
  const acceptedCount = allStatuses.filter(s => s === 'accepted').length;
  const pendingCount  = allStatuses.filter(s => s === 'pending').length;

  return (
    <>
      <div className="min-h-screen bg-[#f0f4f8] font-sans">

        {/* ── TOP GOVERNMENT HEADER ─────────────────────────── */}
        <header className="bg-[#1a3a6b] text-white">
          {/* Tricolor top strip */}
          <div className="flex h-1.5">
            <div className="flex-1 bg-[#FF9933]" />
            <div className="flex-1 bg-white" />
            <div className="flex-1 bg-[#138808]" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Main header row */}
            <div className="flex items-center justify-between py-3 border-b border-white/10">
              <div className="flex items-center gap-4">
                {/* Emblem placeholder */}
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow">
                  <Shield size={24} className="text-[#1a3a6b]" />
                </div>
                <div>
                  <p className="text-xs text-blue-200 font-medium tracking-wide uppercase">
                    {t.govTitle}
                  </p>
                  <h1 className="text-base sm:text-lg font-bold leading-tight">
                    {t.sysTitle}
                  </h1>
                  <p className="text-xs text-blue-300">{t.govSub}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Language toggle */}
                <button
                  onClick={() => setLang(l => l === 'en' ? 'ta' : 'en')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-xs font-semibold transition-all"
                >
                  <Globe size={13} />
                  {t.langToggle}
                </button>

                {/* Helpline */}
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-red-600/80 rounded-lg text-xs font-bold">
                  <Phone size={12} />
                  108
                </div>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-red-600/80 border border-white/20 rounded-lg text-xs font-medium transition-all"
                >
                  <LogOut size={13} />
                  <span className="hidden sm:inline">{t.logout}</span>
                </button>
              </div>
            </div>

            {/* Driver info bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
                  <Truck size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-xs text-blue-300">{t.driverPortal}</p>
                  <p className="font-bold text-white text-sm">
                    {t.welcome}, {user?.name || 'Driver'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Voice Booking Button */}
                <button
                  onClick={() => window.location.href = '/voice-booking'}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600/80 hover:bg-green-600 border border-green-400/30 rounded-lg text-xs font-medium transition-all"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                  </svg>
                  <span className="hidden sm:inline">Voice Booking</span>
                  <span className="sm:hidden">Voice</span>
                </button>

                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <InfoPill icon={<Hash size={11} />} label={t.driverId} value={user?.id || '—'} />
                  <InfoPill icon={<MapPin size={11} />} label={t.location} value={user?.location || '—'} />
                  <InfoPill icon={<Activity size={11} />} label={t.status} value={t.shift} green />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ── STATS BAR ─────────────────────────────────────── */}
        <div className="bg-[#1e4d8c] border-b border-[#163d73]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatTile value={todayBookings}  label={t.todayBookings} color="blue" />
              <StatTile value={acceptedCount}  label={t.accepted}      color="green" />
              <StatTile value={pendingCount}   label={t.pending}       color="orange" />
              <StatTile value={availableCount} label={t.available}     color="purple" />
            </div>
          </div>
        </div>

        {/* ── MAIN CONTENT ──────────────────────────────────── */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

          {/* ── DRIVER PROFILE CARD ───────────────────────── */}
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex h-1">
              <div className="flex-1 bg-[#FF9933]" />
              <div className="flex-1 bg-white border-t border-gray-100" />
              <div className="flex-1 bg-[#138808]" />
            </div>
            <div className="p-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                {/* Avatar */}
                <div className="w-16 h-16 bg-[#1a3a6b] rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Truck size={30} className="text-white" />
                </div>
                {/* Details */}
                <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <ProfileField
                    label={lang === 'ta' ? 'பெயர்' : 'Full Name'}
                    value={user?.name || '—'}
                    highlight
                  />
                  <ProfileField
                    label={lang === 'ta' ? t.driverId : 'Driver ID'}
                    value={user?.id || '—'}
                  />
                  <ProfileField
                    label={lang === 'ta' ? t.location : 'Location'}
                    value={user?.location || '—'}
                  />
                  <ProfileField
                    label={lang === 'ta' ? t.status : 'Duty Status'}
                    value={lang === 'ta' ? t.shift : 'On Duty'}
                    green
                  />
                </div>
                {/* On-duty badge */}
                <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-green-700 text-xs font-bold uppercase tracking-wide">
                    {lang === 'ta' ? 'பணியில்' : 'Active Duty'}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* ── CREATE REQUEST SECTION ───────────────────────── */}
          <CreateRequest 
            driver={user} 
            hospitals={ALL_HOSPITALS}
            onRequestCreated={(booking) => {
              toast.success('Request sent successfully!');
            }}
          />

          {/* Map Section */}
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <SectionHeader
              icon={<Map size={16} className="text-[#1a3a6b]" />}
              title={activeRoute
                ? (lang === 'ta' ? `வழி: ${activeRoute.address}` : `Route to ${activeRoute.address}`)
                : t.nearbyMap}
              subtitle={activeRoute
                ? (lang === 'ta' ? `ETA: ${activeRoute.eta} · ${activeRoute.distance}` : `ETA: ${activeRoute.eta} · ${activeRoute.distance} away`)
                : t.mapSub}
            />
            <div className="p-4">
              <SimpleMap hospitals={filtered} routeTo={activeRoute} lang={lang} driverCity={user?.location} />

              {/* Route info banner — shown after booking */}
              {activeRoute && (
                <div className="mt-3 bg-[#1a3a6b] text-white rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Truck size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-blue-300 uppercase tracking-wide">
                        {lang === 'ta' ? 'செல்லும் வழி' : 'En Route'}
                      </p>
                      <p className="font-bold text-white text-sm">{activeRoute.address}</p>
                      <p className="text-xs text-blue-200 mt-0.5">{activeRoute.speciality}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-center">
                      <p className="text-blue-300 text-xs">{lang === 'ta' ? 'தூரம்' : 'Distance'}</p>
                      <p className="font-bold text-white">{activeRoute.distance}</p>
                    </div>
                    <div className="w-px h-8 bg-white/20" />
                    <div className="text-center">
                      <p className="text-blue-300 text-xs">ETA</p>
                      <p className="font-bold text-green-400">{activeRoute.eta}</p>
                    </div>
                    <div className="w-px h-8 bg-white/20" />
                    <div className="text-center">
                      <p className="text-blue-300 text-xs">{lang === 'ta' ? 'நிலை' : 'Status'}</p>
                      <p className="font-bold text-yellow-300 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-yellow-300 rounded-full animate-pulse" />
                        {lang === 'ta' ? 'செல்கிறது' : 'Moving'}
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveRoute(null)}
                      className="ml-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-xs font-medium transition-all"
                    >
                      {lang === 'ta' ? 'மூடு' : 'Clear'}
                    </button>
                  </div>
                </div>
              )}

              {!activeRoute && (
                <div className="mt-3 flex flex-wrap gap-5 text-xs text-gray-600 border-t pt-3">
                  <span className="font-semibold text-gray-500 uppercase tracking-wide">{t.legend}:</span>
                  <LegendDot color="bg-green-500" label={t.legAvail} />
                  <LegendDot color="bg-yellow-500" label={t.legCritical} />
                  <LegendDot color="bg-red-500" label={t.legFull} />
                </div>
              )}
            </div>
          </section>

          {/* Filter + Hospital List */}
          <section>
            <SectionHeader
              icon={<Bed size={16} className="text-[#1a3a6b]" />}
              title={t.hospitalList}
              subtitle={`${filtered.length} ${t.hospitals} ${t.nearby.toLowerCase()}`}
              noBorder
            />

            {/* Filter controls */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 mb-4 space-y-3">

              {/* Row 1: City selector + Search */}
              <div className="flex flex-wrap gap-2 items-center">
                {/* City filter */}
                <div className="relative">
                  <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select
                    value={cityFilter}
                    onChange={e => setCityFilter(e.target.value)}
                    className="pl-8 pr-8 py-2 border border-gray-200 rounded-lg text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1a3a6b] appearance-none cursor-pointer bg-white font-medium"
                  >
                    <option value="all">All Cities ({ALL_HOSPITALS.length})</option>
                    {ALL_CITIES.map(city => (
                      <option key={city} value={city}>
                        {city} ({ALL_HOSPITALS.filter(h => h.city === city).length})
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>

                {/* Search */}
                <div className="relative flex-1 min-w-[160px]">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search hospital name..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1a3a6b] bg-white"
                  />
                </div>

                {/* Emergency type dropdown */}
                <div className="relative">
                  <AlertTriangle size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select
                    value={emergencyFilter}
                    onChange={e => setEmergencyFilter(e.target.value)}
                    className="pl-8 pr-8 py-2 border border-gray-200 rounded-lg text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1a3a6b] appearance-none cursor-pointer bg-white"
                  >
                    <option value="">{t.emergFilter}</option>
                    {emergencyTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Row 2: Bed status tabs */}
              <div className="flex gap-1 flex-wrap border-t border-gray-100 pt-2">
                {[
                  { key: 'all',       label: `${t.filterAll} (${cityHospitals.length})` },
                  { key: 'available', label: `${t.filterAvail} (${availableCount})` },
                  { key: 'icu',       label: `${t.filterIcu} (${cityHospitals.filter(h => h.beds.icu > 0).length})` },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                      filter === tab.key
                        ? 'bg-[#1a3a6b] text-white border-[#1a3a6b] shadow-sm'
                        : 'text-gray-600 border-gray-200 hover:border-[#1a3a6b] hover:text-[#1a3a6b]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
                {/* Driver's city quick-select */}
                {user?.location && cityFilter !== user.location && (
                  <button
                    onClick={() => setCityFilter(user.location)}
                    className="ml-auto px-3 py-1.5 rounded-lg text-xs font-semibold border border-orange-300 text-orange-600 hover:bg-orange-50 transition-all flex items-center gap-1"
                  >
                    <MapPin size={11} />
                    My City ({user.location})
                  </button>
                )}
              </div>
            </div>

            {/* Hospital cards */}
            <div className="space-y-3">
              {filtered.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 py-16 text-center text-gray-400">
                  <Bed size={36} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">{t.noHospitals}</p>
                </div>
              ) : (
                filtered.map(hospital => (
                  <GovHospitalCard
                    key={hospital.id}
                    hospital={hospital}
                    onBook={() => setBookingHospital(hospital)}
                    isBooked={bookedIds.includes(hospital.id)}
                    bookingStatus={bookingStatuses[hospital.id]}
                    t={t}
                  />
                ))
              )}
            </div>
          </section>
        </main>

        {/* ── FOOTER ────────────────────────────────────────── */}
        <footer className="bg-[#1a3a6b] text-white mt-10">
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

      {/* Booking Modal */}
      {bookingHospital && (
        <BookingModal
          hospital={bookingHospital}
          driver={user}
          onClose={() => setBookingHospital(null)}
          onConfirmed={(booking) => {
            handleBookingConfirmed(booking);
            setBookingHospital(null);
          }}
        />
      )}
    </>
  );
}

// ── Sub-components ────────────────────────────────────────────

function InfoPill({ icon, label, value, green }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-blue-400">{icon}</span>
      <span className="text-blue-300">{label}:</span>
      <span className={`font-semibold ${green ? 'text-green-400' : 'text-white'}`}>{value}</span>
      {green && <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />}
    </div>
  );
}

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

function SectionHeader({ icon, title, subtitle, noBorder }) {
  return (
    <div className={`flex items-center gap-3 px-5 py-3.5 ${noBorder ? 'mb-1' : 'border-b border-gray-100'}`}>
      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <h2 className="font-bold text-[#1a3a6b] text-sm">{title}</h2>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`w-2.5 h-2.5 rounded-full ${color} inline-block`} />
      {label}
    </span>
  );
}

// Government-styled hospital card
function GovHospitalCard({ hospital, onBook, isBooked, bookingStatus, t }) {
  const isFull = hospital.status === 'full';

  const statusStyle = {
    available: { bar: 'bg-green-500', badge: 'bg-green-100 text-green-700 border-green-200', dot: 'bg-green-500' },
    critical:  { bar: 'bg-yellow-500', badge: 'bg-yellow-100 text-yellow-700 border-yellow-200', dot: 'bg-yellow-500' },
    full:      { bar: 'bg-red-500', badge: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500' },
  };
  const ss = statusStyle[hospital.status] || statusStyle.available;

  // Booking status badge shown after driver books
  const bookingBadge = () => {
    if (!isBooked) return null;
    if (bookingStatus === 'accepted') return (
      <div className="flex items-center gap-1.5 text-green-700 text-xs font-bold bg-green-50 border border-green-300 px-3 py-2 rounded-lg">
        <CheckCircle size={13} />
        {t.booked} — Accepted
      </div>
    );
    if (bookingStatus === 'rejected') return (
      <div className="flex items-center gap-1.5 text-red-600 text-xs font-bold bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
        <XCircle size={13} />
        Rejected
      </div>
    );
    // pending
    return (
      <div className="flex items-center gap-1.5 text-orange-600 text-xs font-bold bg-orange-50 border border-orange-200 px-3 py-2 rounded-lg animate-pulse">
        <Clock size={13} />
        Awaiting...
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all hover:shadow-md
      ${isBooked ? 'border-green-300' : isFull ? 'border-red-200' : 'border-gray-200'}`}
    >
      {/* Status color bar on left */}
      <div className="flex">
        <div className={`w-1 flex-shrink-0 ${ss.bar}`} />

        <div className="flex-1 flex flex-col sm:flex-row">
          {/* Hospital image */}
          <div className="sm:w-40 h-32 sm:h-auto flex-shrink-0 relative">
            <img
              src={hospital.image}
              alt={hospital.name}
              className="w-full h-full object-cover"
            />
            {/* Serial number badge */}
            <div className="absolute top-2 right-2 w-6 h-6 bg-[#1a3a6b] text-white text-xs font-bold rounded flex items-center justify-center">
              {hospital.numericId}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-4 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              {/* Name + status */}
              <div className="flex items-start justify-between gap-2 mb-1">
                <div>
                  <p className="text-xs text-gray-500 mt-0.5">{hospital.speciality}</p>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-semibold flex-shrink-0 ${ss.badge}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${ss.dot} ${!isFull ? 'animate-pulse' : ''}`} />
                  {hospital.status === 'available' ? t.legAvail : hospital.status === 'critical' ? t.legCritical : t.legFull}
                </span>
              </div>

              {/* Address + distance */}
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1"><MapPin size={11} className="text-gray-400" />{hospital.address}</span>
                <span className="flex items-center gap-1"><Clock size={11} className="text-gray-400" />ETA: <strong className="text-gray-700 ml-0.5">{hospital.eta}</strong></span>
                <span className="flex items-center gap-1 text-yellow-600 font-semibold">★ {hospital.rating}</span>
              </div>

              {/* Bed availability table */}
              <div className="mt-3 grid grid-cols-3 gap-2">
                <BedCell label="ICU" count={hospital.beds.icu} color="red" />
                <BedCell label={t.filterAvail === 'கிடைக்கும்' ? 'அவசரம்' : 'Emergency'} count={hospital.beds.emergency} color="orange" />
                <BedCell label={t.filterAvail === 'கிடைக்கும்' ? 'பொது' : 'General'} count={hospital.beds.general} color="blue" />
              </div>
            </div>

            {/* Action */}
            <div className="flex sm:flex-col items-center sm:items-end justify-end sm:justify-center sm:min-w-[110px] gap-2">
              {isBooked ? (
                bookingBadge()
              ) : isFull ? (
                <div className="flex items-center gap-1.5 text-red-600 text-xs font-bold bg-red-50 border border-red-200 px-4 py-2.5 rounded-lg">
                  <XCircle size={14} />
                  {t.noBeds}
                </div>
              ) : (
                <button
                  onClick={onBook}
                  className="px-5 py-2.5 bg-[#1a3a6b] hover:bg-[#163060] text-white text-xs font-bold rounded-lg shadow-sm hover:shadow-md active:scale-95 transition-all uppercase tracking-wide"
                >
                  {t.bookBed}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BedCell({ label, count, color }) {
  const colors = {
    red:    { bg: count > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200', text: count > 0 ? 'text-red-700' : 'text-gray-400', num: count > 0 ? 'text-red-600' : 'text-gray-400' },
    orange: { bg: count > 0 ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200', text: count > 0 ? 'text-orange-700' : 'text-gray-400', num: count > 0 ? 'text-orange-600' : 'text-gray-400' },
    blue:   { bg: count > 0 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200', text: count > 0 ? 'text-blue-700' : 'text-gray-400', num: count > 0 ? 'text-blue-600' : 'text-gray-400' },
  };
  const c = colors[color];
  return (
    <div className={`border rounded-lg px-2 py-1.5 text-center ${c.bg}`}>
      <p className={`text-xs font-semibold ${c.text}`}>{label}</p>
      <p className={`text-lg font-bold leading-tight ${c.num}`}>{count}</p>
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
