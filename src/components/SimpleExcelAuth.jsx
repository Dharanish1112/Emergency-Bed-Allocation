import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Phone, MapPin, User, Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import apiService from '../services/api';

const SimpleExcelAuth = ({ onAuthSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Check if already authenticated and load Excel data
  React.useEffect(() => {
    const savedUser = localStorage.getItem('simpleExcelUser');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      setIsAuthenticated(true);
      onAuthSuccess(user);
    }
    
    // Load Excel data
    loadExcelData();
  }, [onAuthSuccess]);

  const loadExcelData = async () => {
    const users = await readExcelFile();
    setExcelUsers(users);
  };

  // Function to read Excel file from project folder
  const readExcelFile = async () => {
    try {
      // Read from your actual Excel file in project folder
      // This will read from the same Excel file you use for UploadData
      const sheetId = "YOUR_ACTUAL_SHEET_ID"; // Replace with your actual Google Sheet ID
      const range = "Sheet1!A:Z"; // Get all columns
      
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&range=${range}`;
      
      const res = await fetch(url);
      const text = await res.text();
      
      // Parse Google Sheets response
      const jsonText = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
      const data = JSON.parse(jsonText);
      
      if (data.table && data.table.rows) {
        const users = [];
        
        // Parse all rows from your Excel file
        for (let i = 1; i < data.table.rows.length; i++) {
          const row = data.table.rows[i].c;
          
          if (row && row[0] && row[1] && row[2]) {
            // Map columns based on your Excel structure
            const user = {
              id: row[0]?.v || '', // Column A: ID
              email: row[1]?.v || '', // Column B: Email
              password: row[2]?.v || '', // Column C: Password
              name: row[3]?.v || '', // Column D: Name
              role: row[4]?.v || 'User', // Column E: Role
              phone: row[5]?.v || '', // Column F: Phone
              department: row[6]?.v || '', // Column G: Department
              location: row[7]?.v || 'Trichy', // Column H: Location
              hospitalId: row[8]?.v || '', // Column I: Hospital ID
              bedsAvailable: parseInt(row[9]?.v) || 0, // Column J: Beds Available
              licenseNo: row[10]?.v || '', // Column K: License No
              ambulanceNo: row[11]?.v || '' // Column L: Ambulance No
            };
            
            // Auto-detect role based on ID pattern
            if (user.id.startsWith('A')) {
              user.role = user.role.includes('Super') ? 'Super Admin' : 'Admin';
            } else if (user.id.startsWith('H')) {
              user.role = 'Hospital Admin';
            } else if (user.id.startsWith('D')) {
              user.role = 'Driver';
            }
            
            users.push(user);
          }
        }
        
        console.log('Loaded users from Excel:', users);
        return users;
      }
      
      return [];
    } catch (error) {
      console.error('Error reading Excel file:', error);
      // Fallback to hardcoded data
      return [
        { id: 'A001', email: 'admin@emergency.com', password: 'admin123', name: 'Super Admin', role: 'Super Admin', phone: '9876543210', department: 'Emergency Management', location: 'Trichy' },
        { id: 'H001', email: 'kmc@hospital.com', password: 'kmc123', name: 'KMC Hospital', role: 'Hospital Admin', phone: '9876543212', department: 'Emergency Ward', location: 'Trichy', hospitalId: 'H001', bedsAvailable: 50 },
        { id: 'D001', email: 'driver1@emergency.com', password: 'driver123', name: 'Raj Kumar', role: 'Driver', phone: '9876543215', department: 'Emergency Services', location: 'Trichy', licenseNo: 'TN-01-2023-0001', ambulanceNo: 'TN-01-AB-1234' }
      ];
    }
  };

  const [excelUsers, setExcelUsers] = useState([]);

  const authenticateWithExcel = async (email, password) => {
    try {
      // Find user by email and password
      const user = excelUsers.find(u => u.email === email && u.password === password);
      
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
      toast.error('Please enter both email and password');
      return;
    }

    setLoading(true);

    try {
      // First try backend authentication
      try {
        const user = await apiService.login(email, password);
        
        if (user) {
          setIsAuthenticated(true);
          setCurrentUser(user);
          
          // Store in localStorage
          localStorage.setItem('simpleExcelUser', JSON.stringify(user));
          localStorage.setItem('auth', 'true');
          
          // Call success callback
          onAuthSuccess(user);
          
          toast.success(`Welcome, ${user.name}!`);
          return;
        }
      } catch (backendError) {
        console.log('Backend auth failed, trying Excel fallback:', backendError.message);
      }
      
      // Fallback to Excel authentication
      const user = await authenticateWithExcel(email, password);
      
      if (user) {
        setIsAuthenticated(true);
        setCurrentUser(user);
        
        // Store in localStorage
        localStorage.setItem('simpleExcelUser', JSON.stringify(user));
        localStorage.setItem('auth', 'true');
        
        // Call success callback
        onAuthSuccess(user);
        
        toast.success(`Welcome, ${user.name}!`);
      } else {
        toast.error('Invalid email or password');
      }
    } catch (error) {
      toast.error('Login failed. Please try again.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('simpleExcelUser');
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
                  {currentUser.role === 'Super Admin' && <Shield size={20} className="text-purple-600" />}
                  {currentUser.role === 'Admin' && <Shield size={20} className="text-blue-600" />}
                  {currentUser.role === 'Hospital Admin' && <Building size={20} className="text-green-600" />}
                  {currentUser.role === 'Driver' && <Users size={20} className="text-orange-600" />}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Emergency Management System</h1>
                  <p className="text-sm text-gray-500">{currentUser.name}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    currentUser.role === 'Super Admin' ? 'bg-purple-100 text-purple-800' :
                    currentUser.role === 'Admin' ? 'bg-blue-100 text-blue-800' :
                    currentUser.role === 'Hospital Admin' ? 'bg-green-100 text-green-800' :
                    'bg-orange-100 text-orange-800'
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
              currentUser.role === 'Super Admin' ? 'from-purple-600 to-purple-700' :
              currentUser.role === 'Admin' ? 'from-blue-600 to-blue-700' :
              currentUser.role === 'Hospital Admin' ? 'from-green-600 to-green-700' :
              'from-orange-600 to-orange-700'
            }`}>
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center">
                  {currentUser.role === 'Super Admin' && <Shield size={40} className="text-white" />}
                  {currentUser.role === 'Admin' && <Shield size={40} className="text-white" />}
                  {currentUser.role === 'Hospital Admin' && <Building size={40} className="text-white" />}
                  {currentUser.role === 'Driver' && <Users size={40} className="text-white" />}
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-1">{currentUser.name}</h2>
                  <p className="text-white/80">Role: {currentUser.role}</p>
                  <p className="text-white/60 text-sm mt-1">User ID: {currentUser.id} | Login: {new Date(currentUser.loginTime).toLocaleString()}</p>
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
                    User Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">User ID</p>
                      <p className="font-medium text-gray-900">{currentUser.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-medium text-gray-900">{currentUser.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Role</p>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        currentUser.role === 'Super Admin' ? 'bg-purple-100 text-purple-800' :
                        currentUser.role === 'Admin' ? 'bg-blue-100 text-blue-800' :
                        currentUser.role === 'Hospital Admin' ? 'bg-green-100 text-green-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {currentUser.role}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium text-gray-900">{currentUser.phone}</p>
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
                    {currentUser.hospitalId && (
                      <>
                        <div>
                          <p className="text-sm text-gray-500">Hospital ID</p>
                          <p className="font-medium text-gray-900">{currentUser.hospitalId}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Available Beds</p>
                          <p className="font-medium text-gray-900">{currentUser.bedsAvailable}</p>
                        </div>
                      </>
                    )}
                    {currentUser.licenseNo && (
                      <>
                        <div>
                          <p className="text-sm text-gray-500">License Number</p>
                          <p className="font-medium text-gray-900">{currentUser.licenseNo}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Ambulance Number</p>
                          <p className="font-medium text-gray-900">{currentUser.ambulanceNo}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Role-based Actions */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Activity size={18} className="text-orange-600" />
                    Quick Actions
                  </h3>
                  <div className="space-y-3">
                    {(currentUser.role === 'Super Admin' || currentUser.role === 'Admin') && (
                      <>
                        <button className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors">
                          Admin Dashboard
                        </button>
                        <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                          Manage Users
                        </button>
                        <button className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors">
                          System Reports
                        </button>
                      </>
                    )}
                    {currentUser.role === 'Hospital Admin' && (
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
                    {currentUser.role === 'Driver' && (
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
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Simple Excel Login</h2>
          <p className="text-gray-600">Enter Email and Password</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Enter ID
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter ID (email address)"
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
                  placeholder="Enter password"
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
                  Authenticating...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <LogIn size={20} className="mr-2" />
                  Login
                </div>
              )}
            </button>
          </form>

          {/* Excel Login Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Excel Authentication</h4>
            <div className="space-y-2 text-sm text-blue-800">
              <p><strong>Admin:</strong> admin@emergency.com / admin123</p>
              <p><strong>Hospital:</strong> kmc@hospital.com / kmc123</p>
              <p><strong>Driver:</strong> driver1@emergency.com / driver123</p>
              <p className="text-xs text-blue-600 mt-2">
                System automatically detects role based on user data
              </p>
            </div>
          </div>

          {/* Available Users */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">Available Users</h4>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-gray-700">Admin: admin@emergency.com, sysadmin@emergency.com</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">Hospital: kmc@hospital.com, apollo@hospital.com, govt@hospital.com</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-gray-700">Driver: driver1@emergency.com, driver2@emergency.com, driver3@emergency.com</span>
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
            Simple Excel Authentication - ID & Password Only
          </p>
        </div>
      </div>
    </div>
  );
};

export default SimpleExcelAuth;
