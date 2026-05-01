import { colors, fonts, card } from '../styles/theme';

function avgRating(reviewList) {
  if (!reviewList || reviewList.length === 0) return null;
  const sum = reviewList.reduce((a, r) => a + r.rating, 0);
  return (sum / reviewList.length).toFixed(1);
}

function StarDisplay({ rating, size = 12 }) {
  const full = Math.round(Number(rating));
  return (
    <span style={{ display: 'inline-flex', gap: 1 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{ color: colors.yellow, fontSize: size, lineHeight: 1 }}>
          {i <= full ? '★' : '☆'}
        </span>
      ))}
    </span>
  );
}

const GENRE_COLORS = {
  rpg:        { bg: '#EEE4F8', text: '#6B21A8' },
  fps:        { bg: '#FEE2CC', text: '#9A3412' },
  cozy:       { bg: '#DCFCE7', text: '#166534' },
  coop:       { bg: '#DBEAFE', text: '#1E40AF' },
  action:     { bg: '#FEE2E2', text: '#991B1B' },
  strategy:   { bg: '#CCFBF1', text: '#065F46' },
  sports:     { bg: '#F0FDF4', text: '#15803D' },
  puzzle:     { bg: '#FEFCE8', text: '#854D0E' },
  platformer: { bg: '#EFF6FF', text: '#1D4ED8' },
  horror:     { bg: '#F5F3FF', text: '#5B21B6' },
  simulation: { bg: '#CFFAFE', text: '#155E75' },
  fighting:   { bg: '#FFF1F2', text: '#9F1239' },
  racing:     { bg: '#FFF7ED', text: '#C2410C' },
  adventure:  { bg: '#EEF2FF', text: '#3730A3' },
  moba:       { bg: '#ECFDF5', text: '#047857' },
};

export default function GameCard({ game, reviews, onClick, isTop10 = false, isTopRated = false }) {
  const reviewList = reviews[game.id] || [];
  const avg = avgRating(reviewList);
  const gc = GENRE_COLORS[game.genre] || { bg: '#EEE', text: '#555' };

  return (
    <div
      onClick={onClick}
      style={{
        ...card,
        width: 160,
        minWidth: 160,
        cursor: 'pointer',
        transition: 'transform 0.15s, box-shadow 0.15s',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        overflow: 'hidden',
        padding: 0,
        position: 'relative',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Cover */}
      <div style={{
        height: 100,
        background: game.coverColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}>
        <span style={{
          fontFamily: fonts.heading,
          fontSize: 11,
          color: 'rgba(255,255,255,0.85)',
          textAlign: 'center',
          padding: '0 8px',
          lineHeight: 1.3,
          fontWeight: 700,
          letterSpacing: '0.2px',
          textShadow: '0 1px 3px rgba(0,0,0,0.4)',
        }}>
          {game.title}
        </span>

        {/* Top Rated badge — top-left */}
        {isTopRated && (
          <div style={{
            position: 'absolute',
            top: 5,
            left: 5,
            background: colors.yellow,
            color: '#1A1A1A',
            borderRadius: 4,
            padding: '2px 6px',
            fontSize: 9,
            fontWeight: 700,
            fontFamily: fonts.body,
            letterSpacing: '0.3px',
            textTransform: 'uppercase',
          }}>
            ★ Top Rated
          </div>
        )}

        {/* Avg rating pill — bottom-right */}
        {avg && (
          <div style={{
            position: 'absolute',
            bottom: 6,
            right: 6,
            background: 'rgba(0,0,0,0.6)',
            color: colors.yellow,
            borderRadius: 4,
            padding: '2px 6px',
            fontSize: 11,
            fontWeight: 700,
            fontFamily: fonts.body,
          }}>
            ★ {avg}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '10px 12px 12px', position: 'relative' }}>
        {/* Top 10 badge */}
        {isTop10 && (
          <div style={{
            position: 'absolute',
            top: -10,
            right: 10,
            background: colors.orange,
            color: colors.white,
            borderRadius: 4,
            padding: '2px 7px',
            fontSize: 9,
            fontWeight: 700,
            fontFamily: fonts.body,
            letterSpacing: '0.3px',
            textTransform: 'uppercase',
            boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
          }}>
            🏆 Top 10
          </div>
        )}

        <div style={{
          fontFamily: fonts.heading,
          fontSize: 13,
          fontWeight: 700,
          color: colors.text,
          lineHeight: 1.3,
          marginBottom: 6,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}>
          {game.title}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
          <span style={{
            background: gc.bg,
            color: gc.text,
            fontFamily: fonts.body,
            fontSize: 10,
            fontWeight: 700,
            padding: '2px 7px',
            borderRadius: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            {game.genreLabel}
          </span>
          <span style={{ fontFamily: fonts.body, fontSize: 11, color: colors.muted }}>
            {game.year}
          </span>
        </div>

        {reviewList.length > 0 && (
          <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
            <StarDisplay rating={avg} size={11} />
            <span style={{ fontFamily: fonts.body, fontSize: 10, color: colors.muted }}>
              ({reviewList.length})
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export { avgRating, StarDisplay, GENRE_COLORS };
