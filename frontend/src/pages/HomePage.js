import { useState, useEffect } from 'react';
import { getEvents } from '../api';
import { useAuth } from '../context/AuthContext';
import EventCard from '../components/EventCard';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const HomePage = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('date');
  const [category, setCategory] = useState('');

  useEffect(() => {
    fetchEvents();
  }, [sortBy, category]);

  const fetchEvents = async () => {
    try {
      const res = await getEvents({ sortBy, category: category || undefined });
      setEvents(res.data.events);
    } catch (err) {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Hero */}
      <div style={styles.hero}>
        <h1 style={styles.heroTitle}>📸 Eventogram</h1>
        <p style={styles.heroSub}>Your club's visual memory — upload, discover & relive every moment</p>
        {(!user || user.role !== 'VIEWER') && (
          <Link to="/create-event" style={styles.heroBtn}>+ Create Event</Link>
        )}
      </div>

      {/* Filters */}
      <div style={styles.filters}>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Sort By</label>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={styles.select}>
            <option value="date">Date</option>
            <option value="name">Name</option>
            <option value="category">Category</option>
          </select>
        </div>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Category</label>
          <select value={category} onChange={e => setCategory(e.target.value)} style={styles.select}>
            <option value="">All Categories</option>
            <option value="Cultural">Cultural</option>
            <option value="Sports">Sports</option>
            <option value="Workshop">Workshop</option>
            <option value="Trip">Trip</option>
            <option value="Competition">Competition</option>
            <option value="Party">Party</option>
          </select>
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div style={styles.center}>Loading events...</div>
      ) : events.length === 0 ? (
        <div style={styles.empty}>
          <p style={styles.emptyText}>No events yet.</p>
          <Link to="/create-event" style={styles.heroBtn}>Create First Event</Link>
        </div>
      ) : (
        <div style={styles.grid}>
          {events.map(event => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { maxWidth: '1200px', margin: '0 auto', padding: '30px 20px' },
  hero: {
    textAlign: 'center', padding: '60px 20px',
    background: 'linear-gradient(135deg, #1e1040, #0f0f0f)',
    borderRadius: '16px', marginBottom: '40px', border: '1px solid #2d2d2d'
  },
  heroTitle: {
    fontSize: '2.8rem', fontWeight: '800', marginBottom: '12px',
    background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
  },
  heroSub: { color: '#aaa', fontSize: '1.1rem', marginBottom: '28px' },
  heroBtn: {
    background: 'linear-gradient(135deg, #7c3aed, #a78bfa)', color: 'white',
    padding: '12px 28px', borderRadius: '10px', textDecoration: 'none',
    fontWeight: '700', fontSize: '15px'
  },
  filters: { display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' },
  filterGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  filterLabel: { fontSize: '12px', color: '#888', fontWeight: '600' },
  select: {
    background: '#1a1a1a', border: '1px solid #3d3d3d', color: 'white',
    padding: '8px 14px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer'
  },
  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px'
  },
  center: { textAlign: 'center', color: '#888', padding: '60px' },
  empty: { textAlign: 'center', padding: '60px' },
  emptyText: { color: '#888', marginBottom: '20px', fontSize: '1.1rem' }
};

export default HomePage;