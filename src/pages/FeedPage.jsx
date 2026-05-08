import { useState, useEffect } from 'react';
import { colors, fonts, card, button } from '../styles/theme';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getGameById as getLocalGame } from '../data/games';
import { getGameById as getIgdbGame } from '../lib/igdb';
import { GENRE_COLORS, StarDisplay } from '../components/GameCard';

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function Avatar({ name, size = 32 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: colors.navy, color: colors.white,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: fonts.body, fontWeight: 700, fontSize: Math.floor(size * 0.4),
    }}>
      {(name || '?')[0].toUpperCase()}
    </div>
  );
}

function ActionLabel({ item }) {
  if (item.type === 'review') {
    return <span>reviewed a game</span>;
  }
  if (item.type === 'wishlist') {
    return <span>wishlisted a game</span>;
  }
  return <span>added a game to their Top 10{item.rank ? ` (#${item.rank})` : ''}</span>;
}

function FeedCard({ item, navigateTo }) {
  const gc = item.game ? (GENRE_COLORS[item.game.genre] || { bg: '#EEE', text: '#555' }) : { bg: '#EEE', text: '#555' };
  return (
    <div style={{ ...card, padding: '14px 18px', marginBottom: 12 }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <Avatar name={item.username} size={32} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <span
            onClick={e => { e.stopPropagation(); navigateTo('profile', { id: item.user_id, username: item.username }); }}
            style={{ fontFamily: fonts.body, fontWeight: 600, fontSize: 14, color: colors.text, cursor: 'pointer' }}
            onMouseEnter={e => e.target.style.textDecoration = 'underline'}
            onMouseLeave={e => e.target.style.textDecoration = 'none'}
          >
            {item.username}
          </span>
          <span style={{ fontFamily: fonts.body, fontSize: 13, color: colors.muted }}> · <ActionLabel item={item} /></span>
        </div>
        <span style={{ fontFamily: fonts.body, fontSize: 11, color: colors.muted, flexShrink: 0 }}>
          {timeAgo(item.created_at)}
        </span>
      </div>

      {/* Game row */}
      {item.game && (
        <div
          onClick={() => navigateTo('game', item.game)}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 8,
            background: colors.lightBg, border: `1px solid ${colors.border}`,
            cursor: 'pointer',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = colors.navy}
          onMouseLeave={e => e.currentTarget.style.borderColor = colors.border}
        >
          <div style={{
            width: 40, height: 40, borderRadius: 6, flexShrink: 0,
            background: item.game.coverColor || colors.navy,
            overflow: 'hidden', position: 'relative',
          }}>
            {item.game.coverUrl && (
              <img src={item.game.coverUrl} alt={item.game.title} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: fonts.body, fontWeight: 600, fontSize: 14, color: colors.text }}>
                {item.game.title}
              </span>
              {item.game.genre && (
                <span style={{
                  background: gc.bg, color: gc.text,
                  fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 8,
                  textTransform: 'uppercase', letterSpacing: '0.4px', fontFamily: fonts.body,
                }}>
                  {item.game.genreLabel || item.game.genre}
                </span>
              )}
            </div>
            {item.type === 'review' && (
              <div style={{ marginTop: 4 }}>
                <StarDisplay rating={item.rating} size={12} />
                {item.body && (
                  <p style={{
                    fontFamily: fonts.body, fontSize: 13, color: colors.muted,
                    margin: '4px 0 0', lineHeight: 1.5,
                    overflow: 'hidden', display: '-webkit-box',
                    WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  }}>
                    {item.body}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function FeedPage({ navigateTo }) {
  const { user, isLoggedIn, loading: authLoading } = useAuth();
  const [feedItems, setFeedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasFollows, setHasFollows] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn || !user) { setLoading(false); return; }

    let cancelled = false;
    async function loadFeed() {
      setLoading(true);

      // 1. Get following list
      const { data: followRows } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

      if (cancelled) return;
      const followingIds = (followRows || []).map(r => r.following_id);
      if (!followingIds.length) {
        setHasFollows(false);
        setLoading(false);
        return;
      }
      setHasFollows(true);

      // 2. Fetch activity from all three tables in parallel
      const [{ data: reviewRows }, { data: wishlistRows }, { data: top10Rows }] = await Promise.all([
        supabase.from('reviews')
          .select('id, user_id, game_id, rating, body, created_at')
          .in('user_id', followingIds)
          .order('created_at', { ascending: false })
          .limit(40),
        supabase.from('wishlist')
          .select('user_id, game_id, created_at')
          .in('user_id', followingIds)
          .order('created_at', { ascending: false })
          .limit(40),
        supabase.from('top10')
          .select('user_id, game_id, rank, created_at')
          .in('user_id', followingIds)
          .order('created_at', { ascending: false })
          .limit(40),
      ]);
      if (cancelled) return;

      // 3. Resolve usernames
      const allUserIds = [...new Set([
        ...(reviewRows || []).map(r => r.user_id),
        ...(wishlistRows || []).map(r => r.user_id),
        ...(top10Rows || []).map(r => r.user_id),
      ])];
      const { data: profileRows } = await supabase
        .from('profiles').select('id, username').in('id', allUserIds);
      if (cancelled) return;
      const usernameMap = Object.fromEntries((profileRows || []).map(p => [p.id, p.username]));

      // 4. Merge and sort
      const raw = [
        ...(reviewRows || []).map(r => ({ type: 'review', id: r.id, user_id: r.user_id, game_id: r.game_id, rating: r.rating, body: r.body, created_at: r.created_at })),
        ...(wishlistRows || []).map(r => ({ type: 'wishlist', id: `${r.user_id}-${r.game_id}`, user_id: r.user_id, game_id: r.game_id, created_at: r.created_at })),
        ...(top10Rows || []).map(r => ({ type: 'top10', id: `${r.user_id}-${r.game_id}`, user_id: r.user_id, game_id: r.game_id, rank: r.rank, created_at: r.created_at })),
      ];
      raw.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      const merged = raw.slice(0, 50).map(item => ({
        ...item,
        username: usernameMap[item.user_id] || 'unknown',
        game: null,
      }));

      setFeedItems(merged);
      setLoading(false);

      // 5. Resolve game info (async, updates cards as they load)
      const uniqueGameIds = [...new Set(merged.map(i => i.game_id))];
      const localResolved = {};
      const igdbIds = [];
      for (const id of uniqueGameIds) {
        if (String(id).startsWith('igdb_')) {
          igdbIds.push(id);
        } else {
          const g = getLocalGame(id);
          if (g) localResolved[id] = g;
        }
      }

      // Apply local games immediately
      if (Object.keys(localResolved).length) {
        setFeedItems(prev => prev.map(item => localResolved[item.game_id] ? { ...item, game: localResolved[item.game_id] } : item));
      }

      // Fetch IGDB games and apply progressively
      if (igdbIds.length) {
        const igdbResults = await Promise.all(igdbIds.map(id => getIgdbGame(id).then(g => [id, g])));
        if (cancelled) return;
        const igdbMap = Object.fromEntries(igdbResults.filter(([, g]) => g).map(([id, g]) => [id, g]));
        if (Object.keys(igdbMap).length) {
          setFeedItems(prev => prev.map(item => igdbMap[item.game_id] ? { ...item, game: igdbMap[item.game_id] } : item));
        }
      }
    }

    loadFeed();
    return () => { cancelled = true; };
  }, [user, isLoggedIn, authLoading]);

  if (authLoading || (isLoggedIn && loading)) {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
        <p style={{ fontFamily: fonts.body, color: colors.muted }}>Loading feed…</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
        <p style={{ fontFamily: fonts.body, fontSize: 15, color: colors.text, marginBottom: 16 }}>
          Sign in to follow players and see their activity here.
        </p>
        <button onClick={() => navigateTo('player')} style={button.primary}>Sign In</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '28px 24px' }}>
      <h1 style={{ fontFamily: fonts.pixel, fontSize: 11, color: colors.text, margin: '0 0 24px' }}>My Feed</h1>

      {!hasFollows ? (
        <div style={{ ...card, padding: '32px 24px', textAlign: 'center' }}>
          <p style={{ fontFamily: fonts.body, fontSize: 15, color: colors.text, marginBottom: 8 }}>
            Your feed is empty.
          </p>
          <p style={{ fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginBottom: 0 }}>
            Search for players in the nav bar and follow them to see their reviews, wishlists, and Top 10s here.
          </p>
        </div>
      ) : feedItems.length === 0 ? (
        <div style={{ ...card, padding: '32px 24px', textAlign: 'center' }}>
          <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.muted }}>
            No activity yet from the people you follow.
          </p>
        </div>
      ) : (
        feedItems.map(item => (
          <FeedCard key={item.id} item={item} navigateTo={navigateTo} />
        ))
      )}
    </div>
  );
}
