import { Link } from 'react-router-dom';

const PhotoCard = ({ media, eventId }) => {
  return (
    <Link to={`/events/${eventId}/media/${media.id}`} style={{ textDecoration: 'none' }}>
      <div style={styles.card}>
        <div style={styles.imgWrapper}>
          <img src={media.url} alt={media.title} style={styles.img} />
          {media.type === 'VIDEO' && <div style={styles.videoIcon}>▶</div>}
        </div>
        <div style={styles.body}>
          <p style={styles.title}>{media.title || 'Untitled'}</p>
          <div style={styles.tags}>
            {(media.tags || []).slice(0, 3).map(tag => (
              <span key={tag} style={styles.tag}>{tag}</span>
            ))}
          </div>
          <div style={styles.footer}>
            <span style={styles.stat}>❤️ {media._count?.likes || 0}</span>
            <span style={styles.stat}>💬 {media._count?.comments || 0}</span>
            <span style={styles.uploader}>📷 {media.uploadedBy?.name}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

const styles = {
  card: {
    background: '#1a1a1a', borderRadius: '10px', border: '1px solid #2d2d2d',
    overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s'
  },
  imgWrapper: { position: 'relative', paddingTop: '70%', overflow: 'hidden', background: '#111' },
  img: {
    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
    objectFit: 'cover', transition: 'transform 0.3s'
  },
  videoIcon: {
    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
    background: 'rgba(0,0,0,0.6)', color: 'white', borderRadius: '50%',
    width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '16px'
  },
  body: { padding: '10px 12px' },
  title: { fontSize: '13px', fontWeight: '600', color: '#ddd', marginBottom: '6px',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  tags: { display: 'flex', flexWrap: 'wrap', gap: '3px', marginBottom: '8px' },
  tag: {
    background: '#2d1b69', color: '#a78bfa', padding: '2px 7px',
    borderRadius: '10px', fontSize: '10px'
  },
  footer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  stat: { fontSize: '12px', color: '#aaa' },
  uploader: { fontSize: '11px', color: '#666' }
};

export default PhotoCard;