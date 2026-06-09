import { useState } from 'react';
import { searchMedia } from '../api';
import PhotoCard from '../components/PhotoCard';
import toast from 'react-hot-toast';

const SearchPage = () => {
  const [query, setQuery] = useState('');
  const [tag, setTag] = useState('');
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query && !tag) return toast.error('Enter a search term or tag');
    setLoading(true);
    try {
      const res = await searchMedia({ query: query || undefined, tag: tag || undefined });
      setResults(res.data.media);
      setSearched(true);
    } catch (err) {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🔍 Search Photos</h1>

      <div style={styles.searchBox}>
        <div style={styles.inputs}>
          <input
            placeholder="Search by event name, uploader, title..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSearch()}
          />
          <input
            placeholder="Search by AI tag (e.g. outdoor, sports, crowd)"
            value={tag}
            onChange={e => setTag(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <button onClick={handleSearch} disabled={loading} style={styles.searchBtn}>
          {loading ? 'Searching...' : '🔍 Search'}
        </button>
      </div>

      {searched && (
        <p style={styles.resultCount}>
          {results.length} result(s) found
        </p>
      )}

      {results.length > 0 && (
        <div style={styles.grid}>
          {results.map(item => (
            <PhotoCard key={item.id} media={item} eventId={item.eventId} />
          ))}
        </div>
      )}

      {searched && results.length === 0 && (
        <div style={styles.empty}>
          <p>No photos found. Try a different search term.</p>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { maxWidth: '1200px', margin: '0 auto', padding: '30px 20px' },
  title: {
    fontSize: '2rem', fontWeight: '700', marginBottom: '28px',
    background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
  },
  searchBox: {
    background: '#1a1a1a', borderRadius: '12px', border: '1px solid #2d2d2d',
    padding: '24px', marginBottom: '28px', display: 'flex',
    flexDirection: 'column', gap: '12px'
  },
  inputs: { display: 'flex', flexDirection: 'column', gap: '10px' },
  searchBtn: {
    background: 'linear-gradient(135deg, #7c3aed, #a78bfa)', color: 'white',
    border: 'none', borderRadius: '8px', padding: '12px', fontSize: '15px',
    fontWeight: '700', cursor: 'pointer', alignSelf: 'flex-start', minWidth: '130px'
  },
  resultCount: { color: '#888', marginBottom: '20px', fontSize: '14px' },
  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px'
  },
  empty: { textAlign: 'center', color: '#888', padding: '60px', fontSize: '1rem' }
};

export default SearchPage;