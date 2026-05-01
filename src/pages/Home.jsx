import { useState } from 'react';
import { colors, fonts, input } from '../styles/theme';
import { games, curatedGames, genreSections } from '../data/games';
import { grossingGames } from '../data/grossingGames';
import GameCard, { avgRating } from '../components/GameCard';

const GENRE_ACCENT = {
  rpg: colors.navy,
  fps: colors.orange,
  cozy: '#2D7A4F',
  coop: '#1565C0',
};

function findTopRatedId(sectionGames, reviews) {
  let best = null;
  let bestAvg = -1;
  sectionGames.forEach(g => {
    const avg = avgRating(reviews[g.id]);
    if (avg !== null && Number(avg) > bestAvg) {
      bestAvg = Number(avg);
      best = g.id;
    }
  });
  return best;
}

// Resolve grossing game entries — use curated version if it exists (dedup)
const curatedByTitle = {};
curatedGames.forEach(g => { curatedByTitle[g.title.toLowerCase()] = g; });
const resolvedGrossing = grossingGames.map(
  g => curatedByTitle[g.title.toLowerCase()] || g
);

export default function Home({ reviews, navigateTo, currentUser, playerData }) {
  const [search, setSearch] = useState('');
  const [expandedGenres, setExpandedGenres] = useState({});

  const userTop10 = (currentUser && playerData[currentUser]?.top10) || [];

  const filtered = search.trim()
    ? games.filter(g => g.title.toLowerCase().includes(search.trim().toLowerCase()))
    : [];

  const isSearching = search.trim().length > 0;

  function toggleExpand(key) {
    setExpandedGenres(e => ({ ...e, [key]: !e[key] }));
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
      {/* Hero */}
      {!isSearching && (
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <h1 style={{
            fontFamily: fonts.heading,
            fontSize: 36,
            fontWeight: 700,
            color: colors.text,
            margin: '0 0 8px',
            letterSpacing: '-0.5px',
          }}>
            Your games, your squad, your story.
          </h1>
          <p style={{
            fontFamily: fonts.body,
            fontSize: 16,
            color: colors.muted,
            margin: 0,
          }}>
            Catalog what you've played, share reviews, and find your next game with friends.
          </p>
        </div>
      )}

      {/* Search */}
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'center' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: 520 }}>
          <span style={{
            position: 'absolute',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            color: colors.muted,
            fontSize: 16,
            pointerEvents: 'none',
          }}>
            🔍
          </span>
          <input
            type="text"
            placeholder="Search games…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              ...input.base,
              paddingLeft: 38,
              fontSize: 16,
              height: 46,
              borderRadius: 10,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: colors.muted,
                cursor: 'pointer',
                fontSize: 18,
                lineHeight: 1,
                padding: 0,
              }}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {isSearching ? (
        <div>
          <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.muted, marginBottom: 16 }}>
            {filtered.length} result{filtered.length !== 1 ? 's' : ''} for "{search}"
          </p>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48, color: colors.muted, fontFamily: fonts.body }}>
              No games found. Try a different search.
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
              {filtered.map(game => (
                <GameCard
                  key={game.id}
                  game={game}
                  reviews={reviews}
                  onClick={() => navigateTo('game', game)}
                  isTop10={userTop10.includes(game.id)}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
          {genreSections.map(section => {
            const sectionGames = curatedGames.filter(g => g.genre === section.key);
            const accent = GENRE_ACCENT[section.key];
            const expanded = expandedGenres[section.key];
            const topRatedId = findTopRatedId(sectionGames, reviews);

            return (
              <div key={section.key}>
                {/* Section header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  marginBottom: 16,
                }}>
                  <div style={{ width: 4, height: 24, background: accent, borderRadius: 2 }} />
                  <h2 style={{
                    fontFamily: fonts.heading,
                    fontSize: 22,
                    fontWeight: 700,
                    color: colors.text,
                    margin: 0,
                  }}>
                    {section.label}
                  </h2>
                  <span style={{ fontFamily: fonts.body, fontSize: 13, color: colors.muted }}>
                    {sectionGames.length} games
                  </span>
                  <button
                    onClick={() => toggleExpand(section.key)}
                    style={{
                      marginLeft: 'auto',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: fonts.body,
                      fontSize: 13,
                      fontWeight: 600,
                      color: accent,
                      padding: '4px 8px',
                      borderRadius: 6,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    {expanded ? 'Show less ↑' : `See all ${sectionGames.length} →`}
                  </button>
                </div>

                {/* Cards — scroll row or grid */}
                {expanded ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                    {sectionGames.map(game => (
                      <GameCard
                        key={game.id}
                        game={game}
                        reviews={reviews}
                        onClick={() => navigateTo('game', game)}
                        isTop10={userTop10.includes(game.id)}
                        isTopRated={game.id === topRatedId}
                      />
                    ))}
                  </div>
                ) : (
                  <div style={{
                    display: 'flex',
                    gap: 16,
                    overflowX: 'auto',
                    paddingBottom: 12,
                    scrollbarWidth: 'thin',
                    scrollbarColor: `${colors.border} transparent`,
                  }}>
                    {sectionGames.map(game => (
                      <GameCard
                        key={game.id}
                        game={game}
                        reviews={reviews}
                        onClick={() => navigateTo('game', game)}
                        isTop10={userTop10.includes(game.id)}
                        isTopRated={game.id === topRatedId}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* ── Top Grossing Games ── */}
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 16,
            }}>
              <div style={{ width: 4, height: 24, background: colors.yellow, borderRadius: 2 }} />
              <h2 style={{
                fontFamily: fonts.heading,
                fontSize: 22,
                fontWeight: 700,
                color: colors.text,
                margin: 0,
              }}>
                Top Grossing
              </h2>
              <span style={{
                background: colors.yellow,
                color: '#1A1A1A',
                fontFamily: fonts.body,
                fontSize: 10,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                All-time
              </span>
              <span style={{ fontFamily: fonts.body, fontSize: 13, color: colors.muted }}>
                {resolvedGrossing.length} games
              </span>
            </div>
            <div style={{
              display: 'flex',
              gap: 16,
              overflowX: 'auto',
              paddingBottom: 12,
              scrollbarWidth: 'thin',
              scrollbarColor: `${colors.border} transparent`,
            }}>
              {resolvedGrossing.map(game => (
                <GameCard
                  key={game.id}
                  game={game}
                  reviews={reviews}
                  onClick={() => navigateTo('game', game)}
                  isTop10={userTop10.includes(game.id)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
