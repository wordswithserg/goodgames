import { useState, useEffect } from 'react';
import { colors, fonts, card, button } from '../styles/theme';
import { supabase } from '../lib/supabase';
import { games } from '../data/games';
import { getGameById as getIgdbGame } from '../lib/igdb';
import { GENRE_COLORS, StarDisplay } from '../components/GameCard';
import { useAuth } from '../contexts/AuthContext';

function contrastFor(hex) {
  if (!hex) return '#1A1A1A';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b > 140 ? '#1A1A1A' : '#FFFFFF';
}

function getLocalGame(id) {
  return games.find(g => String(g.id) === String(id)) || null;
}

function resolveGame(id, igdbMap) {
  if (!id) return null;
  return String(id).startsWith('igdb_') ? (igdbMap[id] || null) : getLocalGame(id);
}

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

function CoverThumb({ game, width = 32, height = 32, radius = 6 }) {
  return (
    <div style={{
      width, height, borderRadius: radius, flexShrink: 0,
      background: game.coverColor || colors.navy,
      overflow: 'hidden', position: 'relative',
    }}>
      {game.coverUrl && (
        <img src={game.coverUrl} alt={game.title} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
      )}
    </div>
  );
}

export default function ProfilePage({ userId, navigateTo }) {
  const { user, isLoggedIn } = useAuth();
  const [profile, setProfile] = useState(null);
  const [top10Ids, setTop10Ids] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [genreFavSlots, setGenreFavSlots] = useState([]);
  const [aboutAnswers, setAboutAnswers] = useState([]);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);

  // IGDB resolution maps
  const [igdbGames, setIgdbGames] = useState({});

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setLoading(true);
    setProfile(null);
    setTop10Ids([]);
    setReviews([]);
    setGenreFavSlots([]);
    setAboutAnswers([]);
    setWishlistIds([]);
    setIgdbGames({});

    async function fetchAll() {
      const [profileRes, top10Res, reviewsRes, genreFavsRes, aboutRes, wishlistRes, followersRes, myFollowRes] = await Promise.all([
        supabase.from('profiles').select('username, avatar_url, bg_color, now_playing_game_id').eq('id', userId).single(),
        supabase.from('top10').select('game_id, rank').eq('user_id', userId).order('rank', { ascending: true }).limit(10),
        supabase.from('reviews').select('id, game_id, rating, body, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(3),
        supabase.from('genre_favorites').select('genre, game_id, genre_id, genre_name').eq('user_id', userId),
        supabase.from('about_me').select('question_key, answer').eq('user_id', userId).limit(3),
        supabase.from('wishlist').select('game_id').eq('user_id', userId),
        supabase.from('follows').select('follower_id').eq('following_id', userId),
        user ? supabase.from('follows').select('follower_id').eq('follower_id', user.id).eq('following_id', userId).maybeSingle() : Promise.resolve({ data: null }),
      ]);
      if (cancelled) return;
      setProfile(profileRes.data || null);
      setTop10Ids((top10Res.data || []).map(r => r.game_id));
      setReviews(reviewsRes.data || []);
      setGenreFavSlots((genreFavsRes.data || []).sort((a, b) => a.genre - b.genre));
      setAboutAnswers((aboutRes.data || []).map(r => ({ question: r.question_key, answer: r.answer })));
      setWishlistIds((wishlistRes.data || []).map(r => r.game_id));
      setFollowerCount((followersRes.data || []).length);
      setIsFollowing(!!myFollowRes.data);
      setLoading(false);
    }
    fetchAll();
    return () => { cancelled = true; };
  }, [userId]);

  // Resolve all IGDB ids from all sections in one effect
  useEffect(() => {
    if (loading) return;
    const nowPlayingId = profile?.now_playing_game_id;
    const allIds = [
      ...(nowPlayingId && String(nowPlayingId).startsWith('igdb_') ? [nowPlayingId] : []),
      ...top10Ids.filter(id => String(id).startsWith('igdb_')),
      ...reviews.map(r => r.game_id).filter(id => String(id).startsWith('igdb_')),
      ...genreFavSlots.map(s => s.game_id).filter(id => id && String(id).startsWith('igdb_')),
      ...wishlistIds.filter(id => String(id).startsWith('igdb_')),
    ];
    const uniqueIds = [...new Set(allIds)];
    if (!uniqueIds.length) return;
    Promise.all(uniqueIds.map(id => getIgdbGame(id).then(g => g ? [id, g] : null)))
      .then(results => {
        const map = {};
        results.filter(Boolean).forEach(([id, g]) => { map[id] = g; });
        setIgdbGames(prev => ({ ...prev, ...map }));
      });
  }, [loading, profile?.now_playing_game_id, top10Ids, reviews, genreFavSlots, wishlistIds]); // eslint-disable-line

  async function toggleFollow() {
    if (!isLoggedIn) { navigateTo('player'); return; }
    const prev = isFollowing;
    setIsFollowing(!prev);
    setFollowerCount(c => prev ? c - 1 : c + 1);
    if (prev) {
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', userId);
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: userId });
    }
  }

  if (loading) return null;

  if (!profile) {
    return (
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px', textAlign: 'center' }}>
        <button onClick={() => navigateTo('home')} style={{ ...button.ghost, padding: '6px 12px', fontSize: 13, marginBottom: 24 }}>
          ← Back
        </button>
        <p style={{ fontFamily: fonts.body, fontSize: 15, color: colors.muted }}>User not found.</p>
      </div>
    );
  }

  const nowPlayingGame = resolveGame(profile.now_playing_game_id, igdbGames);
  const headerFg = contrastFor(profile.bg_color || null);
  const isHeaderDark = profile.bg_color && headerFg === '#FFFFFF';
  const initial = profile.username?.[0]?.toUpperCase() || '?';

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '28px 24px' }}>
      <button onClick={() => navigateTo('home')} style={{ ...button.ghost, padding: '6px 12px', fontSize: 13, marginBottom: 20 }}>
        ← Back
      </button>

      {/* Profile header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16,
        marginBottom: 24,
        ...(profile.bg_color ? {
          background: profile.bg_color,
          padding: '20px 24px',
          borderRadius: 12,
        } : {
          ...card,
          padding: '20px 24px',
        }),
      }}>
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt={profile.username} style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
        ) : (
          <div style={{
            width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
            background: isHeaderDark ? 'rgba(255,255,255,0.2)' : colors.navy,
            color: isHeaderDark ? headerFg : colors.white,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: fonts.heading, fontWeight: 700, fontSize: 22,
          }}>
            {initial}
          </div>
        )}
        <div>
          <h1 style={{ fontFamily: fonts.pixel, fontSize: 11, color: profile.bg_color ? headerFg : colors.text, margin: 0, lineHeight: 1.6 }}>
            {profile.username}
          </h1>
          <div style={{ fontFamily: fonts.body, fontSize: 13, color: profile.bg_color ? (isHeaderDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)') : colors.muted, marginTop: 2 }}>
            {top10Ids.length} in top 10 · {wishlistIds.length} wishlisted · {followerCount} {followerCount === 1 ? 'follower' : 'followers'}
          </div>
        </div>
        {isLoggedIn && user?.id !== userId && (
          <button
            onClick={toggleFollow}
            style={{ ...( isFollowing ? button.ghost : button.primary ), padding: '6px 16px', fontSize: 13, marginLeft: 'auto', flexShrink: 0 }}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </button>
        )}
      </div>

      {/* Now Playing */}
      {nowPlayingGame && (
        <div
          onClick={() => navigateTo('game', nowPlayingGame)}
          style={{ borderRadius: 12, overflow: 'hidden', height: 200, position: 'relative', background: nowPlayingGame.coverColor || colors.navy, marginBottom: 20, cursor: 'pointer' }}
        >
          {nowPlayingGame.coverUrl && (
            <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${nowPlayingGame.coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(14px)', transform: 'scale(1.12)' }} />
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.58)' }} />
          <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '18px 24px' }}>
            <div style={{ fontFamily: fonts.body, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'rgba(255,255,255,0.55)' }}>
              Now Playing
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <div style={{ width: 64, height: 86, borderRadius: 6, flexShrink: 0, background: nowPlayingGame.coverColor || colors.navy, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.6)' }}>
                {nowPlayingGame.coverUrl && <img src={nowPlayingGame.coverUrl} alt={nowPlayingGame.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
              </div>
              <div>
                <div style={{ fontFamily: fonts.pixel, fontSize: 11, color: colors.white, lineHeight: 1.8, marginBottom: 4 }}>{nowPlayingGame.title}</div>
                {nowPlayingGame.year && <div style={{ fontFamily: fonts.body, fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>{nowPlayingGame.year}</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top 10 */}
      {top10Ids.length > 0 && (
        <div style={{ ...card, padding: '20px 24px', marginBottom: 20 }}>
          <SectionHeader>Top 10 Games</SectionHeader>
          {top10Ids.map((id, idx) => {
            const game = resolveGame(id, igdbGames);
            if (!game) return null;
            const gc = GENRE_COLORS[game.genre] || { bg: '#EEE', text: '#555' };
            return (
              <div key={id} onClick={() => navigateTo('game', game)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: `1px solid ${colors.border}`, cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                <span style={{ fontFamily: fonts.heading, fontSize: 18, fontWeight: 700, color: colors.muted, width: 24, textAlign: 'right', flexShrink: 0 }}>{idx + 1}</span>
                <CoverThumb game={game} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: fonts.body, fontWeight: 600, fontSize: 14, color: colors.text }}>{game.title}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <span style={{ background: gc.bg, color: gc.text, fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 8, textTransform: 'uppercase', letterSpacing: '0.4px', fontFamily: fonts.body }}>{game.genreLabel}</span>
                    <span style={{ fontFamily: fonts.body, fontSize: 11, color: colors.muted }}>{game.year}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recent Reviews */}
      {reviews.length > 0 && (
        <div style={{ ...card, padding: '20px 24px', marginBottom: 20 }}>
          <SectionHeader>Recent Reviews</SectionHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {reviews.map(review => {
              const game = resolveGame(review.game_id, igdbGames);
              if (!game) return null;
              const gc = GENRE_COLORS[game.genre] || { bg: '#EEE', text: '#555' };
              return (
                <div key={review.id} onClick={() => navigateTo('game', game)} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', background: colors.lightBg, border: `1px solid ${colors.border}`, borderRadius: 8, cursor: 'pointer', transition: 'border-color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = colors.navy}
                  onMouseLeave={e => e.currentTarget.style.borderColor = colors.border}
                >
                  <CoverThumb game={game} width={36} height={36} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: fonts.body, fontWeight: 600, fontSize: 14, color: colors.text }}>{game.title}</span>
                      <span style={{ background: gc.bg, color: gc.text, fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 8, textTransform: 'uppercase', letterSpacing: '0.4px', fontFamily: fonts.body }}>{game.genreLabel}</span>
                      <span style={{ marginLeft: 'auto', fontFamily: fonts.body, fontSize: 11, color: colors.muted }}>{new Date(review.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    </div>
                    <div style={{ marginBottom: review.body ? 6 : 0 }}><StarDisplay rating={review.rating} size={13} /></div>
                    {review.body && (
                      <p style={{ fontFamily: fonts.body, fontSize: 13, color: colors.text, margin: 0, lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{review.body}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Genre Favorites */}
      {genreFavSlots.length > 0 && (
        <div style={{ ...card, padding: '20px 24px', marginBottom: 20 }}>
          <SectionHeader>Genre Favorites</SectionHeader>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {genreFavSlots.map(slot => {
              const favGame = resolveGame(slot.game_id, igdbGames);
              return (
                <div key={slot.genre} style={{ background: colors.lightBg, borderRadius: 8, padding: '12px 14px', border: `1px solid ${colors.border}` }}>
                  <div style={{ fontFamily: fonts.body, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8, color: slot.genre_name ? colors.navy : colors.muted }}>
                    {slot.genre_name || 'Genre'}
                  </div>
                  {favGame ? (
                    <div
                      onClick={() => navigateTo('game', favGame)}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                    >
                      <CoverThumb game={favGame} width={24} height={24} radius={4} />
                      <span style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 600, color: colors.text }}>{favGame.title}</span>
                    </div>
                  ) : (
                    <span style={{ fontFamily: fonts.body, fontSize: 13, color: colors.muted, fontStyle: 'italic' }}>Not set</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* About Me */}
      {aboutAnswers.length > 0 && (
        <div style={{ ...card, padding: '20px 24px', marginBottom: 20 }}>
          <SectionHeader>About Me</SectionHeader>
          {aboutAnswers.map((qa, idx) => (
            <div key={idx} style={{ marginBottom: idx < aboutAnswers.length - 1 ? 16 : 0 }}>
              <div style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 600, color: colors.navy, marginBottom: 3 }}>{qa.question}</div>
              <div style={{ fontFamily: fonts.body, fontSize: 14, color: qa.answer ? colors.text : colors.muted, fontStyle: qa.answer ? 'normal' : 'italic' }}>
                {qa.answer || 'Not answered yet.'}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Wishlist */}
      {wishlistIds.length > 0 && (
        <div style={{ ...card, padding: '20px 24px', marginBottom: 20 }}>
          <SectionHeader>Wishlist</SectionHeader>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {wishlistIds.map(id => {
              const game = resolveGame(id, igdbGames);
              if (!game) return null;
              const gc = GENRE_COLORS[game.genre] || { bg: '#EEE', text: '#555' };
              return (
                <div key={id} onClick={() => navigateTo('game', game)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: colors.lightBg, border: `1px solid ${colors.border}`, borderRadius: 8, padding: '8px 12px', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = colors.navy}
                  onMouseLeave={e => e.currentTarget.style.borderColor = colors.border}
                >
                  <CoverThumb game={game} width={22} height={22} radius={4} />
                  <span style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 600, color: colors.text }}>{game.title}</span>
                  <span style={{ background: gc.bg, color: gc.text, fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 8, textTransform: 'uppercase', letterSpacing: '0.4px', fontFamily: fonts.body }}>{game.genreLabel}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {top10Ids.length === 0 && reviews.length === 0 && genreFavSlots.length === 0 && aboutAnswers.length === 0 && wishlistIds.length === 0 && (
        <div style={{ ...card, padding: 32, textAlign: 'center', color: colors.muted, fontFamily: fonts.body, fontSize: 14 }}>
          This player hasn't filled out their profile yet.
        </div>
      )}
    </div>
  );
}
