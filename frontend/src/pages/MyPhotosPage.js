import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { findMyPhotos } from '../api';
import PhotoCard from '../components/PhotoCard';
import toast from 'react-hot-toast';

const MyPhotosPage = () => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleFindPhotos = async () => {
    setLoading(true);
    try {
      const res = await findMyPhotos();
      setPhotos(res.data.photos);
      setSearched(true);
      toast.success(`Found ${res.data.count} photo(s) with your face!`);
    } catch (err) {
      if (err.response?.status === 404) {
        toast.error('Please save your face descriptor first');
      } else {
        toast.error('Failed to find photos');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🤳 My Photos</h1>
      <p style={styles.sub}>Find all photos where you appear using face recognition</p>

      <div style={styles.infoBox}>
        <h3 style={styles.infoTitle}>🧠 How it works</h3>
        <ol style={styles.steps}>
          <li>Our AI analyzes your face from your profile</li>
          <li>It searches through all event photos</li>
          <li>Photos containing your face are shown below</li>
        </ol>
        <button
          onClick={handleFindPhotos}
          disabled={loading}
          style={styles.findBtn}
        >
          {loading ? '🔍 Searching...' : '🔍 Find My Photos'}
        </button>
      </div>

      {searched && (
        <p style={styles.resultCount}>{photos.length} photo(s) found</p>
      )}

      {photos.length > 0 && (
        <div style={styles.grid}>
          {photos.map(photo => (
            <PhotoCard key={photo.id} media={photo} eventId={photo.eventId} />
          ))}
        </div>
      )}

      {searched && photos.length === 0 && (
        <div style={styles.empty}>
          <p>No photos found with your face yet.</p>
          <p style={styles.emptyHint}>
            Make sure photos have been uploaded to events you attended.
          </p>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { maxWidth: '1200px', margin: '0 auto', padding: '30px 20px' },
  title: {
    fontSize: '2rem', fontWeight: '700', marginBottom: '8px',
    background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
  },
  sub: { color: '#888', marginBottom: '28px', fontSize: '14px' },
  infoBox: {
    background: '#1a1a1a', borderRadius: '12px', border: '1px solid #2d2d2d',
    padding: '28px', marginBottom: '30px'
  },
  infoTitle: { color: '#a78bfa', fontSize: '1.1rem', marginBottom: '12px' },
  steps: { color: '#aaa', fontSize: '14px', paddingLeft: '20px',
    lineHeight: '2', marginBottom: '20px' },
  findBtn: {
    background: 'linear-gradient(135deg, #7c3aed, #a78bfa)', color: 'white',
    border: 'none', borderRadius: '10px', padding: '12px 28px',
    fontSize: '15px', fontWeight: '700', cursor: 'pointer'
  },
  resultCount: { color: '#888', marginBottom: '20px', fontSize: '14px' },
  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px'
  },
  empty: { textAlign: 'center', color: '#888', padding: '40px' },
  emptyHint: { fontSize: '13px', marginTop: '8px', color: '#555' }
};

export default MyPhotosPage;