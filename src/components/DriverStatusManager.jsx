import React, { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, query, where, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { Users, MapPin, Phone, Activity, CheckCircle, XCircle, Clock, Navigation, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const DriverStatusManager = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all'); // all, available, busy, ontrip
  const db = getFirestore();

  useEffect(() => {
    const driversQuery = collection(db, 'drivers');
    const unsubscribe = onSnapshot(driversQuery, (snapshot) => {
      const driversData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        lastUpdated: doc.data().updatedAt?.toDate()
      }));
      setDrivers(driversData);
    });

    return () => unsubscribe();
  }, [db]);

  const handleStatusChange = async (driverId, newStatus) => {
    setLoading(true);
    try {
      const driverRef = doc(db, 'drivers', driverId);
      
      // Prepare update data based on status
      let updateData = {
        status: newStatus,
        updatedAt: new Date()
      };

      // Clear booking info when changing to Available
      if (newStatus === 'Available') {
        updateData.currentBookingId = null;
        updateData.tripStartTime = null;
      }

      // Set trip start time when changing to On Trip
      if (newStatus === 'On Trip') {
        updateData.tripStartTime = new Date();
      }

      await updateDoc(driverRef, updateData);
      
      const driver = drivers.find(d => d.id === driverId);
      toast.success(`${driver?.name} status updated to ${newStatus}`);
      
    } catch (error) {
      console.error('Status update error:', error);
      toast.error('Failed to update driver status');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkStatusUpdate = async (status) => {
    setLoading(true);
    try {
      const updatePromises = drivers.map(driver => {
        const driverRef = doc(db, 'drivers', driver.id);
        let updateData = {
          status: status,
          updatedAt: new Date()
        };

        if (status === 'Available') {
          updateData.currentBookingId = null;
          updateData.tripStartTime = null;
        }

        if (status === 'On Trip') {
          updateData.tripStartTime = new Date();
        }

        return updateDoc(driverRef, updateData);
      });

      await Promise.all(updatePromises);
      toast.success(`All drivers updated to ${status}`);
      
    } catch (error) {
      console.error('Bulk update error:', error);
      toast.error('Failed to update drivers');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Available': return 'bg-green-100 text-green-800 border-green-200';
      case 'Busy': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'On Trip': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Available': return <CheckCircle size={16} className="text-green-600" />;
      case 'Busy': return <Clock size={16} className="text-orange-600" />;
      case 'On Trip': return <Navigation size={16} className="text-blue-600" />;
      default: return <XCircle size={16} className="text-gray-600" />;
    }
  };

  const filteredDrivers = drivers.filter(driver => {
    if (statusFilter === 'all') return true;
    return driver.status === statusFilter;
  });

  const statusCounts = {
    available: drivers.filter(d => d.status === 'Available').length,
    busy: drivers.filter(d => d.status === 'Busy').length,
    ontrip: drivers.filter(d => d.status === 'On Trip').length
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold text-gray-900">Driver Status Management</h1>
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleBulkStatusUpdate('Available')}
                disabled={loading}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                Set All Available
              </button>
              <button
                onClick={() => handleBulkStatusUpdate('Busy')}
                disabled={loading}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                Set All Busy
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Status Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Drivers</p>
                <p className="text-2xl font-bold text-gray-900">{drivers.length}</p>
              </div>
              <Users className="w-8 h-8 text-gray-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Available</p>
                <p className="text-2xl font-bold text-green-600">{statusCounts.available}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Busy</p>
                <p className="text-2xl font-bold text-orange-600">{statusCounts.busy}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">On Trip</p>
                <p className="text-2xl font-bold text-blue-600">{statusCounts.ontrip}</p>
              </div>
              <Navigation className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex border-b">
            {['all', 'available', 'busy', 'ontrip'].map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                  statusFilter === filter
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {filter === 'all' && `All Drivers (${drivers.length})`}
                {filter === 'available' && `Available (${statusCounts.available})`}
                {filter === 'busy' && `Busy (${statusCounts.busy})`}
                {filter === 'ontrip' && `On Trip (${statusCounts.ontrip})`}
              </button>
            ))}
          </div>
        </div>

        {/* Drivers List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDrivers.map((driver) => (
                  <tr key={driver.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users size={20} className="text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{driver.name}</div>
                          {driver.currentBookingId && (
                            <div className="text-xs text-gray-500">Booking: {driver.currentBookingId}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone size={14} />
                        {driver.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin size={14} />
                        {driver.location}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(driver.status)}`}>
                        {getStatusIcon(driver.status)}
                        <span className="ml-1">{driver.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {driver.lastUpdated ? new Date(driver.lastUpdated).toLocaleString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <select
                          value={driver.status}
                          onChange={(e) => handleStatusChange(driver.id, e.target.value)}
                          disabled={loading}
                          className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="Available">Available</option>
                          <option value="Busy">Busy</option>
                          <option value="On Trip">On Trip</option>
                        </select>
                        {driver.tripStartTime && (
                          <div className="text-xs text-gray-500">
                            Trip: {new Date(driver.tripStartTime).toLocaleTimeString()}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverStatusManager;
