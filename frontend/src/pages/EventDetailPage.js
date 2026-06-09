import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getEventById, getEventMedia } from '../api';
import PhotoCard from '../components/PhotoCard';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const EventDetailPage = () => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [eventRes, mediaRes] = await Promise.all([
        getEventById(id),
        getEventMedia(id, { limit: 100 })
      ]);
      setEvent(eventRes.data);
      setMedia(mediaRes.data.media || []);
    } catch (err) {
      toast.error('Failed to load event');
    } finally {
      setLoading(false);
    }
  };
  const { user } = useAuth();

  if (loading) return <div style={styles.center}>Loading event...</div>;
  if (!event) return <div style={styles.center}>Event not found</div>;

  return (
    <div style={styles.container}>
      {/* Event Header */}
      <div style={styles.header}>
        <div>
          <span style={styles.category}>{event.category}</span>
          <h1 style={styles.title}>{event.title}</h1>
          {event.description && <p style={styles.desc}>{event.description}</p>}
          <div style={styles.meta}>
            <span>📅 {event.date ? new Date(event.date).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'long', year: 'numeric'
            }) : 'Date not set'}</span>
            <span>👤 {event.createdBy?.name}</span>
            <span>📷 {media.length} photos</span>
          </div>
        </div>
        {user && user.role !== 'VIEWER' && (
          <Link to={`/upload/${id}`} style={styles.uploadBtn}>
            📤 Upload Photos
          </Link>
        )}
      </div>

      {/* Media Grid */}
      {media.length === 0 ? (
        <div style={styles.empty}>
          <p style={styles.emptyText}>No photos yet for this event.</p>
          <Link to={`/upload/${id}`} style={styles.uploadBtn}>Upload First Photo</Link>
        </div>
      ) : (
        <div style={styles.grid}>
          {media.map(item => (
            <PhotoCard key={item.id} media={item} eventId={id} />
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { maxWidth: '1200px', margin: '0 auto', padding: '30px 20px' },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    background: '#1a1a1a', borderRadius: '16px', border: '1px solid #2d2d2d',
    padding: '30px', marginBottom: '30px', flexWrap: 'wrap', gap: '20px'
  },
  category: {
    display: 'inline-block', background: '#2d1b69', color: '#a78bfa',
    padding: '3px 12px', borderRadius: '20px', fontSize: '12px', marginBottom: '10px'
  },
  title: { fontSize: '2rem', fontWeight: '800', color: '#fff', marginBottom: '8px' },
  desc: { color: '#aaa', marginBottom: '12px', lineHeight: '1.6' },
  meta: { display: 'flex', gap: '20px', color: '#888', fontSize: '13px', flexWrap: 'wrap' },
  uploadBtn: {
    background: 'linear-gradient(135deg, #7c3aed, #a78bfa)', color: 'white',
    padding: '10px 22px', borderRadius: '10px', textDecoration: 'none',
    fontWeight: '700', fontSize: '14px', whiteSpace: 'nowrap'
  },
  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px'
  },
  center: { textAlign: 'center', color: '#888', padding: '80px', fontSize: '1.1rem' },
  empty: { textAlign: 'center', padding: '60px' },
  emptyText: { color: '#888', marginBottom: '20px', fontSize: '1.1rem' }
};

export default EventDetailPage;