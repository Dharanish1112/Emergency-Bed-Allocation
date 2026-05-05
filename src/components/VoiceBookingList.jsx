import React, { useState, useEffect } from 'react';
import { Phone, MapPin, Clock, User, Volume2 } from 'lucide-react';

const VoiceBookingList = () => {
  const [voiceBookings, setVoiceBookings] = useState([]);

  useEffect(() => {
    // Load voice bookings from localStorage
    const bookings = JSON.parse(localStorage.getItem('voiceBookings') || '[]');
    setVoiceBookings(bookings);
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getBedTypeColor = (bedType) => {
    const colors = {
      icu: 'bg-red-100 text-red-800',
      emergency: 'bg-orange-100 text-orange-800',
      general: 'bg-blue-100 text-blue-800',
      private: 'bg-purple-100 text-purple-800',
      deluxe: 'bg-green-100 text-green-800'
    };
    return colors[bedType] || colors.general;
  };

  return (
    <div className="space-y-3">
      {voiceBookings.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No voice bookings yet</p>
        </div>
      ) : (
        voiceBookings.map((booking, index) => (
          <div key={booking.bookingId} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                  <Volume2 size={16} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Voice Booking</p>
                  <p className="text-xs text-gray-500">{formatDate(booking.createdAt)}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  booking.urgency === 'emergency' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {booking.urgency}
                </span>
                <span className="text-sm text-gray-500">ID: {booking.bookingId}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Hospital</p>
                <p className="font-medium text-gray-900">{booking.hospital.name}</p>
              </div>
              
              <div>
                <p className="text-xs text-gray-500 mb-1">Patient</p>
                <p className="font-medium text-gray-900">{booking.patientName}</p>
              </div>
              
              <div>
                <p className="text-xs text-gray-500 mb-1">Bed Type</p>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getBedTypeColor(booking.bedType)}`}>
                  {booking.bedType}
                </span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <MapPin size={14} />
                  <span>{booking.hospital.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={14} />
                  <span>{booking.hospital.phone}</span>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default VoiceBookingList;
