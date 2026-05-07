import { useState, useEffect } from 'react';
import { colors, fonts, card, button } from '../styles/theme';
import { supabase } from '../lib/supabase';
import { getGameById } from '../data/games';
import { getGameById as getIgdbGame } from '../lib/igdb';
import { GENRE_COLORS, StarDisplay } from '../components/GameCard';

function contrastFor(hex) {
  if (!hex) return '#1A1A1A';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b > 140 ? '#1A1A1A' : '#FFFFFF';
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

export default function ProfilePage({ userId, navigateTo }) {
  const [profile, setProfile] = useState(null);
  const [top10Ids, setTop10Ids] = useState([]);
  const [top10IgdbGames, setTop10IgdbGames] = useState({});
  const [reviews, setReviews] = useState([]);
  const [reviewGameInfo, setReviewGameInfo] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setLoading(true);
    setProfile(null);
    setTop10Ids([]);
    setReviews([]);
    setTop10IgdbGames({});
    setReviewGameInfo({});

    async function fetchAll() {
      const [profileRes, top10Res, reviewsRes] = await Promise.all([
        supabase.from('profiles').select('username, avatar_url, bg_color').eq('id', userId).single(),
        supabase.from('top10').select('game_id, rank').eq('user_id', userId).order('rank', { ascending: true }).limit(10),
        supabase.from('reviews').select('id, game_id, rating, body, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
      ]);
      if (cancelled) return;
      setProfile(profileRes.data || null);
      setTop10Ids((top10Res.data || []).map(r => r.game_id));
      setReviews(reviewsRes.data || []);
      setLoading(false);
    }
    fetchAll();
    return () => { cancelled = true; };
  }, [userId]);

  useEffect(() => {
    const igdbIds = [...new Set(top10Ids.filter(id => String(id).startsWith('igdb_')))];
    if (!igdbIds.length) return;
    Promise.all(igdbIds.map(id => getIgdbGame(id).then(g => g ? [id, g] : null)))
      .then(results => {
        const map = {};
        results.filter(Boolean).forEach(([id, g]) => { map[id] = g; });
        setTop10IgdbGames(prev => ({ ...prev, ...map }));
      });
  }, [top10Ids]);

  useEffect(() => {
    const igdbIds = [...new Set(reviews.map(r => r.game_id).filter(id => String(id).startsWith('igdb_')))];
    if (!igdbIds.length) return;
    Promise.all(igdbIds.map(id => getIgdbGame(id).then(g => g ? [id, g] : null)))
      .then(results => {
        const map = {};
        results.filter(Boolean).forEach(([id, g]) => { map[id] = g; });
        setReviewGameInfo(prev => ({ ...prev, ...map }));
      });
  }, [reviews]);

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

  const avatarBg = profile.bg_color || colors.navy;
  const avatarText = contrastFor(avatarBg);
  const initial = profile.username?.[0]?.toUpperCase() || '?';

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '28px 24px' }}>
      <button onClick={() => navigateTo('home')} style={{ ...button.ghost, padding: '6px 12px', fontSize: 13, marginBottom: 20 }}>
        ← Back
      </button>

      {/* Profile header */}
      <div style={{
        ...card,
        padding: '24px 28px',
        marginBottom: 24,
        background: profile.bg_color || colors.white,
        display: 'flex',
        alignItems: 'center',
        gap: 20,
      }}>
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={profile.username}
            style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: `3px solid ${avatarText === '#FFFFFF' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)'}` }}
          />
        ) : (
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: avatarText === '#FFFFFF' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: fonts.body, fontWeight: 700, fontSize: 26,
            color: avatarText, flexShrink: 0,
          }}>
            {initial}
          </div>
        )}
        <div>
          <div style={{ fontFamily: fonts.pixel, fontSize: 13, color: avatarText, lineHeight: 1.6 }}>
            {profile.username}
          </div>
        </div>
      </div>

      {/* Top 10 */}
      {top10Ids.length > 0 && (
        <div style={{ ...card, padding: '20px 24px', marginBottom: 24 }}>
          <SectionHeader>Top 10 Games</SectionHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {top10Ids.map((gameId, index) => {
              const game = String(gameId).startsWith('igdb_')
                ? top10IgdbGames[gameId]
                : getGameById(gameId);
              if (!game) return null;
              const gc = GENRE_COLORS[game.genre] || { bg: '#EEE', text: '#555' };
              return (
                <div
                  key={gameId}
                  onClick={() => navigateTo('game', game)}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', padding: '6px 8px', borderRadius: 6 }}
                  onMouseEnter={e => e.currentTarget.style.background = colors.lightBg}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ fontFamily: fonts.pixel, fontSize: 9, color: colors.muted, width: 20, textAlign: 'right', flexShrink: 0 }}>
                    {index + 1}
                  </span>
                  <div style={{
                    width: 36, height: 48, borderRadius: 5, flexShrink: 0,
                    background: game.coverColor || colors.navy,
                    overflow: 'hidden', position: 'relative',
                  }}>
                    {game.coverUrl && (
                      <img src={game.coverUrl} alt={game.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: fonts.body, fontWeight: 600, fontSize: 14, color: colors.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {game.title}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                      <span style={{ background: gc.bg, color: gc.text, fontFamily: fonts.body, fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 8, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                        {game.genreLabel || game.genre}
                      </span>
                      {game.year && (
                        <span style={{ fontFamily: fonts.body, fontSize: 12, color: colors.muted }}>{game.year}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Reviews */}
      {reviews.length > 0 && (
        <div style={{ ...card, padding: '20px 24px' }}>
          <SectionHeader>Recent Reviews</SectionHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {reviews.map(review => {
              const game = String(review.game_id).startsWith('igdb_')
                ? reviewGameInfo[review.game_id]
                : getGameById(review.game_id);
              return (
                <div
                  key={review.id}
                  onClick={() => game && navigateTo('game', game)}
                  style={{ display: 'flex', gap: 12, cursor: game ? 'pointer' : 'default', padding: '8px', borderRadius: 6, borderBottom: `1px solid ${colors.border}` }}
                  onMouseEnter={e => { if (game) e.currentTarget.style.background = colors.lightBg; }}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {game && (
                    <div style={{ width: 36, height: 48, borderRadius: 5, flexShrink: 0, background: game.coverColor || colors.navy, overflow: 'hidden', position: 'relative' }}>
                      {game.coverUrl && (
                        <img src={game.coverUrl} alt={game.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                      )}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontFamily: fonts.body, fontWeight: 600, fontSize: 13, color: colors.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {game?.title || review.game_id}
                      </span>
                      <StarDisplay rating={review.rating} size={12} />
                    </div>
                    {review.body && (
                      <p style={{ fontFamily: fonts.body, fontSize: 13, color: colors.muted, margin: 0, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {review.body}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {top10Ids.length === 0 && reviews.length === 0 && (
        <div style={{ ...card, padding: 32, textAlign: 'center', color: colors.muted, fontFamily: fonts.body, fontSize: 14 }}>
          This player hasn't added any games or reviews yet.
        </div>
      )}
    </div>
  );
}
