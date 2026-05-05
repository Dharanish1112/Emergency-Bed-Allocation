import React, { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, query, where, orderBy, limit, doc, updateDoc, addDoc, onSnapshot } from 'firebase/firestore';
import { Phone, MapPin, Clock, Users, CheckCircle, AlertTriangle, Navigation } from 'lucide-react';
import toast from 'react-hot-toast';

const BookingSystem = () => {
  const [hospitals, setHospitals] = useState([]);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [userLocation, setUserLocation] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookingStatus, setBookingStatus] = useState('idle'); // idle, searching, booking, confirmed
  const db = getFirestore();

  useEffect(() => {
    // Fetch hospitals
    const hospitalsQuery = query(collection(db, 'hospitals'), orderBy('hospitalId'));
    const unsubscribeHospitals = onSnapshot(hospitalsQuery, (snapshot) => {
      const hospitalsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setHospitals(hospitalsData);
    });

    // Fetch available drivers
    const driversQuery = query(
      collection(db, 'drivers'),
      where('status', '==', 'Available'),
      orderBy('uploadedAt', 'desc')
    );
    const unsubscribeDrivers = onSnapshot(driversQuery, (snapshot) => {
      const driversData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAvailableDrivers(driversData);
    });

    return () => {
      unsubscribeHospitals();
      unsubscribeDrivers();
    };
  }, [db]);

  const handleBooking = async () => {
    if (!selectedHospital || !userLocation || !userPhone) {
      toast.error('Please fill all fields');
      return;
    }

    if (availableDrivers.length === 0) {
      toast.error('No drivers available at the moment');
      return;
    }

    setLoading(true);
    setBookingStatus('searching');

    try {
      // Assign nearest available driver (simplified - in real app, use geolocation)
      const assignedDriver = availableDrivers[0];

      // Create booking record
      const bookingData = {
        hospitalId: selectedHospital.id,
        hospitalName: selectedHospital.name,
        userLocation: userLocation,
        userPhone: userPhone,
        driverId: assignedDriver.id,
        driverName: assignedDriver.name,
        driverPhone: assignedDriver.phone,
        status: 'assigned',
        createdAt: new Date(),
        estimatedArrival: '5-10 minutes'
      };

      const bookingRef = await addDoc(collection(db, 'bookings'), bookingData);

      // Update driver status to 'Busy'
      const driverRef = doc(db, 'drivers', assignedDriver.id);
      await updateDoc(driverRef, {
        status: 'Busy',
        currentBookingId: bookingRef.id,
        updatedAt: new Date()
      });

      // Update hospital beds if needed
      if (selectedHospital.bedsAvailable > 0) {
        const hospitalRef = doc(db, 'hospitals', selectedHospital.id);
        await updateDoc(hospitalRef, {
          bedsAvailable: selectedHospital.bedsAvailable - 1,
          updatedAt: new Date()
        });
      }

      setBookingStatus('confirmed');
      toast.success(`Ambulance assigned! ${assignedDriver.name} is on the way.`);

      // Reset form after 3 seconds
      setTimeout(() => {
        setBookingStatus('idle');
        setSelectedHospital(null);
        setUserLocation('');
        setUserPhone('');
      }, 3000);

    } catch (error) {
      console.error('Booking error:', error);
      toast.error('Failed to book ambulance. Please try again.');
      setBookingStatus('idle');
    } finally {
      setLoading(false);
    }
  };

  const getBookingStatusColor = () => {
    switch (bookingStatus) {
      case 'searching': return 'text-blue-600 bg-blue-50';
      case 'booking': return 'text-orange-600 bg-orange-50';
      case 'confirmed': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getBookingStatusText = () => {
    switch (bookingStatus) {
      case 'searching': return 'Searching for available drivers...';
      case 'booking': return 'Assigning driver...';
      case 'confirmed': return 'Ambulance assigned successfully!';
      default: return 'Book Emergency Ambulance';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold text-gray-900">Emergency Booking</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">Available Drivers: {availableDrivers.length}</span>
              <span className="text-sm text-gray-500">Hospitals: {hospitals.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Booking Form */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Book Emergency Ambulance</h2>
              
              <div className="space-y-4">
                {/* Hospital Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Hospital</label>
                  <select
                    value={selectedHospital?.id || ''}
                    onChange={(e) => {
                      const hospital = hospitals.find(h => h.id === e.target.value);
                      setSelectedHospital(hospital);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Choose a hospital...</option>
                    {hospitals.map((hospital) => (
                      <option key={hospital.id} value={hospital.id}>
                        {hospital.name} ({hospital.bedsAvailable || 0} beds available)
                      </option>
                    ))}
                  </select>
                </div>

                {/* User Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Location</label>
                  <input
                    type="text"
                    value={userLocation}
                    onChange={(e) => setUserLocation(e.target.value)}
                    placeholder="Enter your address or landmark"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={userPhone}
                    onChange={(e) => setUserPhone(e.target.value)}
                    placeholder="Enter your phone number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Book Button */}
                <button
                  onClick={handleBooking}
                  disabled={loading || !selectedHospital || !userLocation || !userPhone}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                    loading
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    getBookingStatusText()
                  )}
                </button>

                {/* Status Display */}
                {bookingStatus !== 'idle' && (
                  <div className={`p-4 rounded-lg text-center ${getBookingStatusColor()}`}>
                    <div className="flex items-center justify-center gap-2">
                      {bookingStatus === 'searching' && <Navigation className="animate-spin" size={20} />}
                      {bookingStatus === 'booking' && <Clock size={20} />}
                      {bookingStatus === 'confirmed' && <CheckCircle size={20} />}
                      <span className="font-medium">{getBookingStatusText()}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Available Drivers */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Drivers</h3>
              <div className="space-y-3">
                {availableDrivers.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertTriangle className="mx-auto text-orange-500 mb-2" size={40} />
                    <p className="text-gray-500">No drivers available at the moment</p>
                    <p className="text-sm text-gray-400">Please try again in a few minutes</p>
                  </div>
                ) : (
                  availableDrivers.slice(0, 3).map((driver) => (
                    <div key={driver.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users size={20} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{driver.name}</p>
                          <p className="text-sm text-gray-500">{driver.location}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone size={16} className="text-gray-400" />
                        <span className="text-sm text-gray-600">{driver.phone}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Hospital Details */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Hospital Information</h3>
              
              {selectedHospital ? (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">{selectedHospital.name}</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-700">
                        <MapPin size={16} className="text-blue-600" />
                        <span>{selectedHospital.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <CheckCircle size={16} className="text-green-600" />
                        <span>Beds Available: {selectedHospital.bedsAvailable || 0}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">
                          {selectedHospital.type || 'General Hospital'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertTriangle className="mx-auto text-gray-400 mb-2" size={40} />
                  <p className="text-gray-500">Select a hospital to view details</p>
                </div>
              )}
            </div>

            {/* Emergency Info */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-red-900 mb-4">Emergency Information</h3>
              <div className="space-y-3 text-sm text-red-800">
                <div className="flex items-center gap-2">
                  <Phone size={16} />
                  <span>Emergency Hotline: 108</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={16} />
                  <span>Average Response Time: 5-10 minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} />
                  <span>24/7 Service Available</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingSystem;
