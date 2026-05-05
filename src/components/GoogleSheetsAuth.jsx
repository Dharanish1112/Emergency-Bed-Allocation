import React, { useState } from 'react';
import { Shield, LogIn, Eye, EyeOff, Users, MapPin, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

const GoogleSheetsAuth = ({ onAuthSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Check if already authenticated
  React.useEffect(() => {
    const savedUser = localStorage.getItem('googleSheetsUser');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      setIsAuthenticated(true);
      onAuthSuccess(user);
    }
  }, [onAuthSuccess]);

  const authenticateWithGoogleSheets = async (email, password) => {
    try {
      // Replace with your Google Sheet ID
      const sheetId = "YOUR_GOOGLE_SHEET_ID";
      const range = "Sheet1!A:Z"; // Adjust range as needed
      
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&range=${range}`;
      
      const res = await fetch(url);
      const text = await res.text();
      
      // Parse Google Sheets response
      const jsonText = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
      const data = JSON.parse(jsonText);
      
      if (data.table && data.table.rows) {
        // Find user in the sheet
        for (let i = 1; i < data.table.rows.length; i++) {
          const row = data.table.rows[i].c;
          
          if (row && row[1] && row[2]) {
            const sheetEmail = row[1].v;
            const sheetPassword = row[2].v;
            
            // Check if email and password match
            if (sheetEmail === email && sheetPassword === password) {
              // Get user details
              const userData = {
                email: sheetEmail,
                name: row[0]?.v || 'Unknown',
                role: row[3]?.v || 'User', // Column D for role
                userId: row[4]?.v || `U${i}`, // Column E for user ID
                phone: row[5]?.v || '', // Column F for phone
                location: row[6]?.v || '', // Column G for location
                department: row[7]?.v || '', // Column H for department
                status: 'active',
                loginTime: new Date().toISOString()
              };
              
              return userData;
            }
          }
        }
      }
      
      return null; // User not found or credentials don't match
    } catch (error) {
      console.error('Google Sheets auth error:', error);
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
      // Authenticate with Google Sheets
      const userData = await authenticateWithGoogleSheets(email, password);
      
      if (userData) {
        // Save user data to localStorage
        localStorage.setItem('googleSheetsUser', JSON.stringify(userData));
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
      toast.error('Failed to connect to Google Sheets. Please check your network.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('googleSheetsUser');
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
                  <Shield size={20} className="text-blue-600" />
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
                      : currentUser.role === 'Driver'
                      ? 'bg-orange-100 text-orange-800'
                      : currentUser.role === 'Hospital'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {currentUser.role}
                  </span>
                  <span className="text-sm text-gray-500">ID: {currentUser.userId}</span>
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

        {/* User Information */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield size={32} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-green-900 mb-2">
              Welcome, {currentUser.name}!
            </h2>
            <p className="text-green-700 mb-6">
              You have {currentUser.role} privileges and access to the emergency management system.
            </p>
            
            {/* User Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl mx-auto mb-6">
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <h3 className="font-semibold text-green-900 mb-2">Contact Info</h3>
                <p className="text-sm text-gray-600">Email: {currentUser.email}</p>
                <p className="text-sm text-gray-600">Phone: {currentUser.phone}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <h3 className="font-semibold text-green-900 mb-2">Location</h3>
                <p className="text-sm text-gray-600">{currentUser.location}</p>
                <p className="text-sm text-gray-600">Department: {currentUser.department}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <h3 className="font-semibold text-green-900 mb-2">Access Level</h3>
                <p className="text-sm text-gray-600">Role: {currentUser.role}</p>
                <p className="text-sm text-gray-600">User ID: {currentUser.userId}</p>
              </div>
            </div>

            {/* Role-based Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
              {currentUser.role === 'Driver' && (
                <>
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <Activity size={16} className="text-orange-600" />
                    </div>
                    <h3 className="font-semibold text-green-900 mb-2">My Status</h3>
                    <p className="text-sm text-gray-600">View and update your driver status</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <MapPin size={16} className="text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-green-900 mb-2">Active Trips</h3>
                    <p className="text-sm text-gray-600">View current and completed trips</p>
                  </div>
                </>
              )}
              
              {currentUser.role === 'Hospital' && (
                <>
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <MapPin size={16} className="text-green-600" />
                    </div>
                    <h3 className="font-semibold text-green-900 mb-2">Hospital Info</h3>
                    <p className="text-sm text-gray-600">Manage hospital details and beds</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <Users size={16} className="text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-green-900 mb-2">Bookings</h3>
                    <p className="text-sm text-gray-600">View ambulance bookings</p>
                  </div>
                </>
              )}
              
              {(currentUser.role === 'Super Admin' || currentUser.role === 'Admin') && (
                <>
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <Shield size={16} className="text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-green-900 mb-2">Dashboard</h3>
                    <p className="text-sm text-gray-600">View system statistics</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <Users size={16} className="text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-green-900 mb-2">User Management</h3>
                    <p className="text-sm text-gray-600">Manage drivers and hospitals</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <Activity size={16} className="text-orange-600" />
                    </div>
                    <h3 className="font-semibold text-green-900 mb-2">Booking System</h3>
                    <p className="text-sm text-gray-600">Manage emergency bookings</p>
                  </div>
                </>
              )}
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
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Google Sheets Login</h2>
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
                  Sign In with Google Sheets
                </div>
              )}
            </button>
          </form>

          {/* Google Sheets Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Google Sheets Authentication</h4>
            <div className="space-y-1 text-sm text-blue-800">
              <p><strong>Column A:</strong> Name</p>
              <p><strong>Column B:</strong> Email</p>
              <p><strong>Column C:</strong> Password</p>
              <p><strong>Column D:</strong> Role (Driver/Hospital/Admin/Super Admin)</p>
              <p><strong>Column E:</strong> User ID</p>
              <p className="text-xs text-blue-600 mt-2">
                Make sure your Google Sheet is publicly accessible.
              </p>
            </div>
          </div>

          {/* Test Credentials */}
          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <h4 className="font-semibold text-green-900 mb-2">Test Credentials</h4>
            <div className="space-y-1 text-sm text-green-800">
              <p><strong>Driver:</strong> driver@test.com / driver123</p>
              <p><strong>Hospital:</strong> hospital@test.com / hospital123</p>
              <p><strong>Admin:</strong> admin@test.com / admin123</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Emergency Management System v1.0
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Powered by Google Sheets Authentication
          </p>
        </div>
      </div>
    </div>
  );
};

export default GoogleSheetsAuth;
