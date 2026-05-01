import { useState } from 'react';
import { colors, fonts, card, button, input } from '../styles/theme';
import { avgRating, StarDisplay, GENRE_COLORS } from '../components/GameCard';
import { useAuth } from '../contexts/AuthContext';

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

function ReviewCard({ review, gameId, reviewVotes, setReviewVotes }) {
  const key = `${review.author}__${review.date}__${review.rating}`;
  const voteData = reviewVotes[gameId]?.[key] || { up: 0, down: 0, mine: null };

  function vote(dir) {
    setReviewVotes(rv => {
      const gameVotes = rv[gameId] || {};
      const cur = gameVotes[key] || { up: 0, down: 0, mine: null };
      let next = { ...cur };
      if (cur.mine === dir) {
        // undo vote
        next[dir] = Math.max(0, next[dir] - 1);
        next.mine = null;
      } else {
        // switch or new vote
        if (cur.mine) next[cur.mine] = Math.max(0, next[cur.mine] - 1);
        next[dir] = next[dir] + 1;
        next.mine = dir;
      }
      return { ...rv, [gameId]: { ...gameVotes, [key]: next } };
    });
  }

  return (
    <div style={{ ...card, padding: '16px 20px', marginBottom: 12 }}>
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
            <div style={{ fontFamily: fonts.body, fontSize: 12, color: colors.muted }}>
              {review.date}
            </div>
          </div>
        </div>
        <StarDisplay rating={review.rating} size={15} />
      </div>

      {review.body && (
        <p style={{
          fontFamily: fonts.body,
          fontSize: 14,
          color: colors.text,
          margin: '0 0 12px',
          lineHeight: 1.65,
        }}>
          {review.body}
        </p>
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
    </div>
  );
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'highest', label: 'Highest Rated' },
  { value: 'lowest', label: 'Lowest Rated' },
];

export default function GamePage({
  game, reviews, setReviews,
  playerData, setPlayerData, reviewVotes, setReviewVotes, navigateTo,
}) {
  const { profile } = useAuth();
  const currentUser = profile?.username || null;
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [ratingError, setRatingError] = useState(false);
  const [sort, setSort] = useState('newest');

  const reviewList = reviews[game.id] || [];
  const avg = avgRating(reviewList);
  const gc = GENRE_COLORS[game.genre] || { bg: '#EEE', text: '#555' };

  const userData = currentUser ? (playerData[currentUser] || {}) : {};
  const wishlist = userData.wishlist || [];
  const isWishlisted = wishlist.includes(game.id);

  const sortedReviews = [...reviewList].sort((a, b) => {
    if (sort === 'highest') return b.rating - a.rating;
    if (sort === 'lowest') return a.rating - b.rating;
    return 0; // newest = already newest-first from submission order
  });

  const userTop10 = currentUser ? (playerData[currentUser]?.top10 || []) : [];
  const isInTop10 = userTop10.includes(game.id);

  function toggleWishlist() {
    setPlayerData(pd => {
      const user = pd[currentUser] || {};
      const wl = user.wishlist || [];
      return {
        ...pd,
        [currentUser]: {
          ...user,
          wishlist: isWishlisted ? wl.filter(id => id !== game.id) : [...wl, game.id],
        },
      };
    });
  }

  function submitReview() {
    if (!rating) { setRatingError(true); return; }
    setRatingError(false);
    const review = {
      author: currentUser,
      rating,
      body: body.trim(),
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
    };
    setReviews(r => ({ ...r, [game.id]: [review, ...(r[game.id] || [])] }));
    setRating(0);
    setBody('');
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
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
            {currentUser ? (
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

        {!currentUser ? (
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

        {reviewList.length === 0 ? (
          <div style={{ ...card, padding: 32, textAlign: 'center', color: colors.muted, fontFamily: fonts.body, fontSize: 14 }}>
            {currentUser
              ? 'No reviews yet. Be the first to share your thoughts!'
              : 'No reviews yet.'}
          </div>
        ) : (
          sortedReviews.map((review, i) => (
            <ReviewCard
              key={i}
              review={review}
              gameId={game.id}
              reviewVotes={reviewVotes}
              setReviewVotes={setReviewVotes}
            />
          ))
        )}
      </div>
    </div>
  );
}
