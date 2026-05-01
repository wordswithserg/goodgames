import { useState, useEffect } from 'react';
import { colors, fonts, card, button, input } from '../styles/theme';
import { avgRating, StarDisplay, GENRE_COLORS } from '../components/GameCard';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const PLATFORM_ICONS = {
  'PC': '🖥', 'PS4': '🎮', 'PS5': '🎮', 'PS3': '🎮',
  'Xbox One': '🎮', 'Xbox Series X': '🎮', 'Xbox 360': '🎮',
  'Switch': '🕹', 'Mobile': '📱',
};

function PlatformBadge({ platform }) {
  return (
    <span style={{
      background: colors.lightBg,
      color: colors.text,
      fontFamily: fonts.body,
      fontSize: 12,
      padding: '3px 9px',
      borderRadius: 12,
      border: `1px solid ${colors.border}`,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
    }}>
      {PLATFORM_ICONS[platform] || '🎮'} {platform}
    </span>
  );
}

function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <span
          key={n}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
          style={{
            fontSize: 30,
            cursor: 'pointer',
            color: colors.yellow,
            transition: 'opacity 0.1s',
            opacity: n <= (hover || value) ? 1 : 0.3,
            lineHeight: 1,
            userSelect: 'none',
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function RatingBreakdown({ reviewList }) {
  if (reviewList.length === 0) return null;
  const counts = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviewList.filter(r => r.rating === star).length,
  }));
  const max = Math.max(...counts.map(c => c.count), 1);

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontFamily: fonts.body, fontSize: 12, fontWeight: 600, color: colors.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        Rating Breakdown
      </div>
      {counts.map(({ star, count }) => (
        <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontFamily: fonts.body, fontSize: 12, color: colors.yellow, width: 14, textAlign: 'right', flexShrink: 0 }}>
            {star}★
          </span>
          <div style={{
            flex: 1,
            height: 8,
            background: colors.lightBg,
            borderRadius: 4,
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${(count / max) * 100}%`,
              background: colors.orange,
              borderRadius: 4,
              transition: 'width 0.3s',
            }} />
          </div>
          <span style={{ fontFamily: fonts.body, fontSize: 11, color: colors.muted, width: 16, flexShrink: 0 }}>
            {count}
          </span>
        </div>
      ))}
    </div>
  );
}

function LoginPrompt({ navigateTo, action }) {
  return (
    <div style={{
      background: colors.lightBg,
      border: `1px solid ${colors.border}`,
      borderRadius: 8,
      padding: '14px 18px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    }}>
      <span style={{ fontFamily: fonts.body, fontSize: 14, color: colors.text }}>
        Log in on your Player page to {action}.
      </span>
      <button onClick={() => navigateTo('player')} style={button.primary}>
        Go to Player page
      </button>
    </div>
  );
}

// voteData: { up, down, mine }  onVote(reviewId, dir): handled by parent
function ReviewCard({ review, voteData = { up: 0, down: 0, mine: null }, onVote, isAuthor, onEdit }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editRating, setEditRating] = useState(review.rating);
  const [editBody, setEditBody] = useState(review.body || '');
  const [showOriginal, setShowOriginal] = useState(false);

  const isEdited = !!review.edited_at;
  const displayRating = showOriginal ? review.original_rating : review.rating;
  const displayBody = showOriginal ? review.original_body : review.body;

  function vote(dir) { if (onVote) onVote(review.id, dir); }

  function startEdit() {
    setEditRating(review.rating);
    setEditBody(review.body || '');
    setIsEditing(true);
  }

  function saveEdit() {
    if (!editRating) return;
    if (onEdit) onEdit(review.id, editRating, editBody);
    setIsEditing(false);
  }

  return (
    <div style={{ ...card, padding: '16px 20px', marginBottom: 12 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: colors.navy,
            color: colors.white,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: fonts.body,
            fontWeight: 700,
            fontSize: 14,
            flexShrink: 0,
          }}>
            {review.author[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontFamily: fonts.body, fontWeight: 600, fontSize: 14, color: colors.text }}>
              {review.author}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontFamily: fonts.body, fontSize: 12, color: colors.muted }}>
                {review.date}
              </span>
              {isEdited && !isEditing && (
                <span style={{ fontFamily: fonts.body, fontSize: 11, color: colors.muted, fontStyle: 'italic' }}>
                  · edited
                </span>
              )}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isAuthor && !isEditing && (
            <button
              onClick={startEdit}
              style={{ ...button.ghost, padding: '3px 10px', fontSize: 12 }}
            >
              Edit
            </button>
          )}
          {!isEditing && <StarDisplay rating={displayRating} size={15} />}
        </div>
      </div>

      {isEditing ? (
        <div>
          <div style={{ marginBottom: 10 }}>
            <StarPicker value={editRating} onChange={setEditRating} />
          </div>
          <textarea
            value={editBody}
            onChange={e => setEditBody(e.target.value)}
            rows={3}
            style={{ ...input.base, resize: 'vertical', fontFamily: fonts.body, fontSize: 14, lineHeight: 1.5, marginBottom: 10 }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={saveEdit} style={button.primary}>Save</button>
            <button onClick={() => setIsEditing(false)} style={button.ghost}>Cancel</button>
          </div>
        </div>
      ) : (
        <>
          {displayBody && (
            <p style={{
              fontFamily: fonts.body,
              fontSize: 14,
              color: showOriginal ? colors.muted : colors.text,
              margin: '0 0 10px',
              lineHeight: 1.65,
              fontStyle: showOriginal ? 'italic' : 'normal',
            }}>
              {displayBody}
            </p>
          )}

          {isEdited && (
            <button
              onClick={() => setShowOriginal(s => !s)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: fonts.body,
                fontSize: 12,
                color: colors.muted,
                padding: 0,
                marginBottom: 10,
                textDecoration: 'underline',
              }}
            >
              {showOriginal ? 'View current version' : 'View original'}
            </button>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => vote('up')}
              style={{
                ...button.ghost,
                padding: '4px 11px',
                fontSize: 12,
                background: voteData.mine === 'up' ? colors.navy : 'transparent',
                color: voteData.mine === 'up' ? colors.white : colors.navy,
              }}
            >
              👍{voteData.up > 0 ? ` ${voteData.up}` : ''}
            </button>
            <button
              onClick={() => vote('down')}
              style={{
                ...button.ghost,
                padding: '4px 11px',
                fontSize: 12,
                background: voteData.mine === 'down' ? '#C0392B' : 'transparent',
                color: voteData.mine === 'down' ? colors.white : colors.navy,
                borderColor: voteData.mine === 'down' ? '#C0392B' : colors.navy,
              }}
            >
              👎{voteData.down > 0 ? ` ${voteData.down}` : ''}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'highest', label: 'Highest Rated' },
  { value: 'lowest', label: 'Lowest Rated' },
];

export default function GamePage({ game, navigateTo }) {
  const { user, profile, isLoggedIn } = useAuth();
  const currentUser = profile?.username || null;

  const [reviewList, setReviewList] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isInTop10, setIsInTop10] = useState(false);
  // votes: { [reviewId]: { up, down, mine } }
  const [votes, setVotes] = useState({});

  const [rating, setRating] = useState(0);
  const [body, setBody] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [ratingError, setRatingError] = useState(false);
  const [sort, setSort] = useState('newest');

  // Fetch reviews for this game. Two queries: reviews then usernames.
  useEffect(() => {
    let cancelled = false;
    async function fetchReviews() {
      setReviewsLoading(true);
      const { data: rawReviews, error } = await supabase
        .from('reviews')
        .select('id, rating, body, created_at, user_id')
        .eq('game_id', game.id)
        .order('created_at', { ascending: false });

      if (cancelled) return;
      if (error) { console.error('[GamePage] fetch reviews:', error); setReviewsLoading(false); return; }
      if (!rawReviews || rawReviews.length === 0) { setReviewList([]); setReviewsLoading(false); return; }

      const userIds = [...new Set(rawReviews.map(r => r.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', userIds);

      if (cancelled) return;
      const usernameMap = {};
      (profiles || []).forEach(p => { usernameMap[p.id] = p.username; });

      setReviewList(rawReviews.map(r => ({
        id: r.id,
        author: usernameMap[r.user_id] || 'unknown',
        rating: r.rating,
        body: r.body,
        date: new Date(r.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        edited_at: null,
        original_rating: null,
        original_body: null,
      })));
      setReviewsLoading(false);
    }
    fetchReviews();
    return () => { cancelled = true; };
  }, [game.id]);

  // Fetch vote counts for all reviews of this game once reviews are loaded.
  useEffect(() => {
    if (reviewList.length === 0) { setVotes({}); return; }
    let cancelled = false;
    async function fetchVotes() {
      const ids = reviewList.map(r => r.id);
      const { data } = await supabase
        .from('review_votes')
        .select('review_id, user_id, vote')
        .in('review_id', ids);

      if (cancelled) return;
      const map = {};
      ids.forEach(id => { map[id] = { up: 0, down: 0, mine: null }; });
      (data || []).forEach(v => {
        if (!map[v.review_id]) return;
        if (v.vote === 'up') map[v.review_id].up++;
        if (v.vote === 'down') map[v.review_id].down++;
        if (user && v.user_id === user.id) map[v.review_id].mine = v.vote;
      });
      setVotes(map);
    }
    fetchVotes();
    return () => { cancelled = true; };
  }, [reviewList, user?.id]);

  // Fetch wishlist status for this game.
  useEffect(() => {
    if (!user) { setIsWishlisted(false); return; }
    let cancelled = false;
    supabase.from('wishlist').select('game_id').eq('user_id', user.id).eq('game_id', game.id).maybeSingle()
      .then(({ data }) => { if (!cancelled) setIsWishlisted(!!data); });
    return () => { cancelled = true; };
  }, [user?.id, game.id]);

  // Fetch whether this game is in the user's top 10 (for badge).
  useEffect(() => {
    if (!user) { setIsInTop10(false); return; }
    let cancelled = false;
    supabase.from('top10').select('game_id').eq('user_id', user.id).eq('game_id', game.id).maybeSingle()
      .then(({ data }) => { if (!cancelled) setIsInTop10(!!data); });
    return () => { cancelled = true; };
  }, [user?.id, game.id]);

  const avg = avgRating(reviewList);
  const gc = GENRE_COLORS[game.genre] || { bg: '#EEE', text: '#555' };

  const sortedReviews = [...reviewList].sort((a, b) => {
    if (sort === 'highest') return b.rating - a.rating;
    if (sort === 'lowest') return a.rating - b.rating;
    return 0;
  });

  async function toggleWishlist() {
    if (!isLoggedIn) { navigateTo('player'); return; }
    const prev = isWishlisted;
    setIsWishlisted(!prev);
    if (prev) {
      const { error } = await supabase.from('wishlist').delete()
        .eq('user_id', user.id).eq('game_id', game.id);
      if (error) { setIsWishlisted(prev); console.error('[GamePage] wishlist delete:', error); }
    } else {
      const { error } = await supabase.from('wishlist').insert({ user_id: user.id, game_id: game.id });
      if (error) { setIsWishlisted(prev); console.error('[GamePage] wishlist insert:', error); }
    }
  }

  async function submitReview() {
    if (!rating) { setRatingError(true); return; }
    setRatingError(false);
    const { data, error } = await supabase
      .from('reviews')
      .insert({ user_id: user.id, game_id: game.id, rating, body: body.trim() })
      .select('id, rating, body, created_at')
      .single();
    if (error) { console.error('[GamePage] submit review:', error); return; }
    setReviewList(prev => [{
      id: data.id,
      author: currentUser,
      rating: data.rating,
      body: data.body,
      date: new Date(data.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      edited_at: null,
      original_rating: null,
      original_body: null,
    }, ...prev]);
    setRating(0);
    setBody('');
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  }

  async function handleEdit(reviewId, newRating, newBody) {
    const review = reviewList.find(r => r.id === reviewId);
    if (!review) return;
    const trimmedBody = newBody.trim();
    const editedAt = new Date().toISOString();
    // Preserve the very first original across multiple edits.
    const originalRating = review.original_rating ?? review.rating;
    const originalBody = review.original_body !== null ? review.original_body : (review.body ?? null);

    const { error } = await supabase
      .from('reviews')
      .update({ rating: newRating, body: trimmedBody, original_rating: originalRating, original_body: originalBody, edited_at: editedAt })
      .eq('id', reviewId)
      .eq('user_id', user.id);

    if (error) { console.error('[GamePage] edit review:', error); return; }
    setReviewList(prev => prev.map(r => r.id === reviewId ? {
      ...r,
      rating: newRating,
      body: trimmedBody,
      edited_at: editedAt,
      original_rating: originalRating,
      original_body: originalBody,
    } : r));
  }

  // Optimistic vote: update local state immediately, then persist to Supabase.
  async function handleVote(reviewId, dir) {
    if (!isLoggedIn) return;
    const current = votes[reviewId] || { up: 0, down: 0, mine: null };
    const next = { ...current };
    if (current.mine === dir) {
      next[dir] = Math.max(0, next[dir] - 1);
      next.mine = null;
    } else {
      if (current.mine) next[current.mine] = Math.max(0, next[current.mine] - 1);
      next[dir] = next[dir] + 1;
      next.mine = dir;
    }
    setVotes(v => ({ ...v, [reviewId]: next }));

    console.log('[handleVote] payload', { user_id: user?.id, review_id: reviewId, vote: dir, toggling_off: current.mine === dir });

    if (current.mine === dir) {
      const { error } = await supabase.from('review_votes').delete()
        .eq('user_id', user.id).eq('review_id', reviewId);
      if (error) {
        console.error('[handleVote] delete error', { message: error.message, code: error.code, details: error.details, hint: error.hint });
        setVotes(v => ({ ...v, [reviewId]: current }));
      } else {
        console.log('[handleVote] delete ok');
      }
    } else {
      const row = { user_id: user.id, review_id: reviewId, vote: dir };
      console.log('[handleVote] upserting row', row);
      const { data, error } = await supabase.from('review_votes')
        .upsert(row, { onConflict: 'user_id,review_id' })
        .select();
      if (error) {
        console.error('[handleVote] upsert error', { message: error.message, code: error.code, details: error.details, hint: error.hint });
        setVotes(v => ({ ...v, [reviewId]: current }));
      } else {
        console.log('[handleVote] upsert ok, returned', data);
      }
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '28px 24px' }}>
      <button
        onClick={() => navigateTo('home')}
        style={{ ...button.ghost, padding: '6px 12px', fontSize: 13, marginBottom: 20 }}
      >
        ← Back to Games
      </button>

      {/* Game header */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 28, alignItems: 'flex-start' }}>
        <div style={{
          width: 120,
          height: 160,
          borderRadius: 10,
          background: game.coverColor,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          position: 'relative',
        }}>
          <span style={{
            fontFamily: fonts.heading,
            fontSize: 11,
            color: 'rgba(255,255,255,0.9)',
            textAlign: 'center',
            padding: '0 10px',
            lineHeight: 1.4,
            fontWeight: 700,
            textShadow: '0 1px 3px rgba(0,0,0,0.4)',
          }}>
            {game.title}
          </span>
          {isInTop10 && (
            <div style={{
              position: 'absolute',
              bottom: 8,
              left: '50%',
              transform: 'translateX(-50%)',
              background: colors.orange,
              color: colors.white,
              borderRadius: 4,
              padding: '2px 8px',
              fontSize: 9,
              fontWeight: 700,
              fontFamily: fonts.body,
              whiteSpace: 'nowrap',
              textTransform: 'uppercase',
            }}>
              🏆 Your Top 10
            </div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
            <h1 style={{
              fontFamily: fonts.heading,
              fontSize: 30,
              fontWeight: 700,
              color: colors.text,
              margin: 0,
              lineHeight: 1.2,
            }}>
              {game.title}
            </h1>
            {isLoggedIn ? (
              <button
                onClick={toggleWishlist}
                style={{
                  ...button.ghost,
                  borderColor: isWishlisted ? colors.orange : colors.navy,
                  color: isWishlisted ? colors.orange : colors.navy,
                  padding: '6px 14px',
                  fontSize: 13,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {isWishlisted ? '♥ Wishlisted' : '♡ Wishlist'}
              </button>
            ) : (
              <button
                onClick={() => navigateTo('player')}
                style={{
                  ...button.ghost,
                  padding: '6px 14px',
                  fontSize: 13,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                ♡ Wishlist
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{
              background: gc.bg,
              color: gc.text,
              fontFamily: fonts.body,
              fontSize: 12,
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: 10,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              {game.genreLabel}
            </span>
            <span style={{ fontFamily: fonts.body, fontSize: 14, color: colors.muted }}>
              {game.year}
            </span>
          </div>

          {avg ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <StarDisplay rating={avg} size={20} />
              <span style={{ fontFamily: fonts.body, fontWeight: 700, fontSize: 18, color: colors.text }}>
                {avg}
              </span>
              <span style={{ fontFamily: fonts.body, fontSize: 13, color: colors.muted }}>
                ({reviewList.length} review{reviewList.length !== 1 ? 's' : ''})
              </span>
            </div>
          ) : (
            <div style={{ fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginBottom: 12 }}>
              No reviews yet — be the first!
            </div>
          )}

          <p style={{
            fontFamily: fonts.body,
            fontSize: 15,
            color: colors.text,
            lineHeight: 1.7,
            margin: '0 0 14px',
          }}>
            {game.description}
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {game.platforms.map(p => <PlatformBadge key={p} platform={p} />)}
          </div>
        </div>
      </div>

      {/* Rating breakdown */}
      {reviewList.length >= 2 && (
        <div style={{ ...card, padding: '16px 20px', marginBottom: 24 }}>
          <RatingBreakdown reviewList={reviewList} />
        </div>
      )}

      {/* Review form */}
      <div style={{ ...card, padding: '20px 24px', marginBottom: 24 }}>
        <h2 style={{
          fontFamily: fonts.heading,
          fontSize: 18,
          fontWeight: 700,
          color: colors.text,
          margin: '0 0 16px',
        }}>
          Write a Review
        </h2>

        {!isLoggedIn ? (
          <LoginPrompt navigateTo={navigateTo} action="write a review" />
        ) : (
          <div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 600, color: colors.text, display: 'block', marginBottom: 6 }}>
                Your Rating
                {ratingError && (
                  <span style={{ color: '#C0392B', fontWeight: 400 }}> — please select a rating</span>
                )}
              </label>
              <StarPicker value={rating} onChange={v => { setRating(v); setRatingError(false); }} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 600, color: colors.text, display: 'block', marginBottom: 6 }}>
                Review <span style={{ fontWeight: 400, color: colors.muted }}>(optional)</span>
              </label>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Share your thoughts…"
                rows={4}
                style={{ ...input.base, resize: 'vertical', fontFamily: fonts.body, lineHeight: 1.5 }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={submitReview} style={button.primary}>Submit Review</button>
              {submitted && (
                <span style={{ fontFamily: fonts.body, fontSize: 13, color: '#2D7A4F' }}>
                  ✓ Review posted!
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Reviews feed */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <h2 style={{
            fontFamily: fonts.heading,
            fontSize: 18,
            fontWeight: 700,
            color: colors.text,
            margin: 0,
          }}>
            Reviews{' '}
            {reviewList.length > 0 && (
              <span style={{ color: colors.muted, fontSize: 14, fontFamily: fonts.body, fontWeight: 400 }}>
                ({reviewList.length})
              </span>
            )}
          </h2>

          {reviewList.length > 1 && (
            <div style={{ display: 'flex', gap: 4 }}>
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSort(opt.value)}
                  style={{
                    fontFamily: fonts.body,
                    fontSize: 12,
                    fontWeight: 600,
                    padding: '5px 12px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    border: `1px solid ${sort === opt.value ? colors.navy : colors.border}`,
                    background: sort === opt.value ? colors.navy : 'transparent',
                    color: sort === opt.value ? colors.white : colors.muted,
                    transition: 'all 0.1s',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {reviewsLoading ? (
          <div style={{ ...card, padding: 32, textAlign: 'center', color: colors.muted, fontFamily: fonts.body, fontSize: 14 }}>
            Loading reviews…
          </div>
        ) : reviewList.length === 0 ? (
          <div style={{ ...card, padding: 32, textAlign: 'center', color: colors.muted, fontFamily: fonts.body, fontSize: 14 }}>
            {isLoggedIn
              ? 'No reviews yet. Be the first to share your thoughts!'
              : 'No reviews yet.'}
          </div>
        ) : (
          sortedReviews.map(review => (
            <ReviewCard
              key={review.id}
              review={review}
              voteData={votes[review.id] || { up: 0, down: 0, mine: null }}
              onVote={isLoggedIn ? handleVote : undefined}
              isAuthor={review.author === currentUser}
              onEdit={isLoggedIn ? handleEdit : undefined}
            />
          ))
        )}
      </div>
    </div>
  );
}
