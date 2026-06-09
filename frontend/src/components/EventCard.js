import { Link } from 'react-router-dom';

const EventCard = ({ event }) => {
  return (
    <Link to={`/events/${event.id}`} style={{ textDecoration: 'none' }}>
      <div style={styles.card}>
        <div style={styles.iconBox}>🎉</div>
        <div style={styles.body}>
          <h3 style={styles.title}>{event.title}</h3>
          <p style={styles.category}>{event.category}</p>
          <p style={styles.date}>{new Date(event.date).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric'
          })}</p>
          {event.description && (
            <p style={styles.desc}>{event.description.slice(0, 80)}...</p>
          )}
          <div style={styles.footer}>
            <span style={styles.count}>📷 {event._count?.media || 0} photos</span>
            <span style={styles.creator}>by {event.createdBy?.name}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

const styles = {
  card: {
    background: '#1a1a1a', borderRadius: '12px', border: '1px solid #2d2d2d',
    overflow: 'hidden', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer'
  },
  iconBox: {
    background: 'linear-gradient(135deg, #1e1040, #2d1b69)',
    padding: '30px', fontSize: '2.5rem', textAlign: 'center'
  },
  body: { padding: '16px' },
  title: { fontSize: '1.1rem', fontWeight: '700', color: '#fff', marginBottom: '6px' },
  category: {
    display: 'inline-block', background: '#2d1b69', color: '#a78bfa',
    padding: '2px 10px', borderRadius: '20px', fontSize: '11px', marginBottom: '8px'
  },
  date: { fontSize: '12px', color: '#888', marginBottom: '8px' },
  desc: { fontSize: '13px', color: '#aaa', marginBottom: '12px', lineHeight: '1.5' },
  footer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  count: { fontSize: '12px', color: '#a78bfa' },
  creator: { fontSize: '11px', color: '#666' }
};

export default EventCard;