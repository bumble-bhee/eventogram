import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const ROLE_PASSWORDS = {
  ADMIN: 'admin1289',
  PHOTOGRAPHER: 'photographer1289',
  CLUB_MEMBER: 'clubmember1289',
  VIEWER: null // no password required
};

const RegisterPage = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'VIEWER' });
  const [rolePassword, setRolePassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.password) {
      return toast.error('Please fill all fields');
    }

    // Validate role password
    const requiredRolePassword = ROLE_PASSWORDS[form.role];
    if (requiredRolePassword && rolePassword !== requiredRolePassword) {
      return toast.error(`Incorrect authorization password for ${form.role} role`);
    }

    setLoading(true);
    try {
      const res = await registerUser(form);
      login(res.data.token, res.data.user);
      toast.success('Account created successfully!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.box}>
        <h1 style={styles.title}>📸 Eventogram</h1>
        <h2 style={styles.subtitle}>Create Account</h2>

        <div style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Full Name</label>
            <input
              placeholder="Your full name"
              value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              placeholder="Create a password"
              value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Role</label>
            <select
              value={form.role}
              onChange={e => { setForm({...form, role: e.target.value}); setRolePassword(''); }}
            >
              <option value="VIEWER">Viewer (No authorization needed)</option>
              <option value="CLUB_MEMBER">Club Member</option>
              <option value="PHOTOGRAPHER">Photographer</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          {/* Role authorization password — only shown for non-viewer roles */}
          {form.role !== 'VIEWER' && (
            <div style={styles.field}>
              <label style={styles.label}>
                🔐 Authorization Password for {form.role.replace('_', ' ')}
              </label>
              <input
                type="password"
                placeholder={`Enter ${form.role.replace('_', ' ')} authorization password`}
                value={rolePassword}
                onChange={e => setRolePassword(e.target.value)}
              />
              <p style={styles.hint}>
                This password is provided by your club administrator.
              </p>
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading} style={styles.btn}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </div>

        <p style={styles.switchText}>
          Already have an account?{' '}
          <Link to="/login" style={styles.switchLink}>Login here</Link>
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
    padding: '40px', width: '100%', maxWidth: '420px'
  },
  title: { fontSize: '1.8rem', color: '#a78bfa', marginBottom: '8px', textAlign: 'center' },
  subtitle: { fontSize: '1.4rem', color: '#fff', marginBottom: '20px', textAlign: 'center' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', color: '#aaa', fontWeight: '600' },
  hint: { fontSize: '11px', color: '#666', marginTop: '4px' },
  btn: {
    background: 'linear-gradient(135deg, #7c3aed, #a78bfa)', color: 'white',
    border: 'none', borderRadius: '8px', padding: '12px', fontSize: '15px',
    fontWeight: '700', cursor: 'pointer', marginTop: '8px'
  },
  switchText: { marginTop: '20px', color: '#888', fontSize: '13px', textAlign: 'center' },
  switchLink: { color: '#a78bfa', textDecoration: 'none', fontWeight: '600' }
};

export default RegisterPage;