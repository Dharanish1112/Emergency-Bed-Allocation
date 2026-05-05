import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  MapPin, 
  Phone, 
  Calendar, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Home,
  Activity,
  Shield,
  Upload,
  Database
} from 'lucide-react';

const Navigation = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userRole, setUserRole] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Get user role from localStorage
    const adminUser = localStorage.getItem('adminUser');
    if (adminUser) {
      const user = JSON.parse(adminUser);
      setUserRole(user.role || 'User');
    }
  }, []);

  const menuItems = [
    {
      title: 'Main',
      items: [
        {
          name: 'Dashboard',
          path: '/admin-dashboard',
          icon: LayoutDashboard,
          roles: ['Super Admin', 'Hospital Admin', 'Admin']
        },
        {
          name: 'Data Display',
          path: '/data-display',
          icon: Database,
          roles: ['Super Admin', 'Hospital Admin', 'Admin']
        }
      ]
    },
    {
      title: 'Management',
      items: [
        {
          name: 'Booking System',
          path: '/booking',
          icon: Phone,
          roles: ['Super Admin', 'Hospital Admin', 'Admin', 'User']
        },
        {
          name: 'Driver Status',
          path: '/driver-status',
          icon: Activity,
          roles: ['Super Admin', 'Hospital Admin', 'Admin']
        },
        {
          name: 'Hospitals',
          path: '/hospital',
          icon: MapPin,
          roles: ['Super Admin', 'Hospital Admin', 'Admin', 'User']
        }
      ]
    },
    {
      title: 'System',
      items: [
        {
          name: 'Ambulance Booking',
          path: '/ambulance',
          icon: Home,
          roles: ['Super Admin', 'Hospital Admin', 'Admin', 'User']
        },
        {
          name: 'Upload Data',
          path: '/upload',
          icon: Upload,
          roles: ['Super Admin', 'Hospital Admin', 'Admin']
        }
      ]
    }
  ];

  const handleLogout = () => {
    localStorage.removeItem('auth');
    localStorage.removeItem('adminUser');
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const filteredMenuItems = menuItems.map(section => ({
    ...section,
    items: section.items.filter(item => 
      userRole && item.roles.includes(userRole)
    )
  })).filter(section => section.items.length > 0);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-gray-600 bg-opacity-75"></div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-0
      `}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Emergency System</h2>
              <p className="text-xs text-gray-500">{userRole}</p>
            </div>
          </div>
          
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredMenuItems.map((section, sectionIndex) => (
            <div key={sectionIndex} className="mb-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                {section.title}
              </h3>
              <nav className="space-y-1">
                {section.items.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => {
                      navigate(item.path);
                      setSidebarOpen(false);
                    }}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors
                      ${isActive(item.path)
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }
                    `}
                  >
                    <item.icon size={18} className={isActive(item.path) ? 'text-blue-700' : 'text-gray-400'} />
                    <span>{item.name}</span>
                  </button>
                ))}
              </nav>
            </div>
          ))}
        </div>

        {/* User Actions */}
        <div className="border-t border-gray-200 p-4">
          <div className="space-y-2">
            <button
              onClick={() => navigate('/admin-auth')}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50"
            >
              <Settings size={18} className="text-gray-400" />
              <span>Admin Settings</span>
            </button>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50"
            >
              <LogOut size={18} className="text-red-400" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        {/* Top Bar */}
        <div className="sticky top-0 z-10 bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              <Menu size={20} className="text-gray-500" />
            </button>
            
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500">
                {new Date().toLocaleString()}
              </div>
              
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">System Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content - This will be rendered by React Router */}
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Content is rendered by React Router based on current route */}
        </div>
      </div>
    </div>
  );
};

export default Navigation;
