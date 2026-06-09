import { useState, useRef, useEffect } from 'react';
import { searchUsers } from '../api';

const MentionInput = ({ value, onChange, onSubmit, placeholder }) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStart, setMentionStart] = useState(-1);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();
  const suggestionsRef = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (mentionQuery.length > 0) {
      setLoading(true);
      const timer = setTimeout(async () => {
        try {
          const res = await searchUsers(mentionQuery);
          setSuggestions(res.data.users);
          setShowSuggestions(res.data.users.length > 0);
        } catch (err) {
          setSuggestions([]);
        } finally {
          setLoading(false);
        }
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  }, [mentionQuery]);

  const handleInputChange = (e) => {
    const text = e.target.value;
    onChange(text);

    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = text.substring(0, cursorPos);
    const atIndex = textBeforeCursor.lastIndexOf('@');

    if (atIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(atIndex + 1);
      // Username has no spaces — only letters, numbers, underscores
      if (/^[a-zA-Z0-9_]*$/.test(textAfterAt)) {
        setMentionStart(atIndex);
        setMentionQuery(textAfterAt);
        return;
      }
    }

    setMentionQuery('');
    setShowSuggestions(false);
    setMentionStart(-1);
  };

  const handleSelectUser = (user) => {
    const beforeMention = value.substring(0, mentionStart);
    const afterCursor = value.substring(mentionStart + mentionQuery.length + 1);
    const newText = `${beforeMention}@${user.username} ${afterCursor}`;

    onChange(newText);
    setShowSuggestions(false);
    setMentionQuery('');
    setMentionStart(-1);

    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const newCursorPos = beforeMention.length + user.username.length + 2;
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !showSuggestions) onSubmit();
    if (e.key === 'Escape') setShowSuggestions(false);
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.inputRow}>
        <input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || 'Add a comment... Use @username to tag'}
          style={styles.input}
        />
        <button onClick={onSubmit} style={styles.postBtn}>Post</button>
      </div>

      {showSuggestions && (
        <div ref={suggestionsRef} style={styles.dropdown}>
          <div style={styles.dropdownHeader}>
            {loading ? '🔍 Searching...' : `👥 Tag someone`}
          </div>
          {suggestions.map(user => (
            <div
              key={user.id}
              onClick={() => handleSelectUser(user)}
              style={styles.suggestionItem}
              onMouseEnter={e => e.currentTarget.style.background = '#2d1b69'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} style={styles.avatar} />
              ) : (
                <div style={styles.avatarPlaceholder}>
                  {user.name[0].toUpperCase()}
                </div>
              )}
              <div style={styles.userInfo}>
                <span style={styles.userName}>{user.name}</span>
                <span style={styles.userRole}>@{user.username} • {user.role}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  wrapper: { position: 'relative', width: '100%' },
  inputRow: { display: 'flex', gap: '8px' },
  input: {
    flex: 1, background: '#1a1a1a', border: '1px solid #3d3d3d',
    borderRadius: '8px', color: 'white', padding: '10px 14px',
    fontSize: '14px', outline: 'none', transition: 'border-color 0.2s'
  },
  postBtn: {
    background: '#7c3aed', color: 'white', border: 'none',
    borderRadius: '8px', padding: '8px 14px', cursor: 'pointer',
    fontWeight: '600', whiteSpace: 'nowrap', fontSize: '13px'
  },
  dropdown: {
    position: 'absolute', bottom: '100%', left: 0, right: 0,
    background: '#1a1a1a', border: '1px solid #3d3d3d',
    borderRadius: '10px', marginBottom: '6px',
    boxShadow: '0 -4px 20px rgba(0,0,0,0.5)', zIndex: 1000,
    maxHeight: '280px', overflowY: 'auto'
  },
  dropdownHeader: {
    padding: '8px 14px', fontSize: '11px', color: '#888',
    borderBottom: '1px solid #2d2d2d', fontWeight: '600'
  },
  suggestionItem: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '10px 14px', cursor: 'pointer', transition: 'background 0.15s'
  },
  avatar: {
    width: '34px', height: '34px', borderRadius: '50%',
    objectFit: 'cover', border: '2px solid #7c3aed', flexShrink: 0
  },
  avatarPlaceholder: {
    width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
    background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'white', fontWeight: '700', fontSize: '13px'
  },
  userInfo: { flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' },
  userName: { color: '#fff', fontSize: '13px', fontWeight: '600' },
  userRole: { color: '#888', fontSize: '11px' }
};

export default MentionInput;