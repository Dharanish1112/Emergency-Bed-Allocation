import React, { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import { Users, MapPin, Activity, TrendingUp, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalDrivers: 0,
    availableDrivers: 0,
    busyDrivers: 0,
    onTripDrivers: 0,
    totalHospitals: 0,
    totalBeds: 0,
    availableBeds: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const db = getFirestore();

  useEffect(() => {
    // Real-time listeners for statistics
    const driversQuery = collection(db, 'drivers');
    const hospitalsQuery = collection(db, 'hospitals');

    const unsubscribeDrivers = onSnapshot(driversQuery, (snapshot) => {
      const driversData = snapshot.docs.map(doc => doc.data());
      
      const availableCount = driversData.filter(d => d.status === 'Available').length;
      const busyCount = driversData.filter(d => d.status === 'Busy').length;
      const onTripCount = driversData.filter(d => d.status === 'On Trip').length;

      setStats(prev => ({
        ...prev,
        totalDrivers: driversData.length,
        availableDrivers: availableCount,
        busyDrivers: busyCount,
        onTripDrivers: onTripCount
      }));
    });

    const unsubscribeHospitals = onSnapshot(hospitalsQuery, (snapshot) => {
      const hospitalsData = snapshot.docs.map(doc => doc.data());
      const totalBeds = hospitalsData.reduce((sum, h) => sum + (h.bedsAvailable || 0), 0);
      
      setStats(prev => ({
        ...prev,
        totalHospitals: hospitalsData.length,
        totalBeds: totalBeds,
        availableBeds: totalBeds // Assuming all beds are available
      }));
      setLoading(false);
    });

    // Simulate recent activity (in real app, this would come from Firestore)
    setRecentActivity([
      { id: 1, type: 'booking', message: 'New booking assigned to Driver #23', time: '2 min ago', status: 'success' },
      { id: 2, type: 'status', message: 'Driver #15 status changed to Available', time: '5 min ago', status: 'info' },
      { id: 3, type: 'alert', message: 'Hospital #3 beds running low', time: '10 min ago', status: 'warning' },
      { id: 4, type: 'booking', message: 'Emergency trip completed by Driver #8', time: '15 min ago', status: 'success' }
    ]);

    return () => {
      unsubscribeDrivers();
      unsubscribeHospitals();
    };
  }, [db]);

  const getActivityIcon = (type, status) => {
    if (type === 'booking') return <Users size={16} className={status === 'success' ? 'text-green-600' : 'text-blue-600'} />;
    if (type === 'status') return <Activity size={16} className="text-blue-600" />;
    if (type === 'alert') return <AlertCircle size={16} className="text-orange-600" />;
    return <Activity size={16} className="text-gray-600" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
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
            <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">Last updated: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Drivers</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDrivers}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users size={24} className="text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Available Drivers</p>
                <p className="text-2xl font-bold text-green-600">{stats.availableDrivers}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle size={24} className="text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Hospitals</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalHospitals}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <MapPin size={24} className="text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Available Beds</p>
                <p className="text-2xl font-bold text-blue-600">{stats.availableBeds}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <TrendingUp size={24} className="text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Driver Status Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Driver Status Breakdown</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Available</span>
                </div>
                <span className="text-lg font-bold text-green-600">{stats.availableDrivers}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Busy</span>
                </div>
                <span className="text-lg font-bold text-orange-600">{stats.busyDrivers}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">On Trip</span>
                </div>
                <span className="text-lg font-bold text-blue-600">{stats.onTripDrivers}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="mt-1">
                    {getActivityIcon(activity.type, activity.status)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
