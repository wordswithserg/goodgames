import { useState, useEffect, useRef } from 'react';
import { colors, fonts, input } from '../styles/theme';
import { searchGames } from '../lib/igdb';
import { games as localGames } from '../data/games';
import { supabase } from '../lib/supabase';
import NavAuth from './auth/NavAuth';

const NAV_LINKS = [
  { label: 'Home', page: 'home' },
  { label: 'My Profile', page: 'player' },
  { label: 'My Squads', page: 'squad' },
];

const FEEDBACK_URL = 'https://forms.fillout.com/t/guNnh1oh8Zus';

function NavSearchBar({ navigateTo }) {
  const [query, setQuery] = useState('');
  const [gameResults, setGameResults] = useState([]);
  const [userResults, setUserResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  function close() {
    setIsOpen(false);
    setQuery('');
    setGameResults([]);
    setUserResults([]);
  }

  function selectGame(game) {
    close();
    navigateTo('game', game);
  }

  function selectUser(user) {
    close();
    navigateTo('profile', { id: user.id, username: user.username });
  }

  useEffect(() => {
    const q = query.trim();
    if (!q) { setGameResults([]); setUserResults([]); setIsOpen(false); setIsLoading(false); return; }
    setIsLoading(true);
    const t = setTimeout(() => {
      const ql = q.toLowerCase();
      const localMatches = localGames.filter(g => g.title.toLowerCase().includes(ql)).slice(0, 5);
      const localTitles = new Set(localMatches.map(g => g.title.toLowerCase()));

      Promise.all([
        searchGames(q).catch(() => []),
        supabase.from('profiles').select('id, username').ilike('username', `%${ql}%`).limit(4).then(r => r.data || []),
      ]).then(([igdbGames, users]) => {
        const igdbOnly = igdbGames.filter(g => !localTitles.has(g.title.toLowerCase()));
        setGameResults([...localMatches, ...igdbOnly].slice(0, 5));
        setUserResults(users);
        setIsLoading(false);
        setIsOpen(true);
      });
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (!isOpen) return;
    function onMouseDown(e) { if (!containerRef.current?.contains(e.target)) { setIsOpen(false); } }
    function onKeyDown(e) { if (e.key === 'Escape') { setIsOpen(false); inputRef.current?.blur(); } }
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => { document.removeEventListener('mousedown', onMouseDown); document.removeEventListener('keydown', onKeyDown); };
  }, [isOpen]);

  const showDropdown = isOpen && (isLoading || gameResults.length > 0 || userResults.length > 0 || query.trim());

  return (
    <div ref={containerRef} style={{ flex: 1, maxWidth: 420, position: 'relative' }}>
      <input
        ref={inputRef}
        type="text"
        className="nav-search"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search games or players…"
        style={{
          ...input.base,
          background: 'rgba(255,255,255,0.12)',
          border: '1px solid rgba(255,255,255,0.22)',
          color: colors.white,
          fontSize: 13,
          padding: '6px 12px',
          borderRadius: 8,
        }}
      />

      {showDropdown && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          right: 0,
          background: colors.white,
          border: `1px solid ${colors.border}`,
          borderRadius: 8,
          boxShadow: '0 6px 24px rgba(0,0,0,0.18)',
          zIndex: 300,
          overflow: 'hidden',
        }}>
          {isLoading && (
            <div style={{ padding: '10px 14px', fontFamily: fonts.body, fontSize: 13, color: colors.muted }}>
              Searching…
            </div>
          )}

          {!isLoading && gameResults.length === 0 && userResults.length === 0 && query.trim() && (
            <div style={{ padding: '10px 14px', fontFamily: fonts.body, fontSize: 13, color: colors.muted }}>
              No results for "{query.trim()}"
            </div>
          )}

          {!isLoading && gameResults.length > 0 && (
            <>
              <div style={{ padding: '6px 12px 4px', fontFamily: fonts.body, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: colors.muted }}>
                Games
              </div>
              {gameResults.map(g => (
                <div
                  key={g.id}
                  onMouseDown={() => selectGame(g)}
                  style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, borderTop: `1px solid ${colors.border}` }}
                  onMouseEnter={e => e.currentTarget.style.background = colors.lightBg}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {g.coverUrl ? (
                    <img src={g.coverUrl} alt={g.title} style={{ width: 24, height: 32, objectFit: 'cover', borderRadius: 3, flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 24, height: 32, borderRadius: 3, background: colors.border, flexShrink: 0 }} />
                  )}
                  <span style={{ flex: 1, fontFamily: fonts.body, fontSize: 13, fontWeight: 500, color: colors.text }}>{g.title}</span>
                  <span style={{ fontFamily: fonts.body, fontSize: 11, color: colors.muted, flexShrink: 0 }}>{g.year}</span>
                </div>
              ))}
            </>
          )}

          {!isLoading && gameResults.length > 0 && userResults.length > 0 && (
            <div style={{ height: 1, background: colors.border, margin: '4px 12px' }} />
          )}

          {!isLoading && userResults.length > 0 && (
            <>
              <div style={{ padding: '6px 12px 4px', fontFamily: fonts.body, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: colors.muted }}>
                Players
              </div>
              {userResults.map(u => (
                <div
                  key={u.id}
                  onMouseDown={() => selectUser(u)}
                  style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, borderTop: `1px solid ${colors.border}` }}
                  onMouseEnter={e => e.currentTarget.style.background = colors.lightBg}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: colors.navy, color: colors.white,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: fonts.body, fontWeight: 700, fontSize: 12, flexShrink: 0,
                  }}>
                    {u.username[0].toUpperCase()}
                  </div>
                  <span style={{ fontFamily: fonts.body, fontSize: 13, color: colors.text }}>{u.username}</span>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function Nav({ currentPage, navigateTo }) {
  const [menuOpen, setMenuOpen] = useState(false);

  function handleNav(page) {
    setMenuOpen(false);
    navigateTo(page);
  }

  return (
    <>
      <nav
        className="nav-root"
        style={{
          background: colors.navy,
          color: colors.bg,
          display: 'flex',
          alignItems: 'center',
          padding: '0 28px',
          height: 56,
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
          gap: 24,
        }}
      >
        {/* Logo */}
        <button
          onClick={() => { setMenuOpen(false); navigateTo('home'); }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginRight: 8,
          }}
        >
          <div
            className="nav-logo"
            style={{ height: 38, width: 200, overflow: 'hidden', position: 'relative', flexShrink: 0 }}
          >
            <img
              src="/goodgames-05.png"
              alt="GoodGames"
              style={{
                position: 'absolute',
                height: 220,
                width: 'auto',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                filter: 'brightness(0) invert(1)',
                maxWidth: 'none',
              }}
            />
          </div>
        </button>

        {/* Desktop: Page links */}
        <div className="nav-desktop-only" style={{ gap: 4 }}>
          {NAV_LINKS.map(link => (
            <button
              key={link.page}
              onClick={() => navigateTo(link.page)}
              style={{
                background: currentPage === link.page ? 'rgba(245,200,66,0.18)' : 'none',
                border: 'none',
                color: currentPage === link.page ? colors.yellow : colors.bg,
                fontFamily: fonts.pixel,
                fontSize: 9,
                cursor: 'pointer',
                padding: '6px 14px',
                borderRadius: 6,
                transition: 'background 0.15s',
              }}
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* Desktop: Search */}
        <div className="nav-desktop-only" style={{ flex: 1 }}>
          <NavSearchBar navigateTo={navigateTo} />
        </div>

        {/* Desktop: Feedback */}
        <a
          className="nav-desktop-only"
          href={FEEDBACK_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            background: 'rgba(245,200,66,0.15)',
            border: '1px solid rgba(245,200,66,0.4)',
            color: colors.yellow,
            fontFamily: fonts.pixel,
            fontSize: 9,
            cursor: 'pointer',
            padding: '6px 14px',
            borderRadius: 6,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          Feedback
        </a>

        {/* Auth + Hamburger (right side, always visible) */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <NavAuth onNavigateToProfile={() => handleNav('player')} onNavigateToSettings={() => handleNav('settings')} />

          {/* Mobile: Hamburger */}
          <button
            className="nav-mobile-only"
            onClick={() => setMenuOpen(m => !m)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            style={{
              background: 'none',
              border: 'none',
              color: colors.white,
              cursor: 'pointer',
              fontSize: 22,
              padding: '4px 6px',
              lineHeight: 1,
            }}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </nav>

      {/* Mobile slide-down menu */}
      {menuOpen && (
        <div style={{
          position: 'fixed',
          top: 56,
          left: 0,
          right: 0,
          background: colors.navy,
          zIndex: 99,
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        }}>
          <NavSearchBar navigateTo={(page, data) => { setMenuOpen(false); navigateTo(page, data); }} />
          <div style={{ height: 1, background: 'rgba(255,255,255,0.12)', margin: '4px 0' }} />
          {NAV_LINKS.map(link => (
            <button
              key={link.page}
              onClick={() => handleNav(link.page)}
              style={{
                background: currentPage === link.page ? 'rgba(245,200,66,0.18)' : 'none',
                border: 'none',
                color: currentPage === link.page ? colors.yellow : colors.bg,
                fontFamily: fonts.pixel,
                fontSize: 9,
                cursor: 'pointer',
                padding: '12px 14px',
                borderRadius: 6,
                textAlign: 'left',
                width: '100%',
              }}
            >
              {link.label}
            </button>
          ))}
          <a
            href={FEEDBACK_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMenuOpen(false)}
            style={{
              background: 'rgba(245,200,66,0.15)',
              border: '1px solid rgba(245,200,66,0.4)',
              color: colors.yellow,
              fontFamily: fonts.pixel,
              fontSize: 9,
              padding: '12px 14px',
              borderRadius: 6,
              textDecoration: 'none',
              display: 'block',
            }}
          >
            Feedback
          </a>
        </div>
      )}
    </>
  );
}
