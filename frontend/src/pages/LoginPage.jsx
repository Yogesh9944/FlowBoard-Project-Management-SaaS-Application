import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form);
      toast.success('Welcome back!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: 20,
      backgroundImage: 'radial-gradient(ellipse at 20% 50%, rgba(124,106,247,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(34,211,160,0.05) 0%, transparent 50%)',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }} className="fade-in">
        {/* Logo */}
        <div className="flex flex-col items-center" style={{ marginBottom: 36 }}>
          <div style={{
            width: 52, height: 52, background: 'var(--accent)', borderRadius: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.6rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: '#fff',
            boxShadow: '0 0 32px var(--accent-glow)', marginBottom: 14,
          }}>F</div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em' }}>FlowBoard</h1>
          <p style={{ color: 'var(--text-3)', marginTop: 4, fontSize: '0.9rem' }}>Sign in to your workspace</p>
        </div>

        <div className="card" style={{ padding: 32 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                placeholder="you@company.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <button className="btn btn-primary btn-lg w-full" type="submit" disabled={loading} style={{ marginTop: 4 }}>
              {loading ? <span className="spinner" /> : 'Sign In'}
            </button>
          </form>

          <div className="divider" />

          {/* Demo credentials */}
          <div style={{ background: 'var(--bg-4)', borderRadius: 8, padding: '12px 14px', marginBottom: 16 }}>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginBottom: 6, fontWeight: 600 }}>DEMO CREDENTIALS</p>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-2)' }}>Email: <span style={{ color: 'var(--accent-2)' }}>demo@flowboard.com</span></p>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-2)' }}>Password: <span style={{ color: 'var(--accent-2)' }}>demo123</span></p>
          </div>

          <p style={{ textAlign: 'center', color: 'var(--text-3)', fontSize: '0.875rem' }}>
            No account?{' '}
            <Link to="/register" style={{ color: 'var(--accent-2)', fontWeight: 600 }}>Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
