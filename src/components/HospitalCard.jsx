import { MapPin, Clock, Bed, CheckCircle, XCircle } from 'lucide-react';

const statusConfig = {
  available: { label: 'Available', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  critical:  { label: 'Critical',  color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  full:      { label: 'Full',      color: 'bg-red-100 text-red-700',    dot: 'bg-red-500' },
};

export default function HospitalCard({ hospital, onBook, isBooked }) {
  const s = statusConfig[hospital.status] || statusConfig.available;
  const isFull = hospital.status === 'full';

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border transition-all duration-200 overflow-hidden
        ${isBooked ? 'border-green-300 ring-2 ring-green-100' : 'border-gray-100 hover:shadow-md hover:border-gray-200'}`}
    >
      <div className="flex flex-col sm:flex-row">
        {/* Image */}
        <div className="sm:w-44 h-36 sm:h-auto flex-shrink-0 relative">
          <img
            src={hospital.image}
            alt={hospital.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 left-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${s.dot} ${!isFull ? 'animate-pulse' : ''}`} />
              {s.label}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-bold text-gray-900 text-base">{hospital.name}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{hospital.speciality}</p>
              </div>
              <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg flex-shrink-0">
                <span className="text-yellow-500 text-xs">★</span>
                <span className="text-xs font-semibold text-gray-700">{hospital.rating}</span>
              </div>
            </div>

            <div className="flex items-center gap-1 mt-2 text-gray-500 text-xs">
              <MapPin size={12} />
              <span>{hospital.address}</span>
            </div>

            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5 text-sm">
                <MapPin size={14} className="text-blue-500" />
                <span className="font-semibold text-gray-700">{hospital.distance}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <Clock size={14} className="text-green-500" />
                <span className="font-semibold text-gray-700">ETA {hospital.eta}</span>
              </div>
            </div>

            {/* Bed Availability */}
            <div className="flex gap-2 mt-3 flex-wrap">
              <BedBadge label="ICU" count={hospital.beds.icu} />
              <BedBadge label="Emergency" count={hospital.beds.emergency} />
              <BedBadge label="General" count={hospital.beds.general} />
            </div>
          </div>

          {/* Single Action Button */}
          <div className="flex sm:flex-col items-center sm:items-end justify-end sm:justify-center sm:min-w-[110px]">
            {isBooked ? (
              <div className="flex items-center gap-1.5 text-green-600 text-sm font-semibold bg-green-50 px-4 py-2.5 rounded-xl">
                <CheckCircle size={16} />
                Booked
              </div>
            ) : isFull ? (
              <div className="flex items-center gap-1.5 text-red-500 text-sm font-semibold bg-red-50 px-4 py-2.5 rounded-xl">
                <XCircle size={16} />
                No Beds
              </div>
            ) : (
              <button
                onClick={() => onBook(hospital)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow-md active:scale-95 transition-all"
              >
                Book Bed
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function BedBadge({ label, count }) {
  const available = count > 0;
  return (
    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium
      ${available ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
      <Bed size={11} />
      <span>{label}: {count}</span>
    </div>
  );
}
