import React, { useState } from 'react';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import { Shield, LogIn, LogOut, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminAuth = ({ onAuthSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const auth = getAuth();
  const db = getFirestore();

  // Check if already authenticated
  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        // Verify admin status in Firestore
        try {
          const adminsQuery = query(collection(db, 'admins'), where('email', '==', user.email));
          const adminSnapshot = await getDocs(adminsQuery);
          
          if (!adminSnapshot.empty) {
            const adminData = adminSnapshot.docs[0].data();
            setCurrentUser({
              email: user.email,
              name: adminData.name,
              role: adminData.role,
              adminId: adminData.adminId
            });
            setIsAuthenticated(true);
            onAuthSuccess({
              email: user.email,
              name: adminData.name,
              role: adminData.role,
              adminId: adminData.adminId
            });
          } else {
            // User exists but not admin
            await signOut(auth);
            toast.error('Access denied. Admin privileges required.');
          }
        } catch (error) {
          console.error('Admin verification error:', error);
          toast.error('Failed to verify admin access');
        }
      }
    });

    return () => unsubscribe();
  }, [auth, db, onAuthSuccess]);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }

    setLoading(true);
    
    try {
      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Verify admin status in Firestore
      const adminsQuery = query(collection(db, 'admins'), where('email', '==', user.email));
      const adminSnapshot = await getDocs(adminsQuery);
      
      if (!adminSnapshot.empty) {
        const adminData = adminSnapshot.docs[0].data();
        setCurrentUser({
          email: user.email,
          name: adminData.name,
          role: adminData.role,
          adminId: adminData.adminId
        });
        setIsAuthenticated(true);
        onAuthSuccess({
          email: user.email,
          name: adminData.name,
          role: adminData.role,
          adminId: adminData.adminId
        });
        toast.success(`Welcome back, ${adminData.name}!`);
      } else {
        // Sign out if not admin
        await signOut(auth);
        toast.error('Access denied. Admin privileges required.');
      }
      
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = 'Login failed';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'Admin not found';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many attempts. Try again later';
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsAuthenticated(false);
      setCurrentUser(null);
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  if (isAuthenticated && currentUser) {
    // Admin Dashboard View
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
                  <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
                  <p className="text-sm text-gray-500">{currentUser.name}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    currentUser.role === 'Super Admin' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {currentUser.role}
                  </span>
                  <span className="text-sm text-gray-500">ID: {currentUser.adminId}</span>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Success Message */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield size={32} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-green-900 mb-2">
              Welcome, {currentUser.name}!
            </h2>
            <p className="text-green-700 mb-6">
              You have {currentUser.role} privileges and full access to the emergency management system.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <h3 className="font-semibold text-green-900 mb-2">Dashboard</h3>
                <p className="text-sm text-gray-600">View real-time statistics and system overview</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <h3 className="font-semibold text-green-900 mb-2">Data Management</h3>
                <p className="text-sm text-gray-600">Manage drivers, hospitals, and bookings</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <h3 className="font-semibold text-green-900 mb-2">Monitoring</h3>
                <p className="text-sm text-gray-600">Track driver status and emergency requests</p>
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
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Admin Login</h2>
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
                placeholder="admin@example.com"
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
                  Sign In
                </div>
              )}
            </button>
          </form>

          {/* Admin Credentials Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Test Credentials</h4>
            <div className="space-y-1 text-sm text-blue-800">
              <p><strong>Email:</strong> admin@emergency.com</p>
              <p><strong>Password:</strong> admin123</p>
              <p className="text-xs text-blue-600 mt-2">
                Note: These are test credentials. In production, use your actual admin credentials.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Emergency Management System v1.0
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Secure admin access with Firebase Authentication
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminAuth;
