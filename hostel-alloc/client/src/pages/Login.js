import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { LogIn, UserPlus, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'admin' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegister) {
        await register(form.name, form.email, form.password, form.role);
        toast.success('Account created!');
      } else {
        await login(form.email, form.password);
        toast.success('Welcome back!');
      }
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg" />
      <div className="login-left">
        <div className="login-brand">
          <h1>Hostel<span>OS</span></h1>
          <p>Automated Hostel Allocation Management</p>
        </div>
        <div className="login-card">
          <h2>{isRegister ? 'Create Account' : 'Welcome Back'}</h2>
          <p>{isRegister ? 'Set up your admin account' : 'Sign in to manage allocations'}</p>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {isRegister && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" name="name" value={form.name} onChange={handleChange} placeholder="Admin Name" required />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" name="email" type="email" value={form.email} onChange={handleChange} placeholder="admin@hostel.edu" required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input className="form-input" name="password" type={showPass ? 'text' : 'password'} value={form.password} onChange={handleChange} placeholder="••••••••" required style={{ paddingRight: 36 }} />
                <button type="button" onClick={() => setShowPass(p => !p)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            {isRegister && (
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-select" name="role" value={form.role} onChange={handleChange}>
                  <option value="admin">Admin</option>
                  <option value="warden">Warden</option>
                </select>
              </div>
            )}
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '11px', marginTop: 6 }}>
              {loading ? 'Please wait...' : isRegister ? <><UserPlus size={15} /> Create Account</> : <><LogIn size={15} /> Sign In</>}
            </button>
          </form>
          <div className="login-divider">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}
            {' '}
            <button onClick={() => setIsRegister(p => !p)} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              {isRegister ? 'Sign In' : 'Register'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
