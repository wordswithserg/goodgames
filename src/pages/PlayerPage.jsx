import { useState, useEffect, useRef } from 'react';
import { colors, fonts, card, button, input } from '../styles/theme';
import { games, gamesByGenre } from '../data/games';
import { GENRE_COLORS, StarDisplay } from '../components/GameCard';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import RequireAuth from '../components/auth/RequireAuth';

function computeCompleteness({ top10, wishlist, genreFavs, aboutAnswers }) {
  let score = 0;
  score += Math.min((top10?.length || 0) * 4, 40);
  const favs = Object.values(genreFavs || {}).filter(Boolean);
  score += Math.min(favs.length * 5, 20);
  const answered = (aboutAnswers || []).filter(qa => qa.answer?.trim()).length;
  score += Math.min(answered * 10, 30);
  if ((wishlist?.length || 0) > 0) score += 10;
  return Math.min(score, 100);
}

const ABOUT_QUESTIONS = [
  "What game got you into gaming?",
  "Desert island game?",
  "Biggest gaming hot take?",
  "Most underrated game?",
  "Game you always recommend?",
  "Last game that made you feel something?",
];

const GENRE_LABELS = { rpg: 'RPG', fps: 'FPS', cozy: 'Cozy', coop: 'Co-op' };

function SectionHeader({ children }) {
  return (
    <h2 style={{
      fontFamily: fonts.heading,
      fontSize: 20,
      fontWeight: 700,
      color: colors.text,
      margin: '0 0 14px',
      paddingBottom: 8,
      borderBottom: `2px solid ${colors.border}`,
    }}>
      {children}
    </h2>
  );
}

function GameSearch({ onSelect, exclude = [], placeholder = 'Search games…' }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const results = q.trim()
    ? games.filter(g => !exclude.includes(g.id) && g.title.toLowerCase().includes(q.toLowerCase())).slice(0, 8)
    : [];

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <input
        type="text"
        value={q}
        placeholder={placeholder}
        onChange={e => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        style={{ ...input.base, fontSize: 13 }}
      />
      {open && results.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: colors.white,
          border: `1px solid ${colors.border}`,
          borderRadius: 8,
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          zIndex: 200,
          maxHeight: 240,
          overflowY: 'auto',
        }}>
          {results.map(g => (
            <div
              key={g.id}
              onMouseDown={() => { onSelect(g); setQ(''); setOpen(false); }}
              style={{
                padding: '9px 14px',
                cursor: 'pointer',
                fontFamily: fonts.body,
                fontSize: 13,
                color: colors.text,
                borderBottom: `1px solid ${colors.border}`,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
              onMouseEnter={e => e.currentTarget.style.background = colors.lightBg}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{
                width: 20,
                height: 20,
                borderRadius: 4,
                background: g.coverColor,
                flexShrink: 0,
              }} />
              <span>{g.title}</span>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: colors.muted }}>
                {GENRE_LABELS[g.genre]}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PlayerPage({ navigateTo }) {
  const { user, profile, signOut, loading, isLoggedIn } = useAuth();
  const currentUser = profile?.username || null;
  const [editMode, setEditMode] = useState(false);

  const [top10, setTop10] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  const [genreFavs, setGenreFavs] = useState({});
  const [aboutAnswers, setAboutAnswers] = useState([
    { question: ABOUT_QUESTIONS[0], answer: '' },
    { question: ABOUT_QUESTIONS[1], answer: '' },
    { question: ABOUT_QUESTIONS[2], answer: '' },
  ]);

  // Fetch top10 and wishlist from Supabase
  useEffect(() => {
    if (!user?.id) { setDataLoading(false); return; }
    let cancelled = false;
    setDataLoading(true);
    async function fetchData() {
      const [top10Result, wishlistResult, reviewsResult] = await Promise.all([
        supabase
          .from('top10')
          .select('game_id, rank')
          .eq('user_id', user.id)
          .order('rank', { ascending: true }),
        supabase
          .from('wishlist')
          .select('game_id')
          .eq('user_id', user.id),
        supabase
          .from('reviews')
          .select('id, game_id, rating, body, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
      ]);
      if (cancelled) return;
      if (!top10Result.error) setTop10((top10Result.data || []).map(r => r.game_id));
      if (!wishlistResult.error) setWishlist((wishlistResult.data || []).map(r => r.game_id));
      if (!reviewsResult.error) setMyReviews(reviewsResult.data || []);
      setDataLoading(false);
    }
    fetchData();
    return () => { cancelled = true; };
  }, [user?.id]);

  // Load localStorage-backed data (genreFavs, aboutAnswers)
  useEffect(() => {
    if (!currentUser) return;
    const key = `gg_playerData_${currentUser}`;
    try {
      const stored = JSON.parse(localStorage.getItem(key) || '{}');
      if (stored.genreFavorites) setGenreFavs(stored.genreFavorites);
      if (stored.aboutAnswers) setAboutAnswers(stored.aboutAnswers);
    } catch {}
  }, [currentUser]);

  function saveLocalData(updates) {
    if (!currentUser) return;
    const key = `gg_playerData_${currentUser}`;
    try {
      const stored = JSON.parse(localStorage.getItem(key) || '{}');
      localStorage.setItem(key, JSON.stringify({ ...stored, ...updates }));
    } catch {}
  }

  async function addToTop10(game) {
    if (top10.length >= 10 || top10.includes(game.id)) return;
    const newRank = top10.length + 1;
    const optimistic = [...top10, game.id];
    setTop10(optimistic);
    const { error } = await supabase
      .from('top10')
      .insert({ user_id: user.id, game_id: game.id, rank: newRank });
    if (error) {
      console.error('addToTop10 error:', error);
      setTop10(top10);
    }
  }

  async function removeFromTop10(gameId) {
    const next = top10.filter(id => id !== gameId);
    setTop10(next);
    await supabase.from('top10').delete().eq('user_id', user.id).eq('game_id', gameId);
    if (next.length > 0) {
      const rows = next.map((id, i) => ({ user_id: user.id, game_id: id, rank: i + 1 }));
      await supabase.from('top10').upsert(rows, { onConflict: 'user_id,game_id' });
    }
  }

  async function moveUp(idx) {
    if (idx === 0) return;
    const next = [...top10];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    setTop10(next);
    const rows = [
      { user_id: user.id, game_id: next[idx - 1], rank: idx },
      { user_id: user.id, game_id: next[idx], rank: idx + 1 },
    ];
    await supabase.from('top10').upsert(rows, { onConflict: 'user_id,game_id' });
  }

  async function moveDown(idx) {
    if (idx === top10.length - 1) return;
    const next = [...top10];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    setTop10(next);
    const rows = [
      { user_id: user.id, game_id: next[idx], rank: idx + 1 },
      { user_id: user.id, game_id: next[idx + 1], rank: idx + 2 },
    ];
    await supabase.from('top10').upsert(rows, { onConflict: 'user_id,game_id' });
  }

  function setGenreFav(genre, gameId) {
    const next = { ...genreFavs, [genre]: gameId || null };
    setGenreFavs(next);
    saveLocalData({ genreFavorites: next });
  }

  function setAboutAnswer(idx, field, value) {
    const next = [...aboutAnswers];
    next[idx] = { ...next[idx], [field]: value };
    setAboutAnswers(next);
    saveLocalData({ aboutAnswers: next });
  }

  function getGameById(id) {
    return games.find(g => g.id === id);
  }

  const completeness = computeCompleteness({ top10, wishlist, genreFavs, aboutAnswers });

  if (loading || dataLoading) return null;
  if (!isLoggedIn) return <RequireAuth message="Log in to view your profile." />;
  if (!currentUser) return null;

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 28,
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: colors.navy,
            color: colors.white,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: fonts.heading,
            fontWeight: 700,
            fontSize: 22,
          }}>
            {currentUser[0].toUpperCase()}
          </div>
          <div>
            <h1 style={{
              fontFamily: fonts.heading,
              fontSize: 26,
              fontWeight: 700,
              color: colors.text,
              margin: 0,
            }}>
              {currentUser}
            </h1>
            <div style={{ fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginBottom: 8 }}>
              {top10.length} games in top 10 · {wishlist.length} wishlisted
            </div>
            {/* Completeness bar */}
            <div style={{ minWidth: 200 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontFamily: fonts.body, fontSize: 11, fontWeight: 600, color: colors.muted, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Profile completeness
                </span>
                <span style={{ fontFamily: fonts.body, fontSize: 11, fontWeight: 700, color: completeness === 100 ? '#2D7A4F' : colors.orange }}>
                  {completeness}%
                </span>
              </div>
              <div style={{ height: 6, background: colors.border, borderRadius: 3, overflow: 'hidden', width: 200 }}>
                <div style={{
                  height: '100%',
                  width: `${completeness}%`,
                  background: completeness === 100 ? '#2D7A4F' : colors.orange,
                  borderRadius: 3,
                  transition: 'width 0.4s ease',
                }} />
              </div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setEditMode(!editMode)}
            style={editMode ? button.primary : button.ghost}
          >
            {editMode ? '✓ Save Profile' : 'Edit Profile'}
          </button>
          <button
            onClick={() => signOut()}
            style={{ ...button.ghost, color: '#C0392B', borderColor: '#C0392B' }}
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Top 10 */}
      <div style={{ ...card, padding: '20px 24px', marginBottom: 20 }}>
        <SectionHeader>Top 10 Games</SectionHeader>
        {top10.length === 0 && !editMode && (
          <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.muted }}>
            No games yet. Click "Edit Profile" to build your top 10.
          </p>
        )}
        {top10.map((id, idx) => {
          const game = getGameById(id);
          if (!game) return null;
          const gc = GENRE_COLORS[game.genre] || { bg: '#EEE', text: '#555' };
          return (
            <div key={id} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 0',
              borderBottom: `1px solid ${colors.border}`,
            }}>
              <span style={{
                fontFamily: fonts.heading,
                fontSize: 18,
                fontWeight: 700,
                color: colors.muted,
                width: 24,
                textAlign: 'right',
                flexShrink: 0,
              }}>
                {idx + 1}
              </span>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 6,
                background: game.coverColor,
                flexShrink: 0,
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: fonts.body, fontWeight: 600, fontSize: 14, color: colors.text }}>
                  {game.title}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <span style={{
                    background: gc.bg, color: gc.text,
                    fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 8,
                    textTransform: 'uppercase', letterSpacing: '0.4px', fontFamily: fonts.body,
                  }}>
                    {game.genreLabel}
                  </span>
                  <span style={{ fontFamily: fonts.body, fontSize: 11, color: colors.muted }}>{game.year}</span>
                </div>
              </div>
              {editMode && (
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    onClick={() => moveUp(idx)}
                    disabled={idx === 0}
                    style={{
                      ...button.ghost,
                      padding: '4px 8px',
                      fontSize: 14,
                      opacity: idx === 0 ? 0.3 : 1,
                    }}
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveDown(idx)}
                    disabled={idx === top10.length - 1}
                    style={{
                      ...button.ghost,
                      padding: '4px 8px',
                      fontSize: 14,
                      opacity: idx === top10.length - 1 ? 0.3 : 1,
                    }}
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => removeFromTop10(id)}
                    style={{ ...button.danger, padding: '4px 8px', fontSize: 14 }}
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {editMode && top10.length < 10 && (
          <div style={{ marginTop: 14 }}>
            <GameSearch
              onSelect={addToTop10}
              exclude={top10}
              placeholder={`Add game (${top10.length}/10)…`}
            />
          </div>
        )}
        {editMode && top10.length >= 10 && (
          <p style={{ fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 10 }}>
            Top 10 is full. Remove a game to add another.
          </p>
        )}
      </div>

      {/* My Reviews */}
      <div style={{ ...card, padding: '20px 24px', marginBottom: 20 }}>
        <SectionHeader>My Reviews</SectionHeader>
        {myReviews.length === 0 ? (
          <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.muted }}>
            No reviews yet. Head to a game page to write one.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {myReviews.map(review => {
              const game = getGameById(review.game_id);
              if (!game) return null;
              const gc = GENRE_COLORS[game.genre] || { bg: '#EEE', text: '#555' };
              return (
                <div
                  key={review.id}
                  onClick={() => navigateTo('game', game)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    padding: '12px 14px',
                    background: colors.lightBg,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 8,
                    cursor: 'pointer',
                    transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = colors.navy}
                  onMouseLeave={e => e.currentTarget.style.borderColor = colors.border}
                >
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 6,
                    background: game.coverColor,
                    flexShrink: 0,
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: fonts.body, fontWeight: 600, fontSize: 14, color: colors.text }}>
                        {game.title}
                      </span>
                      <span style={{
                        background: gc.bg, color: gc.text,
                        fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 8,
                        textTransform: 'uppercase', letterSpacing: '0.4px', fontFamily: fonts.body,
                      }}>
                        {game.genreLabel}
                      </span>
                      <span style={{ marginLeft: 'auto', fontFamily: fonts.body, fontSize: 11, color: colors.muted }}>
                        {new Date(review.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div style={{ marginBottom: review.body ? 6 : 0 }}>
                      <StarDisplay rating={review.rating} size={13} />
                    </div>
                    {review.body && (
                      <p style={{
                        fontFamily: fonts.body,
                        fontSize: 13,
                        color: colors.text,
                        margin: 0,
                        lineHeight: 1.5,
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}>
                        {review.body}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Genre Favorites */}
      <div style={{ ...card, padding: '20px 24px', marginBottom: 20 }}>
        <SectionHeader>Genre Favorites</SectionHeader>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {Object.entries(GENRE_LABELS).map(([genre, label]) => {
            const favId = genreFavs[genre];
            const favGame = favId ? getGameById(favId) : null;
            const gc = GENRE_COLORS[genre] || { bg: '#EEE', text: '#555' };
            return (
              <div key={genre} style={{
                background: colors.lightBg,
                borderRadius: 8,
                padding: '12px 14px',
                border: `1px solid ${colors.border}`,
              }}>
                <div style={{
                  fontFamily: fonts.body,
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: gc.text,
                  marginBottom: 8,
                }}>
                  {label}
                </div>
                {editMode ? (
                  <select
                    value={favId || ''}
                    onChange={e => setGenreFav(genre, e.target.value || null)}
                    style={{
                      ...input.base,
                      fontSize: 13,
                      padding: '6px 10px',
                    }}
                  >
                    <option value="">— Pick a favorite —</option>
                    {gamesByGenre[genre]?.map(g => (
                      <option key={g.id} value={g.id}>{g.title}</option>
                    ))}
                  </select>
                ) : favGame ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 24,
                      height: 24,
                      borderRadius: 4,
                      background: favGame.coverColor,
                      flexShrink: 0,
                    }} />
                    <span style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 600, color: colors.text }}>
                      {favGame.title}
                    </span>
                  </div>
                ) : (
                  <span style={{ fontFamily: fonts.body, fontSize: 13, color: colors.muted, fontStyle: 'italic' }}>
                    Not set
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* About Me */}
      <div style={{ ...card, padding: '20px 24px', marginBottom: 20 }}>
        <SectionHeader>About Me</SectionHeader>
        {aboutAnswers.map((qa, idx) => (
          <div key={idx} style={{ marginBottom: 16 }}>
            {editMode ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <select
                  value={qa.question}
                  onChange={e => setAboutAnswer(idx, 'question', e.target.value)}
                  style={{ ...input.base, fontSize: 13 }}
                >
                  {ABOUT_QUESTIONS.map(q => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Your answer…"
                  value={qa.answer}
                  onChange={e => setAboutAnswer(idx, 'answer', e.target.value)}
                  style={{ ...input.base, fontSize: 13 }}
                />
              </div>
            ) : (
              <div>
                <div style={{
                  fontFamily: fonts.body,
                  fontSize: 13,
                  fontWeight: 600,
                  color: colors.navy,
                  marginBottom: 3,
                }}>
                  {qa.question}
                </div>
                <div style={{
                  fontFamily: fonts.body,
                  fontSize: 14,
                  color: qa.answer ? colors.text : colors.muted,
                  fontStyle: qa.answer ? 'normal' : 'italic',
                }}>
                  {qa.answer || 'Not answered yet.'}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Wishlist */}
      <div style={{ ...card, padding: '20px 24px' }}>
        <SectionHeader>Wishlist</SectionHeader>
        {wishlist.length === 0 ? (
          <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.muted }}>
            No games wishlisted yet. Browse games and click the Wishlist button to add them here.
          </p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {wishlist.map(id => {
              const game = getGameById(id);
              if (!game) return null;
              const gc = GENRE_COLORS[game.genre] || { bg: '#EEE', text: '#555' };
              return (
                <div key={id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: colors.lightBg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 8,
                  padding: '8px 12px',
                }}>
                  <div style={{
                    width: 22,
                    height: 22,
                    borderRadius: 4,
                    background: game.coverColor,
                    flexShrink: 0,
                  }} />
                  <span style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 600, color: colors.text }}>
                    {game.title}
                  </span>
                  <span style={{
                    background: gc.bg, color: gc.text,
                    fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 8,
                    textTransform: 'uppercase', letterSpacing: '0.4px', fontFamily: fonts.body,
                  }}>
                    {game.genreLabel}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
