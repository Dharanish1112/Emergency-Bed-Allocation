import React, { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { Users, MapPin, Phone, Activity, CheckCircle, XCircle, Clock } from 'lucide-react';

const DataDisplay = () => {
  const [drivers, setDrivers] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('drivers');
  const db = getFirestore();

  useEffect(() => {
    // Real-time listeners for Firebase data
    const driversQuery = query(collection(db, 'drivers'), orderBy('uploadedAt', 'desc'));
    const hospitalsQuery = query(collection(db, 'hospitals'), orderBy('hospitalId'));

    const unsubscribeDrivers = onSnapshot(driversQuery, (snapshot) => {
      const driversData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        uploadedAt: doc.data().uploadedAt?.toDate()
      }));
      setDrivers(driversData);
    });

    const unsubscribeHospitals = onSnapshot(hospitalsQuery, (snapshot) => {
      const hospitalsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setHospitals(hospitalsData);
      setLoading(false);
    });

    return () => {
      unsubscribeDrivers();
      unsubscribeHospitals();
    };
  }, [db]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Available': return 'text-green-600 bg-green-100';
      case 'Busy': return 'text-orange-600 bg-orange-100';
      case 'On Trip': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Available': return <CheckCircle size={16} />;
      case 'Busy': return <Clock size={16} />;
      case 'On Trip': return <Activity size={16} />;
      default: return <XCircle size={16} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold text-gray-900">Emergency Management System</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">Drivers: {drivers.length}</span>
              <span className="text-sm text-gray-500">Hospitals: {hospitals.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('drivers')}
              className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'drivers'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Drivers ({drivers.length})
            </button>
            <button
              onClick={() => setActiveTab('hospitals')}
              className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'hospitals'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Hospitals ({hospitals.length})
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'drivers' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {drivers.map((driver) => (
                  <div key={driver.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Users size={20} className="text-blue-600" />
                        <h3 className="font-semibold text-gray-900">{driver.name}</h3>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(driver.status)}`}>
                        {getStatusIcon(driver.status)}
                        <span className="ml-1">{driver.status}</span>
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone size={14} />
                        <span>{driver.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin size={14} />
                        <span>{driver.location}</span>
                      </div>
                      {driver.uploadedAt && (
                        <div className="flex items-center gap-2 text-gray-400">
                          <Clock size={14} />
                          <span>{new Date(driver.uploadedAt).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'hospitals' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {hospitals.map((hospital) => (
                  <div key={hospital.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-blue-600 font-bold text-sm">{hospital.hospitalId}</span>
                        </div>
                        <h3 className="font-semibold text-gray-900">{hospital.name}</h3>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin size={14} />
                        <span>{hospital.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Activity size={14} />
                        <span>Beds Available: {hospital.bedsAvailable || 0}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">
                          {hospital.type || 'General'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataDisplay;
