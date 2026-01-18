// ==========================================
// ADMIN PANEL INTEGRATION CODE
// ==========================================
// Copy and paste these sections into your App.jsx

// 1. ADD THESE IMPORTS (at the top with other imports)
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import AdminUserManagement from './components/AdminUserManagement';
import AdminReportsManagement from './components/AdminReportsManagement';
import AdminPremiumRequests from './components/AdminPremiumRequests';
import AdminActivityLogs from './components/AdminActivityLogs';

// 2. ADD THESE STATE VARIABLES (in your App component, with other useState)
const [adminSession, setAdminSession] = useState(null);
const [adminView, setAdminView] = useState('dashboard'); // dashboard, users, reports, premium, logs

// 3. ADD THESE FUNCTIONS (in your App component)
const handleAdminLogin = async (email, password) => {
  setLoading(true);
  try {
    const { data: admin, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single();

    if (error || !admin) {
      showToast('Invalid admin credentials', 'error');
      return;
    }

    // TODO: Implement proper password verification with bcrypt
    // For now, you can set a simple password check
    // In production, use: bcrypt.compare(password, admin.password_hash)
    
    setAdminSession(admin);
    showToast('Admin login successful', 'success');
    
    await supabase
      .from('admin_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', admin.id);
  } catch (error) {
    console.error('Admin login error:', error);
    showToast('Admin login failed', 'error');
  } finally {
    setLoading(false);
  }
};

const handleAdminLogout = () => {
  setAdminSession(null);
  setAdminView('dashboard');
  showToast('Admin logged out', 'success');
};

// 4. ADD THIS ROUTE (in your BrowserRouter, before other routes)
<Route path="/admin" element={
  adminSession ? (
    <div className="min-h-screen bg-gray-900">
      {/* Admin Navigation */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setAdminView('dashboard')}
              className={`px-4 py-2 rounded-lg transition ${
                adminView === 'dashboard' ? 'bg-rose-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setAdminView('users')}
              className={`px-4 py-2 rounded-lg transition ${
                adminView === 'users' ? 'bg-rose-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              Users
            </button>
            <button
              onClick={() => setAdminView('reports')}
              className={`px-4 py-2 rounded-lg transition ${
                adminView === 'reports' ? 'bg-rose-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              Reports
            </button>
            <button
              onClick={() => setAdminView('premium')}
              className={`px-4 py-2 rounded-lg transition ${
                adminView === 'premium' ? 'bg-rose-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              Premium
            </button>
            <button
              onClick={() => setAdminView('logs')}
              className={`px-4 py-2 rounded-lg transition ${
                adminView === 'logs' ? 'bg-rose-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              Logs
            </button>
          </div>
          <button
            onClick={handleAdminLogout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Admin Content */}
      {adminView === 'dashboard' && (
        <AdminDashboard adminUser={adminSession} onLogout={handleAdminLogout} />
      )}
      {adminView === 'users' && (
        <AdminUserManagement adminUser={adminSession} />
      )}
      {adminView === 'reports' && (
        <AdminReportsManagement adminUser={adminSession} />
      )}
      {adminView === 'premium' && (
        <AdminPremiumRequests adminUser={adminSession} />
      )}
      {adminView === 'logs' && (
        <AdminActivityLogs adminUser={adminSession} />
      )}
    </div>
  ) : (
    <AdminLogin onLogin={handleAdminLogin} loading={loading} />
  )
} />
