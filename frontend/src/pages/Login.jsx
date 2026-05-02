import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api from '../utils/api';
import { LogIn, KeyRound } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [role, setRole] = useState('Student');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginMode, setLoginMode] = useState('password'); // 'password', 'otp-request', 'otp-verify'
  
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleLoginSuccess = (userData, token) => {
    login(userData, token);
    switch (userData.role) {
      case 'Admin': navigate('/admin'); break;
      case 'HOD': navigate('/hod'); break;
      case 'Faculty': navigate('/faculty'); break;
      case 'Student': navigate('/student'); break;
      default: navigate('/');
    }
  };

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setError(''); setMsg(''); setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password, role });
      const { token, ...userData } = response.data;
      handleLoginSuccess(userData, token);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setError(''); setMsg(''); setLoading(true);
    try {
      const response = await api.post('/auth/send-otp', { email, role });
      setMsg(response.data.message);
      setLoginMode('otp-verify');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError(''); setMsg(''); setLoading(true);
    try {
      const response = await api.post('/auth/verify-otp', { email, otp, role });
      const { token, ...userData } = response.data;
      handleLoginSuccess(userData, token);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-slate-100">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
            {loginMode === 'password' ? <LogIn className="h-6 w-6" /> : <KeyRound className="h-6 w-6" />}
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900">
            {loginMode === 'password' ? 'Sign in' : 'OTP Login'}
          </h2>
          <p className="mt-2 text-sm text-slate-500">Student Mid Marks Management System</p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={
          loginMode === 'password' ? handlePasswordLogin : 
          loginMode === 'otp-request' ? handleRequestOTP : handleVerifyOTP
        }>
          {error && <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm text-center">{error}</div>}
          {msg && <div className="bg-green-50 text-green-600 p-3 rounded-md text-sm text-center">{msg}</div>}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-slate-700 mb-1">User Type</label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={loginMode === 'otp-verify'}
                className="block w-full px-3 py-3 border border-slate-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm disabled:bg-slate-100"
              >
                <option value="Admin">Admin</option>
                <option value="HOD">Head of Department (HOD)</option>
                <option value="Faculty">Faculty</option>
                <option value="Student">Student</option>
              </select>
            </div>

            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-slate-700 mb-1">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                required
                disabled={loginMode === 'otp-verify'}
                className="block w-full px-3 py-3 border border-slate-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm disabled:bg-slate-100"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {loginMode === 'password' && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="block w-full px-3 py-3 border border-slate-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            )}

            {loginMode === 'otp-verify' && (
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-slate-700 mb-1">Enter 6-digit OTP</label>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  required
                  className="block w-full px-3 py-3 border border-slate-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm tracking-widest text-center text-lg"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:opacity-70"
            >
              {loading ? 'Processing...' : 
               loginMode === 'password' ? 'Sign in with Password' : 
               loginMode === 'otp-request' ? 'Send OTP' : 'Verify & Login'}
            </button>
            
            <button
              type="button"
              onClick={() => {
                setLoginMode(loginMode === 'password' ? 'otp-request' : 'password');
                setError(''); setMsg('');
              }}
              className="w-full text-sm text-primary font-medium hover:underline"
            >
              {loginMode === 'password' ? 'Login with OTP instead' : 'Login with Password instead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
