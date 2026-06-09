import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createEvent } from '../api';
import toast from 'react-hot-toast';

const CreateEventPage = () => {
  const [form, setForm] = useState({
    title: '', description: '', category: 'Cultural', date: '', isPublic: true
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!form.title || !form.date) {
      toast.error('Title and date are required');
      return;
    }
    setLoading(true);
    try {
      const res = await createEvent(form);
      toast.success('Event created!');
      navigate(`/events/${res.data.event.id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.box}>
        <h1 style={styles.title}>🎉 Create New Event</h1>
        <div style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Event Title *</label>
            <input
              placeholder="e.g. Annual Cultural Fest 2025"
              value={form.title}
              onChange={e => setForm({...form, title: e.target.value})}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Description</label>
            <textarea
              rows={3} placeholder="Describe your event..."
              value={form.description}
              onChange={e => setForm({...form, description: e.target.value})}
              style={styles.textarea}
            />
          </div>
          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Category *</label>
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                <option>Cultural</option>
                <option>Sports</option>
                <option>Workshop</option>
                <option>Trip</option>
                <option>Competition</option>
                <option>Party</option>
                <option>Other</option>
              </select>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Event Date *</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm({...form, date: e.target.value})}
              />
            </div>
          </div>
          <div style={styles.field}>
            <label style={styles.checkLabel}>
              <input
                type="checkbox"
                checked={form.isPublic}
                onChange={e => setForm({...form, isPublic: e.target.checked})}
                style={{ width: 'auto', marginRight: '8px' }}
              />
              Make this event public
            </label>
          </div>
          <button onClick={handleSubmit} disabled={loading} style={styles.btn}>
            {loading ? 'Creating...' : '🎉 Create Event'}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh', display: 'flex', alignItems: 'center',
    justifyContent: 'center', padding: '40px 20px'
  },
  box: {
    background: '#1a1a1a', borderRadius: '16px', border: '1px solid #2d2d2d',
    padding: '40px', width: '100%', maxWidth: '560px'
  },
  title: { fontSize: '1.6rem', color: '#a78bfa', marginBottom: '28px', textAlign: 'center' },
  form: { display: 'flex', flexDirection: 'column', gap: '18px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 },
  label: { fontSize: '13px', color: '#aaa', fontWeight: '600' },
  textarea: {
    background: '#1a1a1a', border: '1px solid #3d3d3d', borderRadius: '8px',
    color: 'white', padding: '10px 14px', fontSize: '14px', resize: 'vertical'
  },
  row: { display: 'flex', gap: '16px' },
  checkLabel: { display: 'flex', alignItems: 'center', color: '#aaa', fontSize: '14px', cursor: 'pointer' },
  btn: {
    background: 'linear-gradient(135deg, #7c3aed, #a78bfa)', color: 'white',
    border: 'none', borderRadius: '8px', padding: '13px', fontSize: '15px',
    fontWeight: '700', cursor: 'pointer', marginTop: '8px'
  }
};

export default CreateEventPage;