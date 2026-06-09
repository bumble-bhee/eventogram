import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getMediaById, toggleLike, addComment, getComments, toggleFavourite, downloadMedia, getEventMedia } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import API from '../api';
import MentionInput from '../components/MentionInput';

const PhotoDetailPage = () => {
  const { eventId, mediaId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [media, setMedia] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [liked, setLiked] = useState(false);
  const [favourited, setFavourited] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allMediaIds, setAllMediaIds] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchAllMedia();
  }, [eventId]);

  useEffect(() => {
    fetchData();
  }, [mediaId]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, allMediaIds]);

  const fetchAllMedia = async () => {
    try {
      const res = await getEventMedia(eventId, { limit: 100 });
      const ids = res.data.media.map(m => m.id);
      setAllMediaIds(ids);
      const idx = ids.indexOf(parseInt(mediaId));
      setCurrentIndex(idx >= 0 ? idx : 0);
    } catch (err) { }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [mediaRes, commentsRes] = await Promise.all([
        getMediaById(eventId, mediaId),
        getComments(mediaId)
      ]);
      setMedia(mediaRes.data);
      setComments(commentsRes.data.comments);
    } catch (err) {
      toast.error('Failed to load photo');
    } finally {
      setLoading(false);
    }
  };

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      const prevId = allMediaIds[currentIndex - 1];
      navigate(`/events/${eventId}/media/${prevId}`);
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex, allMediaIds, eventId, navigate]);

  const goToNext = useCallback(() => {
    if (currentIndex < allMediaIds.length - 1) {
      const nextId = allMediaIds[currentIndex + 1];
      navigate(`/events/${eventId}/media/${nextId}`);
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, allMediaIds, eventId, navigate]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowLeft') goToPrev();
    if (e.key === 'ArrowRight') goToNext();
  }, [goToPrev, goToNext]);

  const handleLike = async () => {
    if (!user) return toast.error('Please login to like');
    try {
      const res = await toggleLike(mediaId);
      setLiked(res.data.liked);
      setMedia(prev => ({
        ...prev,
        _count: {
          ...prev._count,
          likes: res.data.liked ? prev._count.likes + 1 : prev._count.likes - 1
        }
      }));
      toast.success(res.data.liked ? '❤️ Liked!' : 'Unliked');
    } catch (err) { toast.error('Failed'); }
  };

  const handleFavourite = async () => {
    if (!user) return toast.error('Please login');
    try {
      const res = await toggleFavourite(mediaId);
      setFavourited(res.data.favourited);
      toast.success(res.data.favourited ? '⭐ Saved!' : 'Removed from favourites');
    } catch (err) { toast.error('Failed'); }
  };

  const handleComment = async () => {
    if (!user) return toast.error('Please login to comment');
    if (!commentText.trim()) return toast.error('Comment cannot be empty');
    try {
      const res = await addComment(mediaId, { text: commentText });
      setComments(prev => [res.data.comment, ...prev]);
      setCommentText('');
      toast.success('Comment added!');
    } catch (err) { toast.error('Failed'); }
  };

  const handleDownload = async () => {
    if (!user) return toast.error('Please login to download');
    try {
      toast.loading('Preparing download with watermark...');
      const res = await downloadMedia(mediaId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${media.event?.title || 'photo'}.jpg`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.dismiss();
      toast.success('Downloaded!');
    } catch (err) {
      toast.dismiss();
      toast.error('Download failed');
    }
  };

  const handleShare = () => {
    if (!media.isPublic) {
      toast.error('This photo is private and cannot be shared publicly');
      return;
    }
    const shareUrl = `${window.location.origin}/events/${eventId}/media/${mediaId}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success('🔗 Link copied to clipboard!');
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to permanently delete this photo?')) return;
    try {
      await API.delete(`/events/${eventId}/media/${mediaId}`);
      toast.success('Photo deleted');
      navigate(`/events/${eventId}`);
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  if (loading) return <div style={styles.center}>Loading...</div>;
  if (!media) return <div style={styles.center}>Photo not found</div>;

  return (
    <div style={styles.container}>
      <div style={styles.layout}>
        {/* Left - Photo */}
        <div style={styles.photoSection}>
          <div style={styles.topBar}>
            <Link to={`/events/${eventId}`} style={styles.back}>← Back to Event</Link>
            <span style={styles.counter}>
              {currentIndex + 1} / {allMediaIds.length}
            </span>
          </div>

          {/* Photo with Navigation Arrows */}
          <div style={styles.photoWrapper}>
            {/* Left Arrow */}
            <button
              onClick={goToPrev}
              disabled={currentIndex === 0}
              style={{
                ...styles.navArrow,
                ...styles.navArrowLeft,
                opacity: currentIndex === 0 ? 0.2 : 1
              }}
            >
              ‹
            </button>

            {media.type === 'VIDEO' ? (
              <video src={media.url} controls style={styles.photo} />
            ) : (
              <img src={media.url} alt={media.title} style={styles.photo} />
            )}

            {/* Right Arrow */}
            <button
              onClick={goToNext}
              disabled={currentIndex === allMediaIds.length - 1}
              style={{
                ...styles.navArrow,
                ...styles.navArrowRight,
                opacity: currentIndex === allMediaIds.length - 1 ? 0.2 : 1
              }}
            >
              ›
            </button>
          </div>

          <p style={styles.keyboardHint}>
            💡 Use ← → keyboard arrows to navigate
          </p>

          <div style={styles.tags}>
            {(media.tags || []).map(tag => (
              <span key={tag} style={styles.tag}>{tag}</span>
            ))}
          </div>
        </div>

        {/* Right - Info */}
        <div style={styles.infoSection}>
          <h2 style={styles.photoTitle}>{media.title || 'Untitled Photo'}</h2>
          <p style={styles.uploader}>📷 {media.uploadedBy?.name}</p>
          <p style={styles.eventLink}>
            🎉 <Link to={`/events/${eventId}`} style={styles.link}>
              {media.event?.title}
            </Link>
          </p>
          <p style={styles.date}>
            {new Date(media.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'long', year: 'numeric'
            })}
          </p>

          <div style={styles.actions}>
            <button onClick={handleLike} style={{
              ...styles.actionBtn,
              background: liked ? '#7c3aed' : '#2d2d2d'
            }}>
              ❤️ {media._count?.likes || 0}
            </button>
            <button onClick={handleFavourite} style={{
              ...styles.actionBtn,
              background: favourited ? '#854d0e' : '#2d2d2d'
            }}>
              ⭐ Save
            </button>
            <button onClick={handleDownload} style={styles.actionBtn}>
              ⬇️ Download {media.downloadCount > 0 ? `(${media.downloadCount})` : ''}
            </button>
            <button onClick={handleShare} style={styles.actionBtn}>
              🔗 Share
            </button>
            {user && media.uploadedBy?.id === user.id && (
              <button onClick={handleDelete} style={{ ...styles.actionBtn, background: '#7f1d1d' }}>
                🗑️ Delete
              </button>
            )}
          </div>

          {user && (
            <MentionInput
              value={commentText}
              onChange={setCommentText}
              onSubmit={handleComment}
              placeholder="Add a comment... Use @ to tag someone"
            />
          )}

          <div style={styles.comments}>
            <h3 style={styles.commentsTitle}>💬 Comments ({comments.length})</h3>
            {comments.length === 0 ? (
              <p style={styles.noComments}>No comments yet. Be the first!</p>
            ) : (
              comments.map(comment => (
                <div key={comment.id} style={styles.comment}>
                  <span style={styles.commentUser}>{comment.user?.name}</span>
                  <span style={styles.commentText}>
                    {comment.text.split(/(@[a-zA-Z0-9_]+)/).map((part, i) =>
                      part.startsWith('@') ? (
                        <span key={i} style={{ color: '#a78bfa', fontWeight: '600' }}>{part}</span>
                      ) : (
                        <span key={i}>{part}</span>
                      )
                    )}
                  </span>
                  <span style={styles.commentDate}>
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { maxWidth: '1200px', margin: '0 auto', padding: '30px 20px' },
  layout: { display: 'grid', gridTemplateColumns: '1fr 380px', gap: '30px' },
  photoSection: { display: 'flex', flexDirection: 'column', gap: '16px' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  back: { color: '#a78bfa', textDecoration: 'none', fontSize: '14px' },
  counter: { color: '#888', fontSize: '13px' },
  photoWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
  photo: { width: '100%', borderRadius: '12px', objectFit: 'contain', maxHeight: '70vh' },
  navArrow: {
    position: 'absolute', top: '50%', transform: 'translateY(-50%)',
    background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white',
    fontSize: '3rem', cursor: 'pointer', borderRadius: '50%',
    width: '50px', height: '50px', display: 'flex', alignItems: 'center',
    justifyContent: 'center', zIndex: 10, transition: 'all 0.2s',
    lineHeight: 1
  },
  navArrowLeft: { left: '10px' },
  navArrowRight: { right: '10px' },
  keyboardHint: { color: '#555', fontSize: '12px', textAlign: 'center' },
  tags: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  tag: { background: '#2d1b69', color: '#a78bfa', padding: '3px 10px', borderRadius: '20px', fontSize: '12px' },
  infoSection: {
    background: '#1a1a1a', borderRadius: '12px', border: '1px solid #2d2d2d',
    padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px', height: 'fit-content'
  },
  photoTitle: { fontSize: '1.3rem', color: '#fff', fontWeight: '700' },
  uploader: { color: '#aaa', fontSize: '14px' },
  eventLink: { color: '#aaa', fontSize: '14px' },
  link: { color: '#a78bfa', textDecoration: 'none' },
  date: { color: '#666', fontSize: '12px' },
  actions: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  actionBtn: {
    background: '#2d2d2d', color: 'white', border: 'none', borderRadius: '8px',
    padding: '8px 14px', cursor: 'pointer', fontSize: '13px', fontWeight: '600'
  },
  commentInput: { display: 'flex', gap: '8px' },
  commentBtn: {
    background: '#7c3aed', color: 'white', border: 'none', borderRadius: '8px',
    padding: '8px 14px', cursor: 'pointer', fontWeight: '600', whiteSpace: 'nowrap'
  },
  comments: { display: 'flex', flexDirection: 'column', gap: '10px' },
  commentsTitle: { color: '#a78bfa', fontSize: '14px', fontWeight: '700' },
  noComments: { color: '#666', fontSize: '13px' },
  comment: {
    background: '#111', borderRadius: '8px', padding: '10px 12px',
    display: 'flex', flexDirection: 'column', gap: '4px'
  },
  commentUser: { color: '#a78bfa', fontSize: '12px', fontWeight: '700' },
  commentText: { color: '#ddd', fontSize: '13px' },
  commentDate: { color: '#555', fontSize: '11px' },
  center: { textAlign: 'center', color: '#888', padding: '80px', fontSize: '1.1rem' }
};

export default PhotoDetailPage;