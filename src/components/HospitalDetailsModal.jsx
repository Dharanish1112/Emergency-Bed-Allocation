import { MapPin, Clock, Bed, Phone, Mail, Globe, X } from 'lucide-react';

const statusConfig = {
  available: { label: 'Available', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  critical: { label: 'Critical', color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  full: { label: 'Full', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
};

export default function HospitalDetailsModal({ hospital, isOpen, onClose, onBook }) {
  if (!hospital) return null;

  const s = statusConfig[hospital.status] || statusConfig.available;
  const isFull = hospital.status === 'full';

  return (
    isOpen && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 ${s.color} rounded-xl flex items-center justify-center`}>
                <Bed size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{hospital.name}</h2>
                <p className="text-sm text-gray-500">{hospital.speciality}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Left Column - Image and Basic Info */}
              <div className="space-y-4">
                <img
                  src={hospital.image}
                  alt={hospital.name}
                  className="w-full h-48 object-cover rounded-xl"
                />
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${s.color}`}>
                      <span className={`w-2 h-2 rounded-full ${s.dot} animate-pulse`} />
                      <span className="ml-1">{s.label}</span>
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                      <span className="text-yellow-500 text-xs">★</span>
                      <span className="text-xs font-semibold text-gray-700">{hospital.rating}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <MapPin size={16} className="text-gray-400 flex-shrink-0" />
                      <span>{hospital.address}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <Clock size={16} className="text-gray-400 flex-shrink-0" />
                      <span>ETA: {hospital.eta}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <Globe size={16} className="text-gray-400 flex-shrink-0" />
                      <span>{hospital.distance} away</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Bed Availability */}
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-4">Bed Availability</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                          <span className="text-red-600 text-xs font-bold">ICU</span>
                        </div>
                        <span className="text-sm text-gray-700">Intensive Care Unit</span>
                      </div>
                      <span className={`text-lg font-bold ${hospital.beds.icu > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {hospital.beds.icu} beds
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                          <span className="text-orange-600 text-xs font-bold">EM</span>
                        </div>
                        <span className="text-sm text-gray-700">Emergency</span>
                      </div>
                      <span className={`text-lg font-bold ${hospital.beds.emergency > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {hospital.beds.emergency} beds
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-blue-600 text-xs font-bold">GEN</span>
                        </div>
                        <span className="text-sm text-gray-700">General Ward</span>
                      </div>
                      <span className={`text-lg font-bold ${hospital.beds.general > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {hospital.beds.general} beds
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="bg-blue-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-4 text-center">Emergency Contact</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <Phone size={16} className="text-gray-400 flex-shrink-0" />
                      <span>Emergency: 108 / Ambulance</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <Mail size={16} className="text-gray-400 flex-shrink-0" />
                      <span>emergency@hospital.com</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t bg-gray-50">
            <div className="text-sm text-gray-600 flex items-center">
              {isFull ? (
                <span className="text-red-600 font-medium">⚠️ No beds available</span>
              ) : (
                <span className="text-green-600 font-medium">✓ Beds available for booking</span>
              )}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-medium transition-colors"
              >
                Close
              </button>
              
              <button
                onClick={() => !isFull && onBook(hospital)}
                disabled={isFull}
                className={`px-6 py-2.5 rounded-xl font-medium transition-all
                  ${isFull
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md active:scale-95'
                  }`}
              >
                {isFull ? 'No Beds Available' : 'Book Now'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  );
}
