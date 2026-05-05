import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, AlertCircle, Shield, Building2, Truck, Globe, Phone } from 'lucide-react';
import { authenticateUser } from '../data/users';

// ── i18n ─────────────────────────────────────────────────────
const LANG = {
  en: {
    govTitle:     'Government of Tamil Nadu',
    govSub:       'Health & Family Welfare Department',
    sysTitle:     'Smart Emergency Bed Booking System',
    cardTitle:    'Official Portal Login',
    cardSub:      'Authorized personnel only',
    enterID:      'Enter ID',
    idPlaceholder:'e.g. AD01, A101, H201',
    password:     'Password',
    passPlaceholder: 'Enter your password',
    signIn:       'Sign In',
    signingIn:    'Signing in...',
    invalidCreds: 'Invalid ID or password. Please check your credentials.',
    idGuide:      'User ID Guide',
    adminGuide:   'Admin: AD01–AD05 → password: admin1–admin5',
    driverGuide:  'Driver: A101–A200 → password: pass1–pass100',
    hospitalGuide:'Hospital: H201–H250 → password: hosp1–hosp50',
    langToggle:   'தமிழ்',
    footerNote:   '© Government of Tamil Nadu. All rights reserved.',
    helpline:     'Emergency Helpline',
    adminRole:    'Admin',
    driverRole:   'Driver',
    hospitalRole: 'Hospital',
  },
  ta: {
    govTitle:     'தமிழ்நாடு அரசு',
    govSub:       'சுகாதாரம் மற்றும் குடும்ப நலத்துறை',
    sysTitle:     'அவசர படுக்கை முன்பதிவு அமைப்பு',
    cardTitle:    'அதிகாரப்பூர்வ போர்டல் உள்நுழைவு',
    cardSub:      'அங்கீகரிக்கப்பட்ட பணியாளர்கள் மட்டும்',
    enterID:      'பயனர் எண் உள்ளிடவும்',
    idPlaceholder:'எ.கா. AD01, A101, H201',
    password:     'கடவுச்சொல்',
    passPlaceholder: 'கடவுச்சொல் உள்ளிடவும்',
    signIn:       'உள்நுழைக',
    signingIn:    'உள்நுழைகிறது...',
    invalidCreds: 'தவறான எண் அல்லது கடவுச்சொல்',
    idGuide:      'பயனர் எண் வழிகாட்டி',
    adminGuide:   'நிர்வாகி: AD01–AD05 → கடவுச்சொல்: admin1–admin5',
    driverGuide:  'ஓட்டுநர்: A101–A200 → கடவுச்சொல்: pass1–pass100',
    hospitalGuide:'மருத்துவமனை: H201–H250 → கடவுச்சொல்: hosp1–hosp50',
    langToggle:   'English',
    footerNote:   '© தமிழ்நாடு அரசு. அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.',
    helpline:     'அவசர உதவி எண்',
    adminRole:    'நிர்வாகி',
    driverRole:   'ஓட்டுநர்',
    hospitalRole: 'மருத்துவமனை',
  },
};

const ROLE_META = {
  admin:    { color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200', icon: Shield,    route: '/admin',     labelKey: 'adminRole' },
  hospital: { color: 'text-green-600',  bg: 'bg-green-50 border-green-200',   icon: Building2, route: '/hospital',  labelKey: 'hospitalRole' },
  driver:   { color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200', icon: Truck,     route: '/ambulance', labelKey: 'driverRole' },
};

export default function Login() {
  const navigate = useNavigate();
  const [lang, setLang] = useState('en');
  const [form, setForm] = useState({ id: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [detectedRole, setDetectedRole] = useState(null);

  const t = LANG[lang];

  const handleIdChange = (val) => {
    setForm(f => ({ ...f, id: val }));
    setError('');
    const upper = val.trim().toUpperCase();
    if (upper.startsWith('AD'))      setDetectedRole('admin');
    else if (upper.startsWith('H'))  setDetectedRole('hospital');
    else if (upper.startsWith('A'))  setDetectedRole('driver');
    else                             setDetectedRole(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTimeout(() => {
      const user = authenticateUser(form.id, form.password);
      if (user) {
        localStorage.setItem('auth', 'true');
        localStorage.setItem('currentUser', JSON.stringify(user));
        navigate(ROLE_META[user.role].route);
      } else {
        setError(t.invalidCreds);
      }
      setLoading(false);
    }, 600);
  };

  const RoleIcon = detectedRole ? ROLE_META[detectedRole].icon : null;

  return (
    <div className="min-h-screen bg-[#f0f4f8] font-sans flex flex-col">

      {/* ── GOVERNMENT HEADER ─────────────────────────────── */}
      <header className="bg-[#1a3a6b] text-white">
        {/* Tricolor strip */}
        <div className="flex h-1.5">
          <div className="flex-1 bg-[#FF9933]" />
          <div className="flex-1 bg-white" />
          <div className="flex-1 bg-[#138808]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-4">
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
              <button
                onClick={() => setLang(l => l === 'en' ? 'ta' : 'en')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-xs font-semibold transition-all"
              >
                <Globe size={13} />
                {t.langToggle}
              </button>
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-red-600/80 rounded-lg text-xs font-bold">
                <Phone size={12} />
                108
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ──────────────────────────────────── */}
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">

          {/* Login Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-md overflow-hidden">

            {/* Card header */}
            <div className="bg-[#1a3a6b] px-6 py-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow">
                <Shield size={22} className="text-[#1a3a6b]" />
              </div>
              <div>
                <h2 className="text-white font-bold text-base leading-tight">{t.cardTitle}</h2>
                <p className="text-blue-300 text-xs mt-0.5">{t.cardSub}</p>
              </div>
            </div>

            <div className="p-6">
              {/* Error */}
              {error && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3.5 mb-5 text-sm">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* ID field */}
                <div>
                  <label className="block text-sm font-semibold text-[#1a3a6b] mb-1.5">
                    {t.enterID}
                  </label>
                  <div className="relative">
                    {RoleIcon ? (
                      <RoleIcon
                        size={16}
                        className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${ROLE_META[detectedRole].color}`}
                      />
                    ) : (
                      <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    )}
                    <input
                      type="text"
                      value={form.id}
                      onChange={e => handleIdChange(e.target.value)}
                      placeholder={t.idPlaceholder}
                      required
                      autoFocus
                      className="w-full pl-10 pr-28 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b] focus:border-transparent transition-all"
                    />
                    {detectedRole && (
                      <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold px-2.5 py-1 rounded border ${ROLE_META[detectedRole].bg} ${ROLE_META[detectedRole].color}`}>
                        {t[ROLE_META[detectedRole].labelKey]}
                      </span>
                    )}
                  </div>
                </div>

                {/* Password field */}
                <div>
                  <label className="block text-sm font-semibold text-[#1a3a6b] mb-1.5">
                    {t.password}
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      placeholder={t.passPlaceholder}
                      required
                      className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b] focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#1a3a6b] hover:bg-[#163060] disabled:opacity-60 text-white font-semibold rounded-lg transition-all shadow-sm hover:shadow-md active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {t.signingIn}
                    </>
                  ) : t.signIn}
                </button>
              </form>

              {/* ID Guide */}
              <div className="mt-5 p-4 bg-blue-50 border border-blue-200 rounded-lg text-xs text-gray-600 space-y-2">
                <p className="font-bold text-[#1a3a6b] mb-2">{t.idGuide}</p>
                <div className="flex items-start gap-2">
                  <Shield size={12} className="text-purple-500 mt-0.5 flex-shrink-0" />
                  <span>{t.adminGuide}</span>
                </div>
                <div className="flex items-start gap-2">
                  <Truck size={12} className="text-orange-500 mt-0.5 flex-shrink-0" />
                  <span>{t.driverGuide}</span>
                </div>
                <div className="flex items-start gap-2">
                  <Building2 size={12} className="text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{t.hospitalGuide}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── FOOTER ────────────────────────────────────────── */}
      <footer className="bg-[#1a3a6b] text-white">
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
