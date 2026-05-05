/**
 * Government-style StatsCard
 * White card with 4px left colored border, icon in colored bg square,
 * value in navy, label in gray.
 */
export default function StatsCard({ icon: Icon, label, value, sub, color = 'blue', trend }) {
  const colorMap = {
    blue:   { border: 'border-l-blue-500',   iconBg: 'bg-blue-50',   iconText: 'text-blue-600',   valueText: 'text-[#1a3a6b]' },
    green:  { border: 'border-l-green-500',  iconBg: 'bg-green-50',  iconText: 'text-green-600',  valueText: 'text-[#1a3a6b]' },
    red:    { border: 'border-l-red-500',    iconBg: 'bg-red-50',    iconText: 'text-red-600',    valueText: 'text-[#1a3a6b]' },
    orange: { border: 'border-l-orange-500', iconBg: 'bg-orange-50', iconText: 'text-orange-600', valueText: 'text-[#1a3a6b]' },
    purple: { border: 'border-l-purple-500', iconBg: 'bg-purple-50', iconText: 'text-purple-600', valueText: 'text-[#1a3a6b]' },
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <div className={`border-l-4 ${c.border} bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-start gap-3`}>
      <div className={`${c.iconBg} p-2.5 rounded-lg flex-shrink-0`}>
        <Icon size={20} className={c.iconText} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        <p className={`text-2xl font-bold mt-0.5 ${c.valueText}`}>{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        {trend !== undefined && trend !== null && (
          <span className={`text-xs font-medium mt-1 inline-block ${trend > 0 ? 'text-green-600' : 'text-red-500'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% vs yesterday
          </span>
        )}
      </div>
    </div>
  );
}
