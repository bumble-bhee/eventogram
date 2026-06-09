import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { loginUser } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await loginUser(form);
      login(res.data.token, res.data.user);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.box}>
        <h1 style={styles.title}>📸 Eventogram</h1>
        <h2 style={styles.subtitle}>Welcome Back</h2>
        <p style={styles.hint}>Login to your account</p>
        <div style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              placeholder="Your password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={styles.btn}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </div>
        <p style={styles.switchText}>
          Don't have an account?{' '}
          <Link to="/register" style={styles.switchLink}>Register here</Link>
        </p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh', display: 'flex', alignItems: 'center',
    justifyContent: 'center', background: '#0f0f0f', padding: '20px'
  },
  box: {
    background: '#1a1a1a', borderRadius: '16px', border: '1px solid #2d2d2d',
    padding: '40px', width: '100%', maxWidth: '420px', textAlign: 'center'
  },
  title: { fontSize: '1.8rem', color: '#a78bfa', marginBottom: '8px' },
  subtitle: { fontSize: '1.4rem', color: '#fff', marginBottom: '4px' },
  hint: { color: '#888', fontSize: '14px', marginBottom: '28px' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', color: '#aaa', fontWeight: '600' },
  btn: {
    background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
    color: 'white', border: 'none', borderRadius: '8px',
    padding: '12px', fontSize: '15px', fontWeight: '700',
    cursor: 'pointer', marginTop: '8px'
  },
  switchText: { marginTop: '20px', color: '#888', fontSize: '13px' },
  switchLink: { color: '#a78bfa', textDecoration: 'none', fontWeight: '600' }
};

export default LoginPage;