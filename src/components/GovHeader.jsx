import { Shield, Globe, Phone, LogOut, Building2, User, Hash, MapPin, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Reusable Government Header
 * Props:
 *   role        – 'admin' | 'hospital'
 *   user        – { name, id, location, role }
 *   lang        – 'en' | 'ta'
 *   setLang     – state setter
 *   notifications – optional number
 *   t           – translation object (must include govTitle, sysTitle, govSub, portalLabel, logout, langToggle)
 *   portalIcon  – optional Lucide icon component (defaults to Shield for admin, Building2 for hospital)
 *   infoItems   – optional array of { icon, label, value, green } for the info bar
 */
export default function GovHeader({ role, user, lang, setLang, t, portalIcon, infoItems }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('auth');
    localStorage.removeItem('currentUser');
    navigate('/login');
  };

  const DefaultIcon = role === 'hospital' ? Building2 : Shield;
  const PortalIcon = portalIcon || DefaultIcon;

  const iconBg = role === 'hospital' ? 'bg-green-100' : role === 'admin' ? 'bg-purple-100' : 'bg-blue-100';
  const iconColor = role === 'hospital' ? 'text-green-700' : role === 'admin' ? 'text-purple-700' : 'text-blue-700';

  return (
    <header className="bg-[#1a3a6b] text-white">
      {/* Tricolor strip */}
      <div className="flex h-1.5">
        <div className="flex-1 bg-[#FF9933]" />
        <div className="flex-1 bg-white" />
        <div className="flex-1 bg-[#138808]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main header row */}
        <div className="flex items-center justify-between py-3 border-b border-white/10">
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

        {/* Portal info bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center`}>
              <PortalIcon size={20} className={iconColor} />
            </div>
            <div>
              <p className="text-xs text-blue-300">{t.portalLabel}</p>
              <p className="font-bold text-white text-sm">
                {user?.name || (role === 'admin' ? 'Administrator' : 'Hospital')}
              </p>
            </div>
          </div>

          {infoItems && (
            <div className="flex flex-wrap items-center gap-4 text-xs">
              {infoItems.map((item, i) => (
                <InfoPill key={i} icon={item.icon} label={item.label} value={item.value} green={item.green} />
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

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
