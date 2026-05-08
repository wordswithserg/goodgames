// SQL MIGRATIONS — run once in the Supabase SQL editor:
// ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;
// ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_color text;
// ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bg_color text;

import { useState, useEffect, useRef } from 'react';
import { colors, fonts, card, button, input } from '../styles/theme';
import { games } from '../data/games';
import { GENRE_COLORS, StarDisplay } from '../components/GameCard';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import RequireAuth from '../components/auth/RequireAuth';
import { getGameById as getIgdbGame, searchGames, fetchIgdbGenres } from '../lib/igdb';

function contrastFor(hex) {
  if (!hex) return '#1A1A1A';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b > 140 ? '#1A1A1A' : '#FFFFFF';
}

function computeCompleteness({ top10, wishlist, genreFavSlots, aboutAnswers }) {
  let score = 0;
  score += Math.min((top10?.length || 0) * 4, 40);
  const favs = (genreFavSlots || []).filter(s => s.gameId);
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

const EMPTY_SLOTS = [
  { slotKey: '0', genreId: null, genreName: null, gameId: null },
  { slotKey: '1', genreId: null, genreName: null, gameId: null },
  { slotKey: '2', genreId: null, genreName: null, gameId: null },
  { slotKey: '3', genreId: null, genreName: null, gameId: null },
];

function SectionHeader({ children }) {
  return (
    <h2 style={{
      fontFamily: fonts.pixel,
      fontSize: 10,
      color: colors.text,
      margin: '0 0 16px',
      paddingBottom: 10,
      borderBottom: `2px solid ${colors.border}`,
    }}>
      {children}
    </h2>
  );
}

function GenreBreakdownBar({ segments }) {
  const [hovered, setHovered] = useState(null);
  return (
    <div style={{ position: 'relative', marginBottom: 16 }}>
      <div style={{ display: 'flex', height: 10, borderRadius: 6, overflow: 'hidden', gap: 2 }}>
        {segments.map((seg, i) => (
          <div
            key={seg.genre}
            onMouseEnter={e => {
              const rect = e.currentTarget.parentElement.getBoundingClientRect();
              const segRect = e.currentTarget.getBoundingClientRect();
              const x = ((segRect.left - rect.left) + segRect.width / 2) / rect.width * 100;
              setHovered({ ...seg, x });
            }}
            onMouseLeave={() => setHovered(null)}
            style={{
              flex: seg.count,
              background: seg.color,
              borderRadius: i === 0 ? '6px 0 0 6px' : i === segments.length - 1 ? '0 6px 6px 0' : 0,
              cursor: 'default',
              opacity: hovered && hovered.genre !== seg.genre ? 0.55 : 1,
              transition: 'opacity 0.15s',
            }}
          />
        ))}
      </div>
      {hovered && (
        <div style={{
          position: 'absolute',
          bottom: 16,
          left: `${hovered.x}%`,
          transform: 'translateX(-50%)',
          background: colors.navy,
          color: colors.white,
          fontFamily: fonts.body,
          fontSize: 12,
          padding: '5px 10px',
          borderRadius: 6,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          zIndex: 10,
        }}>
          {hovered.genreLabel} · {hovered.count} {hovered.count === 1 ? 'review' : 'reviews'} · {hovered.pct}%
        </div>
      )}
    </div>
  );
}

function IgdbGameSearch({ onSelect, exclude = [], placeholder = 'Search games…' }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!q.trim()) { setResults([]); setOpen(false); setLoading(false); return; }
    setLoading(true);
    setResults([]);
    const t = setTimeout(() => {
      searchGames(q.trim())
        .then(data => {
          setResults(data.filter(g => !exclude.includes(g.id)));
          setOpen(true);
        })
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 350);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function pick(game) {
    onSelect(game);
    setQ('');
    setResults([]);
    setOpen(false);
  }

  const showDropdown = q.trim().length > 0 && (loading || open);

  return (
    <div style={{ position: 'relative' }}>
      <input
        type="text"
        value={q}
        placeholder={placeholder}
        onChange={e => setQ(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        style={{ ...input.base, fontSize: 13 }}
      />
      {showDropdown && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: colors.white, border: `1px solid ${colors.border}`,
          borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          zIndex: 200, maxHeight: 260, overflowY: 'auto', marginTop: 2,
        }}>
          {loading && (
            <div style={{ padding: '10px 14px', fontFamily: fonts.body, fontSize: 13, color: colors.muted }}>
              Searching…
            </div>
          )}
          {!loading && results.length === 0 && (
            <div style={{ padding: '10px 14px', fontFamily: fonts.body, fontSize: 13, color: colors.muted }}>
              No games found for "{q}"
            </div>
          )}
          {!loading && results.map(g => (
            <div
              key={g.id}
              onMouseDown={() => pick(g)}
              style={{
                padding: '8px 12px', cursor: 'pointer',
                fontFamily: fonts.body, fontSize: 13, color: colors.text,
                borderBottom: `1px solid ${colors.border}`,
                display: 'flex', alignItems: 'center', gap: 8,
              }}
              onMouseEnter={e => e.currentTarget.style.background = colors.lightBg}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {g.coverUrl ? (
                <img src={g.coverUrl} alt={g.title} style={{ width: 24, height: 32, objectFit: 'cover', borderRadius: 3, flexShrink: 0 }} />
              ) : (
                <div style={{ width: 24, height: 32, borderRadius: 3, background: colors.border, flexShrink: 0 }} />
              )}
              <span style={{ flex: 1, fontWeight: 500 }}>{g.title}</span>
              <span style={{ fontSize: 11, color: colors.muted, flexShrink: 0 }}>{g.year}</span>
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
  const [showTop10Search, setShowTop10Search] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState(null);
  const avatarInputRef = useRef(null);

  const [profileColor, setProfileColor] = useState(profile?.profile_color || null);
  const profileColorInputRef = useRef(null);

  const [bgColor, setBgColor] = useState(profile?.bg_color || null);
  const bgColorInputRef = useRef(null);

  const [nowPlayingId, setNowPlayingId] = useState(null);
  const [nowPlayingGame, setNowPlayingGame] = useState(null);
  const [nowPlayingLoading, setNowPlayingLoading] = useState(false);
  const [showNowPlayingSearch, setShowNowPlayingSearch] = useState(false);

  const [top10, setTop10] = useState([]);
  const [top10IgdbGames, setTop10IgdbGames] = useState({});
  const [wishlist, setWishlist] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [reviewGameInfo, setReviewGameInfo] = useState({});
  const [dataLoading, setDataLoading] = useState(true);

  const [genreFavSlots, setGenreFavSlots] = useState(EMPTY_SLOTS);
  const [favIgdbGames, setFavIgdbGames] = useState({});
  const [igdbGenres, setIgdbGenres] = useState([]);
  const [wishlistIgdbGames, setWishlistIgdbGames] = useState({});
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
      const [top10Result, wishlistResult, reviewsResult, genreFavsResult, aboutMeResult] = await Promise.all([
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
        supabase
          .from('genre_favorites')
          .select('genre, game_id, genre_id, genre_name')
          .eq('user_id', user.id),
        supabase
          .from('about_me')
          .select('question_key, answer')
          .eq('user_id', user.id),
      ]);
      if (cancelled) return;

      if (!top10Result.error) setTop10((top10Result.data || []).map(r => r.game_id));
      if (!wishlistResult.error) setWishlist((wishlistResult.data || []).map(r => r.game_id));
      if (!reviewsResult.error) setMyReviews(reviewsResult.data || []);

      if (!genreFavsResult.error) {
        const bySlot = {};
        (genreFavsResult.data || []).forEach(r => { bySlot[r.genre] = r; });
        setGenreFavSlots(EMPTY_SLOTS.map(s => {
          const row = bySlot[s.slotKey];
          return row
            ? { slotKey: s.slotKey, genreId: row.genre_id || null, genreName: row.genre_name || null, gameId: row.game_id || null }
            : s;
        }));
      }

      if (!aboutMeResult.error) {
        const stored = (aboutMeResult.data || []).slice(0, 3).map(r => ({
          question: r.question_key,
          answer: r.answer,
        }));
        const storedQuestions = new Set(stored.map(e => e.question));
        const defaults = ABOUT_QUESTIONS
          .filter(q => !storedQuestions.has(q))
          .map(q => ({ question: q, answer: '' }));
        setAboutAnswers([...stored, ...defaults].slice(0, 3));
      }

      setDataLoading(false);
    }
    fetchData();
    return () => { cancelled = true; };
  }, [user?.id]);

  // Fetch IGDB genre list once on mount for the genre selector.
  useEffect(() => {
    fetchIgdbGenres().then(setIgdbGenres).catch(() => {});
  }, []);

  // Fetch IGDB game info for any igdb_ ids in the top 10.
  useEffect(() => {
    const igdbIds = [...new Set(top10.filter(id => String(id).startsWith('igdb_')))];
    if (!igdbIds.length) return;
    Promise.all(igdbIds.map(id => getIgdbGame(id).then(g => g ? [id, g] : null)))
      .then(results => {
        const map = {};
        results.filter(Boolean).forEach(([id, g]) => { map[id] = g; });
        setTop10IgdbGames(prev => ({ ...prev, ...map }));
      });
  }, [top10]);

  // Fetch IGDB game info for any igdb_ game ids stored in genre favorite slots.
  useEffect(() => {
    const igdbIds = [...new Set(
      genreFavSlots.map(s => s.gameId).filter(id => id && String(id).startsWith('igdb_'))
    )];
    if (!igdbIds.length) return;
    Promise.all(igdbIds.map(id => getIgdbGame(id).then(g => g ? [id, g] : null)))
      .then(results => {
        const map = {};
        results.filter(Boolean).forEach(([id, g]) => { map[id] = g; });
        setFavIgdbGames(prev => ({ ...prev, ...map }));
      });
  }, [genreFavSlots]);

  // Fetch IGDB game info for any igdb_ ids in the wishlist.
  useEffect(() => {
    const igdbIds = [...new Set(wishlist.filter(id => String(id).startsWith('igdb_')))];
    if (!igdbIds.length) return;
    Promise.all(igdbIds.map(id => getIgdbGame(id).then(g => g ? [id, g] : null)))
      .then(results => {
        const map = {};
        results.filter(Boolean).forEach(([id, g]) => { map[id] = g; });
        setWishlistIgdbGames(prev => ({ ...prev, ...map }));
      });
  }, [wishlist]);

  // For reviews of IGDB games, fetch their title/cover from IGDB.
  useEffect(() => {
    const igdbIds = [...new Set(
      myReviews.map(r => r.game_id).filter(id => String(id).startsWith('igdb_'))
    )];
    if (!igdbIds.length) return;
    Promise.all(igdbIds.map(id => getIgdbGame(id).then(g => g ? [id, g] : null)))
      .then(results => {
        const map = {};
        results.filter(Boolean).forEach(([id, g]) => { map[id] = g; });
        setReviewGameInfo(prev => ({ ...prev, ...map }));
      });
  }, [myReviews]);


  async function addToTop10(game) {
    if (top10.length >= 10 || top10.includes(game.id)) return;
    if (String(game.id).startsWith('igdb_')) {
      setTop10IgdbGames(prev => ({ ...prev, [game.id]: game }));
    }
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

  async function setSlotGenre(slotKey, genreId, genreName) {
    setGenreFavSlots(prev => prev.map(s =>
      s.slotKey === slotKey ? { ...s, genreId, genreName, gameId: null } : s
    ));
    await supabase.from('genre_favorites')
      .upsert(
        { user_id: user.id, genre: slotKey, genre_id: genreId, genre_name: genreName, game_id: null },
        { onConflict: 'user_id,genre_id' }
      );
  }

  async function setSlotGame(slotKey, gameId, gameObject) {
    const slot = genreFavSlots.find(s => s.slotKey === slotKey);
    setGenreFavSlots(prev => prev.map(s =>
      s.slotKey === slotKey ? { ...s, gameId } : s
    ));
    if (gameObject && String(gameId).startsWith('igdb_')) {
      setFavIgdbGames(prev => ({ ...prev, [gameId]: gameObject }));
    }
    await supabase.from('genre_favorites')
      .upsert(
        { user_id: user.id, genre: slotKey, genre_id: slot?.genreId || null, genre_name: slot?.genreName || null, game_id: gameId },
        { onConflict: 'user_id,genre_id' }
      );
  }

  async function setAboutAnswer(idx, field, value) {
    const next = [...aboutAnswers];
    const old = next[idx];
    next[idx] = { ...old, [field]: value };
    setAboutAnswers(next);

    if (field === 'answer') {
      await supabase.from('about_me')
        .upsert({ user_id: user.id, question_key: old.question, answer: value }, { onConflict: 'user_id,question_key' });
    } else if (field === 'question' && old.question !== value) {
      // User switched which question is in this slot — move the row to the new key.
      await supabase.from('about_me')
        .delete().eq('user_id', user.id).eq('question_key', old.question);
      if (old.answer) {
        await supabase.from('about_me')
          .upsert({ user_id: user.id, question_key: value, answer: old.answer }, { onConflict: 'user_id,question_key' });
      }
    }
  }

  // Sync avatarUrl from profile once auth resolves.
  useEffect(() => {
    setAvatarUrl(profile?.avatar_url || null);
  }, [profile?.avatar_url]); // eslint-disable-line

  // Sync profileColor from profile once auth resolves.
  useEffect(() => {
    setProfileColor(profile?.profile_color || null);
  }, [profile?.profile_color]); // eslint-disable-line

  // Sync bgColor from profile once auth resolves.
  useEffect(() => {
    setBgColor(profile?.bg_color || null);
  }, [profile?.bg_color]); // eslint-disable-line


  async function handleAvatarFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('Image must be 5 MB or less.');
      return;
    }
    setAvatarError(null);
    setAvatarUploading(true);
    const path = `${user.id}/avatar.jpg`;
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type });
    if (uploadError) {
      setAvatarError('Upload failed. Please try again.');
      setAvatarUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
    const publicUrl = `${urlData?.publicUrl}?t=${Date.now()}`;
    const { error: updateError } = await supabase.from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id);
    if (updateError) {
      setAvatarError('Could not save avatar. Please try again.');
    } else {
      setAvatarUrl(publicUrl);
    }
    setAvatarUploading(false);
    e.target.value = '';
  }

  async function saveProfileColor(color) {
    setProfileColor(color);
    await supabase.from('profiles').update({ profile_color: color }).eq('id', user.id);
  }

  async function saveBgColor(color) {
    setBgColor(color);
    document.documentElement.style.setProperty('--page-bg', color || '');
    await supabase.from('profiles').update({ bg_color: color }).eq('id', user.id);
  }

  // Sync nowPlayingId from profile once auth resolves (useState initializer runs before profile loads).
  useEffect(() => {
    setNowPlayingId(profile?.now_playing_game_id || null);
  }, [profile?.now_playing_game_id]); // eslint-disable-line

  // Resolve now_playing_game_id to a full game object whenever it changes.
  useEffect(() => {
    if (!nowPlayingId) { setNowPlayingGame(null); setNowPlayingLoading(false); return; }
    if (String(nowPlayingId).startsWith('igdb_')) {
      setNowPlayingLoading(true);
      getIgdbGame(nowPlayingId)
        .then(g => setNowPlayingGame(g || null))
        .finally(() => setNowPlayingLoading(false));
    } else {
      setNowPlayingGame(games.find(g => g.id === Number(nowPlayingId)) || null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nowPlayingId]);

  async function setNowPlaying(gameId, gameObject) {
    setNowPlayingId(gameId);
    if (gameObject) setNowPlayingGame(gameObject);
    const { error } = await supabase.from('profiles').update({ now_playing_game_id: gameId }).eq('id', user.id);
    if (error) console.error('[setNowPlaying] error:', error);
  }

  async function clearNowPlaying() {
    setNowPlayingId(null);
    setNowPlayingGame(null);
    const { error } = await supabase.from('profiles').update({ now_playing_game_id: null }).eq('id', user.id);
    if (error) console.error('[clearNowPlaying] error:', error);
  }

  function getGameById(id) {
    return games.find(g => g.id === id);
  }

  const completeness = computeCompleteness({ top10, wishlist, genreFavSlots, aboutAnswers });
  const headerFg = contrastFor(profileColor || null);
  const isHeaderDark = profileColor && headerFg === '#FFFFFF';
  const headerMuted = profileColor
    ? (isHeaderDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.45)')
    : colors.muted;
  const completenessTrack = profileColor
    ? (isHeaderDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)')
    : colors.border;
  const headerBtnStyle = profileColor ? {
    background: 'transparent',
    color: headerFg,
    border: `1px solid ${isHeaderDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.25)'}`,
    borderRadius: 6, padding: '7px 17px',
    fontFamily: fonts.body, fontSize: 14, fontWeight: 600, cursor: 'pointer',
  } : button.ghost;

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
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 28,
        ...(profileColor ? {
          background: profileColor,
          padding: '20px 24px',
          borderRadius: 12,
        } : {}),
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ position: 'relative', width: 52, height: 52, flexShrink: 0 }}>
              {avatarUploading ? (
                <div style={{
                  width: 52, height: 52, borderRadius: '50%',
                  background: colors.navy,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5">
                    <line x1="12" y1="2" x2="12" y2="6" />
                    <line x1="12" y1="18" x2="12" y2="22" />
                    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
                    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
                    <line x1="2" y1="12" x2="6" y2="12" />
                    <line x1="18" y1="12" x2="22" y2="12" />
                    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
                    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
                    <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite" />
                  </svg>
                </div>
              ) : avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={currentUser}
                  style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <div style={{
                  width: 52, height: 52, borderRadius: '50%',
                  background: colors.navy, color: colors.white,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: fonts.heading, fontWeight: 700, fontSize: 22,
                }}>
                  {currentUser[0].toUpperCase()}
                </div>
              )}
              {editMode && (
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  title="Change avatar"
                  style={{
                    position: 'absolute', bottom: 0, right: 0,
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'rgba(0,0,0,0.65)', border: '2px solid rgba(255,255,255,0.8)',
                    color: '#fff', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: 0,
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
              )}
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp"
                style={{ display: 'none' }}
                onChange={handleAvatarFileSelect}
              />
            </div>
            {avatarError && (
              <div style={{ fontFamily: fonts.body, fontSize: 11, color: '#C0392B', maxWidth: 80, textAlign: 'center', lineHeight: 1.3 }}>
                {avatarError}
              </div>
            )}
          </div>
          <div>
            <h1 style={{
              fontFamily: fonts.pixel,
              fontSize: 11,
              color: profileColor ? headerFg : colors.text,
              margin: 0,
              lineHeight: 1.6,
            }}>
              {currentUser}
            </h1>
            <div style={{ fontFamily: fonts.body, fontSize: 13, color: headerMuted, marginBottom: 8 }}>
              {top10.length} games in top 10 · {wishlist.length} wishlisted
            </div>
            {/* Completeness bar */}
            <div style={{ minWidth: 200 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontFamily: fonts.body, fontSize: 11, fontWeight: 600, color: headerMuted, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Profile completeness
                </span>
                <span style={{ fontFamily: fonts.body, fontSize: 11, fontWeight: 700, color: completeness === 100 ? '#2D7A4F' : colors.orange }}>
                  {completeness}%
                </span>
              </div>
              <div style={{ height: 6, background: completenessTrack, borderRadius: 3, overflow: 'hidden', width: 200 }}>
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
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => setEditMode(!editMode)}
            style={editMode ? button.primary : headerBtnStyle}
          >
            {editMode ? '✓ Save Profile' : 'Edit Profile'}
          </button>
          {editMode && (
            <>
              <input
                ref={profileColorInputRef}
                type="color"
                value={profileColor || '#1B2A4A'}
                style={{ display: 'none' }}
                onChange={e => saveProfileColor(e.target.value)}
              />
              <button
                onClick={() => profileColorInputRef.current?.click()}
                style={{ ...headerBtnStyle, display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <span style={{
                  display: 'inline-block', width: 12, height: 12, borderRadius: '50%', flexShrink: 0,
                  background: profileColor || (isHeaderDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.15)'),
                  border: `1px solid ${isHeaderDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.2)'}`,
                }} />
                Profile Color
              </button>
              {profileColor && (
                <button
                  onClick={() => saveProfileColor(null)}
                  title="Remove profile color"
                  style={{ ...headerBtnStyle, padding: '7px 11px' }}
                >
                  ×
                </button>
              )}
              <input
                ref={bgColorInputRef}
                type="color"
                value={bgColor || '#F5F2EC'}
                style={{ display: 'none' }}
                onChange={e => saveBgColor(e.target.value)}
              />
              <button
                onClick={() => bgColorInputRef.current?.click()}
                style={{ ...headerBtnStyle, display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <span style={{
                  display: 'inline-block', width: 12, height: 12, borderRadius: '50%', flexShrink: 0,
                  background: bgColor || (isHeaderDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.15)'),
                  border: `1px solid ${isHeaderDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.2)'}`,
                }} />
                Background
              </button>
              {bgColor && (
                <button
                  onClick={() => saveBgColor(null)}
                  title="Remove background color"
                  style={{ ...headerBtnStyle, padding: '7px 11px' }}
                >
                  ×
                </button>
              )}
            </>
          )}
          <button
            onClick={() => signOut()}
            style={{
              ...headerBtnStyle,
              color: isHeaderDark ? '#f87171' : '#C0392B',
              borderColor: isHeaderDark ? 'rgba(248,113,113,0.45)' : '#C0392B',
            }}
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Now Playing */}
      <div style={{ marginBottom: 20 }}>
        {showNowPlayingSearch ? (
          <div style={{ ...card, padding: '18px 22px' }}>
            <div style={{ fontFamily: fonts.body, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: colors.muted, marginBottom: 10 }}>
              Now Playing
            </div>
            <IgdbGameSearch
              onSelect={game => { setNowPlaying(game.id, game); setShowNowPlayingSearch(false); }}
              placeholder="Search for a game…"
            />
            <button
              onClick={() => setShowNowPlayingSearch(false)}
              style={{ ...button.ghost, marginTop: 10, fontSize: 12, padding: '5px 12px' }}
            >
              Cancel
            </button>
          </div>
        ) : nowPlayingLoading ? (
          <div style={{
            borderRadius: 12, height: 220, background: colors.navy,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontFamily: fonts.body, fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Loading…</span>
          </div>
        ) : nowPlayingGame ? (
          <div style={{ borderRadius: 12, overflow: 'hidden', height: 220, position: 'relative', background: nowPlayingGame.coverColor || colors.navy }}>
            {/* Blurred background */}
            {nowPlayingGame.coverUrl && (
              <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: `url(${nowPlayingGame.coverUrl})`,
                backgroundSize: 'cover', backgroundPosition: 'center',
                filter: 'blur(14px)', transform: 'scale(1.12)',
              }} />
            )}
            {/* Dark overlay */}
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.58)' }} />
            {/* Content */}
            <div style={{
              position: 'relative', zIndex: 1, height: '100%',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              padding: '18px 24px',
            }}>
              <div style={{ fontFamily: fonts.body, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'rgba(255,255,255,0.55)' }}>
                Now Playing
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                <div style={{
                  width: 64, height: 86, borderRadius: 6, flexShrink: 0,
                  background: nowPlayingGame.coverColor || colors.navy,
                  overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
                }}>
                  {nowPlayingGame.coverUrl && (
                    <img src={nowPlayingGame.coverUrl} alt={nowPlayingGame.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  )}
                </div>
                <div>
                  <div style={{ fontFamily: fonts.pixel, fontSize: 11, color: colors.white, lineHeight: 1.8, marginBottom: 8 }}>
                    {nowPlayingGame.title}
                  </div>
                  {nowPlayingGame.year && (
                    <div style={{ fontFamily: fonts.body, fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>
                      {nowPlayingGame.year}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setShowNowPlayingSearch(true)}
                  style={{
                    background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.28)',
                    color: colors.white, borderRadius: 6, padding: '5px 14px',
                    fontFamily: fonts.body, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  Change
                </button>
                <button
                  onClick={clearNowPlaying}
                  style={{
                    background: 'transparent', border: '1px solid rgba(255,255,255,0.18)',
                    color: 'rgba(255,255,255,0.55)', borderRadius: 6, padding: '5px 14px',
                    fontFamily: fonts.body, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div
            onClick={() => setShowNowPlayingSearch(true)}
            style={{
              borderRadius: 12, height: 220, background: colors.navy,
              border: '2px dashed rgba(255,255,255,0.12)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 14, cursor: 'pointer', transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#243558'}
            onMouseLeave={e => e.currentTarget.style.background = colors.navy}
          >
            <div style={{ fontFamily: fonts.body, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'rgba(255,255,255,0.35)' }}>
              Now Playing
            </div>
            <button
              onClick={e => { e.stopPropagation(); setShowNowPlayingSearch(true); }}
              style={{
                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.22)',
                color: colors.white, borderRadius: 6, padding: '8px 20px',
                fontFamily: fonts.body, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Set Now Playing
            </button>
          </div>
        )}
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
          const isIgdb = String(id).startsWith('igdb_');
          const game = isIgdb ? top10IgdbGames[id] : getGameById(id);
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
                background: game.coverColor || colors.navy,
                flexShrink: 0,
                overflow: 'hidden',
                position: 'relative',
              }}>
                {game.coverUrl && (
                  <img
                    src={game.coverUrl}
                    alt={game.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
                  />
                )}
              </div>
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
            {showTop10Search ? (
              <IgdbGameSearch
                onSelect={game => { addToTop10(game); setShowTop10Search(false); }}
                exclude={top10}
                placeholder="Search for a game to add…"
              />
            ) : (
              <button
                onClick={() => setShowTop10Search(true)}
                style={{ ...button.ghost, fontSize: 13, padding: '6px 14px' }}
              >
                + Add Game ({top10.length}/10)
              </button>
            )}
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
        {(() => {
          const counts = {};
          myReviews.forEach(review => {
            const isIgdb = String(review.game_id).startsWith('igdb_');
            const game = isIgdb ? reviewGameInfo[review.game_id] : getGameById(review.game_id);
            if (!game?.genre) return;
            if (!counts[game.genre]) counts[game.genre] = { genre: game.genre, genreLabel: game.genreLabel || game.genre, count: 0 };
            counts[game.genre].count++;
          });
          const total = Object.values(counts).reduce((s, g) => s + g.count, 0);
          if (total === 0) return null;
          const segments = Object.values(counts)
            .sort((a, b) => b.count - a.count)
            .map(g => ({
              ...g,
              pct: Math.round((g.count / total) * 100),
              color: (GENRE_COLORS[g.genre] || {}).text || '#888',
            }));
          return <GenreBreakdownBar segments={segments} />;
        })()}
        {myReviews.length === 0 ? (
          <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.muted }}>
            No reviews yet. Head to a game page to write one.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {myReviews.map(review => {
              const isIgdb = String(review.game_id).startsWith('igdb_');
              const game = isIgdb
                ? reviewGameInfo[review.game_id]
                : getGameById(review.game_id);
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
                    background: game.coverColor || colors.navy,
                    flexShrink: 0,
                    overflow: 'hidden',
                    position: 'relative',
                  }}>
                    {game.coverUrl && (
                      <img
                        src={game.coverUrl}
                        alt={game.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
                      />
                    )}
                  </div>
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
          {genreFavSlots.map(slot => {
            const favGame = slot.gameId
              ? (String(slot.gameId).startsWith('igdb_') ? favIgdbGames[slot.gameId] : getGameById(slot.gameId))
              : null;
            return (
              <div key={slot.slotKey} style={{
                background: colors.lightBg,
                borderRadius: 8,
                padding: '12px 14px',
                border: `1px solid ${colors.border}`,
              }}>
                {/* Genre label / selector */}
                {editMode ? (
                  <select
                    value={slot.genreId || ''}
                    onChange={e => {
                      const selected = igdbGenres.find(g => g.id === Number(e.target.value));
                      setSlotGenre(slot.slotKey, selected?.id || null, selected?.name || null);
                    }}
                    style={{
                      ...input.base, fontSize: 11, padding: '3px 8px', marginBottom: 8,
                      fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="">— Pick a genre —</option>
                    {igdbGenres.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                ) : (
                  <div style={{
                    fontFamily: fonts.body, fontSize: 11, fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8,
                    color: slot.genreName ? colors.navy : colors.muted,
                  }}>
                    {slot.genreName || 'Pick a genre'}
                  </div>
                )}

                {/* Game search or display */}
                {editMode && slot.genreId ? (
                  <IgdbGameSearch
                    key={slot.slotKey}
                    onSelect={game => setSlotGame(slot.slotKey, game.id, game)}
                    placeholder={favGame ? `Change: ${favGame.title}` : 'Search for a game…'}
                  />
                ) : editMode && !slot.genreId ? (
                  <span style={{ fontFamily: fonts.body, fontSize: 12, color: colors.muted, fontStyle: 'italic' }}>
                    Select a genre first
                  </span>
                ) : favGame ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: 4,
                      background: favGame.coverColor || colors.navy,
                      flexShrink: 0, overflow: 'hidden', position: 'relative',
                    }}>
                      {favGame.coverUrl && (
                        <img
                          src={favGame.coverUrl}
                          alt={favGame.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
                        />
                      )}
                    </div>
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
              const isIgdb = String(id).startsWith('igdb_');
              const game = isIgdb ? wishlistIgdbGames[id] : getGameById(id);
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
                    background: game.coverColor || colors.navy,
                    flexShrink: 0,
                    overflow: 'hidden',
                    position: 'relative',
                  }}>
                    {game.coverUrl && (
                      <img
                        src={game.coverUrl}
                        alt={game.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
                      />
                    )}
                  </div>
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
