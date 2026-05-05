import { Clock, MapPin, CheckCircle, XCircle, Zap } from 'lucide-react';

const emergencyColors = {
  'Cardiac Arrest':       { bar: 'bg-red-500',    badge: 'bg-red-50 text-red-700 border-red-200',       icon: '❤️' },
  'Trauma / Accident':    { bar: 'bg-orange-500', badge: 'bg-orange-50 text-orange-700 border-orange-200', icon: '🚨' },
  'Stroke':               { bar: 'bg-purple-500', badge: 'bg-purple-50 text-purple-700 border-purple-200', icon: '🧠' },
  'Respiratory Failure':  { bar: 'bg-blue-500',   badge: 'bg-blue-50 text-blue-700 border-blue-200',     icon: '🫁' },
};

const bedBadge = {
  ICU:       'bg-red-50 text-red-700 border-red-200',
  Emergency: 'bg-orange-50 text-orange-700 border-orange-200',
  General:   'bg-blue-50 text-blue-700 border-blue-200',
};

/**
 * Government-style RequestCard
 * Props: request, onAccept, onReject, lang (optional), t (optional translation obj)
 */
export default function RequestCard({ request, onAccept, onReject, t }) {
  const ec = emergencyColors[request.emergencyType] || {
    bar: 'bg-gray-400',
    badge: 'bg-gray-50 text-gray-700 border-gray-200',
    icon: '🏥',
  };
  const isAccepted = request.status === 'accepted';
  const isRejected = request.status === 'rejected';

  const acceptLabel = t?.accept  || 'Accept';
  const rejectLabel = t?.reject  || 'Reject';

  return (
    <div className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all duration-200
      ${request.isNew && !isAccepted && !isRejected ? 'border-[#1a3a6b]/30 ring-1 ring-[#1a3a6b]/10' : 'border-gray-200'}
      ${isAccepted ? 'opacity-80' : ''}
    `}>
      {/* NEW REQUEST banner */}
      {request.isNew && !isAccepted && !isRejected && (
        <div className="bg-[#1a3a6b] text-white text-xs font-bold px-3 py-1 flex items-center gap-1">
          <Zap size={11} />
          NEW REQUEST
        </div>
      )}

      {/* Left colored bar + content */}
      <div className="flex">
        <div className={`w-1 flex-shrink-0 ${ec.bar}`} />

        <div className="flex-1 p-4">
          {/* Top row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-lg flex-shrink-0">
                {ec.icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-[#1a3a6b] text-sm">{request.patientName}</h4>
                  <span className="text-xs text-gray-400">Age {request.age}</span>
                </div>
                <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded border mt-1 ${ec.badge}`}>
                  {request.emergencyType}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${bedBadge[request.bedType] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                {request.bedType} Bed
              </span>
              <span className="text-xs text-gray-400">{request.time}</span>
            </div>
          </div>

          {/* Info row */}
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Clock size={12} className="text-green-500" />
              <span>ETA <strong className="text-gray-700">{request.eta}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <MapPin size={12} className="text-[#1a3a6b]" />
              <span><strong className="text-gray-700">{request.distance}</strong> away</span>
            </div>
            {request.driverName && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="text-gray-400">Driver:</span>
                <strong className="text-gray-700">{request.driverName}</strong>
              </div>
            )}
            <span className="text-xs text-gray-400 ml-auto">#{request.id?.slice(0, 12)}</span>
          </div>
          {request.notes && (
            <div className="mt-2 px-2 py-1.5 bg-gray-50 rounded-lg text-xs text-gray-600 border border-gray-100">
              <span className="font-semibold text-gray-500">Notes: </span>{request.notes}
            </div>
          )}

          {/* Action buttons */}
          {!isAccepted && !isRejected && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => onAccept(request.id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#1a3a6b] hover:bg-[#163060] text-white text-sm font-semibold transition-all active:scale-95"
              >
                <CheckCircle size={14} />
                {acceptLabel}
              </button>
              <button
                onClick={() => onReject(request.id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-all active:scale-95"
              >
                <XCircle size={14} />
                {rejectLabel}
              </button>
            </div>
          )}

          {isAccepted && (
            <div className="mt-3 flex items-center justify-center gap-2 py-2 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm font-semibold">
              <CheckCircle size={14} />
              {t?.accepted || 'Accepted'}
            </div>
          )}
          {isRejected && (
            <div className="mt-3 flex items-center justify-center gap-2 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm font-semibold">
              <XCircle size={14} />
              {t?.reject || 'Rejected'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
