import React, { useState } from 'react';
import { Shield, LogIn, Eye, EyeOff, Users, MapPin, Activity, Building, User } from 'lucide-react';
import toast from 'react-hot-toast';

const ExcelAuth = ({ onAuthSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Check if already authenticated
  React.useEffect(() => {
    const savedUser = localStorage.getItem('excelUser');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      setIsAuthenticated(true);
      onAuthSuccess(user);
    }
  }, [onAuthSuccess]);

  // Mock Excel data - In real implementation, this would come from Excel API
  const excelData = {
    admins: [
      {
        id: 'A001',
        name: 'Super Admin',
        email: 'admin@emergency.com',
        password: 'admin123',
        role: 'Super Admin',
        phone: '9876543210',
        department: 'Emergency Management',
        location: 'Trichy',
        permissions: ['all']
      },
      {
        id: 'A002', 
        name: 'System Admin',
        email: 'sysadmin@emergency.com',
        password: 'sys123',
        role: 'Admin',
        phone: '9876543211',
        department: 'IT Department',
        location: 'Trichy',
        permissions: ['system', 'users']
      }
    ],
    hospitals: [
      {
        id: 'H001',
        name: 'KMC Hospital',
        email: 'kmc@hospital.com',
        password: 'kmc123',
        role: 'Hospital Admin',
        phone: '9876543212',
        department: 'Emergency Ward',
        location: 'Trichy',
        hospitalId: 'H001',
        bedsAvailable: 50,
        address: 'Srirangam, Trichy'
      },
      {
        id: 'H002',
        name: 'Apollo Hospital',
        email: 'apollo@hospital.com', 
        password: 'apollo123',
        role: 'Hospital Admin',
        phone: '9876543213',
        department: 'Emergency Services',
        location: 'Trichy',
        hospitalId: 'H002',
        bedsAvailable: 30,
        address: 'Woraiyur, Trichy'
      }
    ],
    drivers: [
      {
        id: 'D001',
        name: 'Raj Kumar',
        email: 'raj@driver.com',
        password: 'driver123',
        role: 'Driver',
        phone: '9876543214',
        department: 'Emergency Services',
        location: 'Trichy',
        licenseNo: 'TN-01-2023-0001',
        ambulanceNo: 'TN-01-AB-1234',
        status: 'Available'
      },
      {
        id: 'D002',
        name: 'Kumaravel',
        email: 'kumar@driver.com',
        password: 'driver456',
        role: 'Driver',
        phone: '9876543215',
        department: 'Emergency Services',
        location: 'Trichy',
        licenseNo: 'TN-01-2023-0002',
        ambulanceNo: 'TN-01-AB-5678',
        status: 'Available'
      }
    ]
  };

  const authenticateWithExcel = async (email, password) => {
    try {
      // Search in all user types
      const allUsers = [
        ...excelData.admins.map(user => ({ ...user, userType: 'Admin' })),
        ...excelData.hospitals.map(user => ({ ...user, userType: 'Hospital' })),
        ...excelData.drivers.map(user => ({ ...user, userType: 'Driver' }))
      ];

      const user = allUsers.find(u => u.email === email && u.password === password);
      
      if (user) {
        return {
          ...user,
          loginTime: new Date().toISOString(),
          sessionActive: true
        };
      }
      
      return null;
    } catch (error) {
      console.error('Excel auth error:', error);
      throw error;
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }

    setLoading(true);
    
    try {
      // Authenticate with Excel data
      const userData = await authenticateWithExcel(email, password);
      
      if (userData) {
        // Save user data to localStorage
        localStorage.setItem('excelUser', JSON.stringify(userData));
        localStorage.setItem('auth', 'true');
        
        setCurrentUser(userData);
        setIsAuthenticated(true);
        
        onAuthSuccess(userData);
        toast.success(`Welcome back, ${userData.name}!`);
      } else {
        toast.error('Invalid email or password');
      }
      
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Failed to authenticate. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('excelUser');
    localStorage.removeItem('auth');
    setIsAuthenticated(false);
    setCurrentUser(null);
    toast.success('Logged out successfully');
  };

  if (isAuthenticated && currentUser) {
    // User Dashboard View
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  {currentUser.userType === 'Admin' && <Shield size={20} className="text-blue-600" />}
                  {currentUser.userType === 'Hospital' && <Building size={20} className="text-green-600" />}
                  {currentUser.userType === 'Driver' && <Users size={20} className="text-orange-600" />}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Emergency Management System</h1>
                  <p className="text-sm text-gray-500">{currentUser.name}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    currentUser.role === 'Super Admin' 
                      ? 'bg-purple-100 text-purple-800' 
                      : currentUser.role === 'Admin'
                      ? 'bg-blue-100 text-blue-800'
                      : currentUser.role === 'Hospital Admin'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {currentUser.role}
                  </span>
                  <span className="text-sm text-gray-500">ID: {currentUser.id}</span>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <LogIn size={16} />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* User Details Dashboard */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* User Header */}
            <div className={`bg-gradient-to-r p-6 text-white ${
              currentUser.userType === 'Admin' ? 'from-purple-600 to-purple-700' :
              currentUser.userType === 'Hospital' ? 'from-green-600 to-green-700' :
              'from-orange-600 to-orange-700'
            }`}>
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center">
                  {currentUser.userType === 'Admin' && <Shield size={40} className="text-white" />}
                  {currentUser.userType === 'Hospital' && <Building size={40} className="text-white" />}
                  {currentUser.userType === 'Driver' && <Users size={40} className="text-white" />}
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-1">{currentUser.name}</h2>
                  <p className="text-white/80">{currentUser.role} - {currentUser.userType}</p>
                  <p className="text-white/60 text-sm mt-1">Login Time: {new Date(currentUser.loginTime).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* User Information */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Basic Info */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <User size={18} className="text-blue-600" />
                    Basic Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Full Name</p>
                      <p className="font-medium text-gray-900">{currentUser.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email Address</p>
                      <p className="font-medium text-gray-900">{currentUser.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Phone Number</p>
                      <p className="font-medium text-gray-900">{currentUser.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">User Type</p>
                      <p className="font-medium text-gray-900">{currentUser.userType}</p>
                    </div>
                  </div>
                </div>

                {/* Department Info */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Building size={18} className="text-green-600" />
                    Department Details
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Department</p>
                      <p className="font-medium text-gray-900">{currentUser.department}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="font-medium text-gray-900">{currentUser.location}</p>
                    </div>
                    {currentUser.userType === 'Hospital' && (
                      <>
                        <div>
                          <p className="text-sm text-gray-500">Hospital ID</p>
                          <p className="font-medium text-gray-900">{currentUser.hospitalId}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Available Beds</p>
                          <p className="font-medium text-gray-900">{currentUser.bedsAvailable}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Address</p>
                          <p className="font-medium text-gray-900">{currentUser.address}</p>
                        </div>
                      </>
                    )}
                    {currentUser.userType === 'Driver' && (
                      <>
                        <div>
                          <p className="text-sm text-gray-500">License Number</p>
                          <p className="font-medium text-gray-900">{currentUser.licenseNo}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Ambulance Number</p>
                          <p className="font-medium text-gray-900">{currentUser.ambulanceNo}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Current Status</p>
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            currentUser.status === 'Available' ? 'bg-green-100 text-green-800' :
                            currentUser.status === 'Busy' ? 'bg-orange-100 text-orange-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {currentUser.status}
                          </span>
                        </div>
                      </>
                    )}
                    {currentUser.userType === 'Admin' && (
                      <>
                        <div>
                          <p className="text-sm text-gray-500">Permissions</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {currentUser.permissions.map((perm, index) => (
                              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                {perm}
                              </span>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Activity size={18} className="text-orange-600" />
                    Quick Actions
                  </h3>
                  <div className="space-y-3">
                    {currentUser.userType === 'Admin' && (
                      <>
                        <button className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors">
                          View Dashboard
                        </button>
                        <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                          Manage Users
                        </button>
                        <button className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors">
                          System Settings
                        </button>
                      </>
                    )}
                    {currentUser.userType === 'Hospital' && (
                      <>
                        <button className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors">
                          Manage Beds
                        </button>
                        <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                          View Bookings
                        </button>
                        <button className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors">
                          Emergency Status
                        </button>
                      </>
                    )}
                    {currentUser.userType === 'Driver' && (
                      <>
                        <button className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors">
                          Update Status
                        </button>
                        <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                          View Assignments
                        </button>
                        <button className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors">
                          Trip History
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Login Form
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Shield size={32} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Excel Authentication</h2>
          <p className="text-gray-600">Access the emergency management system</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="user@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <LogIn size={20} className="mr-2" />
                  Sign In with Excel Data
                </div>
              )}
            </button>
          </form>

          {/* Excel Data Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Excel Authentication</h4>
            <div className="space-y-2 text-sm text-blue-800">
              <p><strong>Admin:</strong> admin@emergency.com / admin123</p>
              <p><strong>Hospital:</strong> kmc@hospital.com / kmc123</p>
              <p><strong>Driver:</strong> raj@driver.com / driver123</p>
              <p className="text-xs text-blue-600 mt-2">
                System authenticates from Excel data with role-based access
              </p>
            </div>
          </div>

          {/* User Types */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">Available User Types</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-gray-700">Admin - Full system access</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">Hospital - Hospital management</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-gray-700">Driver - Ambulance operations</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Emergency Management System v1.0
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Powered by Excel Authentication
          </p>
        </div>
      </div>
    </div>
  );
};

export default ExcelAuth;
