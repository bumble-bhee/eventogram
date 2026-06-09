import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import { getNotifications, markNotificationsRead } from '../api';
import toast from 'react-hot-toast';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef();

  useEffect(() => {
    if (user) fetchNotifications();
    const interval = setInterval(() => {
      if (user) fetchNotifications();
    }, 30000); // poll every 30 seconds
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await getNotifications();
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    } catch (err) { }
  };

  const handleBellClick = async () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications && unreadCount > 0) {
      await markNotificationsRead();
      setUnreadCount(0);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const getNotifIcon = (type) => {
    if (type === 'LIKE') return '❤️';
    if (type === 'COMMENT') return '💬';
    if (type === 'TAG') return '🏷️';
    if (type === 'DOWNLOAD') return '⬇️';
    if (type === 'NEW_PHOTO') return '📷';
    if (type === 'NEW_EVENT') return '🎉';
    return '🔔';
  };

  return (
    <nav style={styles.nav}>
      <Link to="/" style={styles.logo}>📸 Eventogram</Link>
      <div style={styles.links}>
        {user && <Link to="/" style={styles.link}>Events</Link>}
        {user && <Link to="/search" style={styles.link}>Search</Link>}
        {user && <Link to="/profile" style={styles.link}>My Profile</Link>}
        {user && (user.role === 'ADMIN' || user.role === 'PHOTOGRAPHER' || user.role === 'CLUB_MEMBER') && (
          <Link to="/create-event" style={styles.link}>+ Event</Link>
        )}
        {user ? (
          <div style={styles.userSection}>
            {/* Notification Bell */}
            <div ref={notifRef} style={styles.bellWrapper}>
              <button onClick={handleBellClick} style={styles.bellBtn}>
                🔔
                {unreadCount > 0 && (
                  <span style={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </button>

              {showNotifications && (
                <div style={styles.notifDropdown}>
                  <div style={styles.notifHeader}>
                    <span style={styles.notifTitle}>Notifications</span>
                    {unreadCount === 0 && <span style={styles.allRead}>All caught up!</span>}
                  </div>
                  {notifications.length === 0 ? (
                    <div style={styles.noNotif}>No notifications yet</div>
                  ) : (
                    notifications.map(notif => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          setShowNotifications(false);
                          if (notif.mediaId && notif.media?.eventId) {
                            navigate(`/events/${notif.media.eventId}/media/${notif.mediaId}`);
                          } else if (notif.mediaId) {
                            navigate(`/events/1/media/${notif.mediaId}`);
                          }
                        }}
                        style={{
                          ...styles.notifItem,
                          background: notif.isRead ? 'transparent' : '#1e1040',
                          cursor: notif.mediaId ? 'pointer' : 'default'
                        }}
                      >
                        <span style={styles.notifIcon}>{getNotifIcon(notif.type)}</span>
                        <div style={styles.notifBody}>
                          <p style={styles.notifMsg}>{notif.message}</p>
                          <p style={styles.notifTime}>
                            {new Date(notif.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* User Info */}
            <Link to="/profile" style={styles.userInfo}>
              {user.avatar ? (
                <img src={user.avatar} alt="avatar" style={styles.navAvatar} />
              ) : (
                <div style={styles.navAvatarPlaceholder}>
                  {user.name?.[0]?.toUpperCase()}
                </div>
              )}
              <span style={styles.username}>{user.name}</span>
            </Link>

            <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
          </div>
        ) : (
          <div style={styles.userSection}>
            <Link to="/login" style={styles.link}>Login</Link>
            <Link to="/register" style={styles.registerBtn}>Register</Link>
          </div>
        )}
      </div>
    </nav>
  );
};

const styles = {
  nav: {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
    background: 'rgba(15,15,15,0.95)', backdropFilter: 'blur(10px)',
    borderBottom: '1px solid #2d2d2d', padding: '0 30px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    height: '65px'
  },
  logo: { fontSize: '1.4rem', fontWeight: '800', color: '#a78bfa', textDecoration: 'none' },
  links: { display: 'flex', alignItems: 'center', gap: '20px' },
  link: { color: '#ccc', textDecoration: 'none', fontSize: '14px', fontWeight: '500' },
  userSection: { display: 'flex', alignItems: 'center', gap: '12px' },
  bellWrapper: { position: 'relative' },
  bellBtn: {
    background: 'transparent', border: 'none', fontSize: '18px',
    cursor: 'pointer', position: 'relative', padding: '4px'
  },
  badge: {
    position: 'absolute', top: '-4px', right: '-4px',
    background: '#dc2626', color: 'white', borderRadius: '50%',
    width: '18px', height: '18px', fontSize: '10px', fontWeight: '700',
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  notifDropdown: {
    position: 'absolute', top: '36px', right: 0,
    background: '#1a1a1a', border: '1px solid #2d2d2d',
    borderRadius: '12px', width: '320px', maxHeight: '400px',
    overflowY: 'auto', boxShadow: '0 8px 30px rgba(0,0,0,0.5)', zIndex: 9999
  },
  notifHeader: {
    padding: '14px 16px', borderBottom: '1px solid #2d2d2d',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
  },
  notifTitle: { color: '#fff', fontWeight: '700', fontSize: '14px' },
  allRead: { color: '#888', fontSize: '12px' },
  noNotif: { padding: '20px', textAlign: 'center', color: '#888', fontSize: '13px' },
  notifItem: {
    display: 'flex', gap: '12px', padding: '12px 16px',
    borderBottom: '1px solid #1f1f1f', cursor: 'pointer',
    transition: 'background 0.2s'
  },
  notifIcon: { fontSize: '18px', flexShrink: 0 },
  notifBody: { flex: 1 },
  notifMsg: { color: '#ddd', fontSize: '13px', marginBottom: '3px', lineHeight: '1.4' },
  notifTime: { color: '#666', fontSize: '11px' },
  userInfo: { display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' },
  navAvatar: { width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #7c3aed' },
  navAvatarPlaceholder: {
    width: '30px', height: '30px', borderRadius: '50%',
    background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'white', fontWeight: '700', fontSize: '13px'
  },
  username: { color: '#a78bfa', fontSize: '14px', fontWeight: '600' },
  logoutBtn: {
    background: 'transparent', border: '1px solid #555', color: '#ccc',
    padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px'
  },
  registerBtn: {
    background: 'linear-gradient(135deg, #7c3aed, #a78bfa)', color: 'white',
    padding: '7px 16px', borderRadius: '8px', textDecoration: 'none',
    fontSize: '13px', fontWeight: '600'
  }
};

export default Navbar;