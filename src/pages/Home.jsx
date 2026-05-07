import { useState, useEffect } from 'react';
import { colors, fonts, input, card, button } from '../styles/theme';
import GameCard from '../components/GameCard';
import { searchGames, fetchGenreGames, fetchThemeGames, fetchYearGames } from '../lib/igdb';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const GENRE_ROWS = [
  { key: 'rpg',      label: 'RPG',      accent: colors.navy,   type: 'genre', id: 12 },
  { key: 'shooter',  label: 'Shooter',  accent: colors.orange, type: 'genre', id: 5  },
  { key: 'puzzle',   label: 'Puzzle',   accent: '#854D0E',     type: 'genre', id: 9  },
  { key: 'strategy', label: 'Strategy', accent: '#065F46',     type: 'genre', id: 15 },
  { key: 'horror',   label: 'Horror',   accent: '#5B21B6',     type: 'theme', id: 19 },
];

const YEARS = Array.from({ length: 2025 - 1980 + 1 }, (_, i) => 2025 - i);

function SkeletonRow() {
  return (
    <div style={{
      display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 12,
      scrollbarWidth: 'thin', scrollbarColor: `${colors.border} transparent`,
    }}>
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} style={{
          width: 160, minWidth: 160, height: 222, borderRadius: 8,
          background: colors.border, flexShrink: 0, opacity: 0.45,
        }} />
      ))}
    </div>
  );
}

export default function Home({ navigateTo, currentUser }) {
  const { profile, user } = useAuth();
  const isCurator = profile?.is_curator === true;

  const [search, setSearch] = useState('');
  const [igdbResults, setIgdbResults] = useState([]);
  const [igdbLoading, setIgdbLoading] = useState(false);

  const [genreGames, setGenreGames] = useState({});
  const [genreLoading, setGenreLoading] = useState(
    Object.fromEntries(GENRE_ROWS.map(r => [r.key, true]))
  );
  const [expandedRows, setExpandedRows] = useState({});

  const [selectedYear, setSelectedYear] = useState('');
  const [yearGames, setYearGames] = useState([]);
  const [yearLoading, setYearLoading] = useState(false);

  const [blockedIds, setBlockedIds] = useState(new Set());
  const [blockedList, setBlockedList] = useState([]);

  const isSearching = search.trim().length > 0;
  const userTop10 = [];

  // Fetch blocklist on mount — used to filter results for all users.
  useEffect(() => {
    supabase.from('blocked_games').select('game_id')
      .then(({ data }) => {
        if (data) setBlockedIds(new Set(data.map(r => r.game_id)));
      });
  }, []);

  // Fetch full blocklist rows for curator review panel.
  useEffect(() => {
    if (!isCurator) return;
    supabase.from('blocked_games').select('game_id, title, blocked_at')
      .order('blocked_at', { ascending: false })
      .then(({ data }) => { if (data) setBlockedList(data); });
  }, [isCurator]);

  // Fetch all genre rows on mount — each resolves independently.
  useEffect(() => {
    GENRE_ROWS.forEach(row => {
      const fetch = row.type === 'theme'
        ? fetchThemeGames(row.id, row.label)
        : fetchGenreGames(row.id);
      fetch
        .then(games => setGenreGames(prev => ({ ...prev, [row.key]: games })))
        .catch(() => setGenreGames(prev => ({ ...prev, [row.key]: [] })))
        .finally(() => setGenreLoading(prev => ({ ...prev, [row.key]: false })));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch games for the selected year.
  useEffect(() => {
    if (!selectedYear) { setYearGames([]); return; }
    setYearLoading(true);
    fetchYearGames(Number(selectedYear))
      .then(games => setYearGames(games))
      .catch(() => setYearGames([]))
      .finally(() => setYearLoading(false));
  }, [selectedYear]);

  // Debounced IGDB search — filters blocked games from results.
  useEffect(() => {
    const q = search.trim();
    if (!q) { setIgdbResults([]); setIgdbLoading(false); return; }
    setIgdbLoading(true);
    const t = setTimeout(() => {
      searchGames(q)
        .then(results => setIgdbResults(results.filter(g => !blockedIds.has(g.id))))
        .catch(() => setIgdbResults([]))
        .finally(() => setIgdbLoading(false));
    }, 350);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, blockedIds]);

  async function blockGame(game) {
    setIgdbResults(prev => prev.filter(g => g.id !== game.id));
    setBlockedIds(prev => new Set([...prev, game.id]));
    setBlockedList(prev => [{ game_id: game.id, title: game.title, blocked_at: new Date().toISOString() }, ...prev]);
    await supabase.from('blocked_games').insert({ game_id: game.id, title: game.title, blocked_by: user?.id });
  }

  async function restoreGame(gameId) {
    setBlockedList(prev => prev.filter(e => e.game_id !== gameId));
    setBlockedIds(prev => { const next = new Set(prev); next.delete(gameId); return next; });
    await supabase.from('blocked_games').delete().eq('game_id', gameId);
  }

  function GameCardWithBlock({ game }) {
    return (
      <div style={{ position: 'relative' }}>
        <GameCard
          game={game}
          onClick={() => navigateTo('game', game)}
          isTop10={userTop10.includes(game.id)}
        />
        {isCurator && game.id.startsWith('igdb_') && (
          <button
            onClick={e => { e.stopPropagation(); blockGame(game); }}
            title="Block this game"
            style={{
              position: 'absolute', top: 6, right: 6,
              background: 'rgba(0,0,0,0.65)', border: 'none', borderRadius: 4,
              color: '#fff', cursor: 'pointer', padding: '3px 7px', fontSize: 13,
              lineHeight: 1, zIndex: 10,
            }}
          >
            ✕
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="home-container" style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>

      {/* Hero */}
      {!isSearching && (
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <h1 style={{
            fontFamily: fonts.pixel, fontSize: 11,
            color: colors.text, margin: '0 0 8px', lineHeight: 1.8,
          }}>
            Your games, your squad, your story.
          </h1>
          <p style={{ fontFamily: fonts.body, fontSize: 16, color: colors.muted, margin: 0 }}>
            Catalog what you've played, share reviews, and find your next game with friends.
          </p>
        </div>
      )}

      {/* Search bar */}
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'center' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: 520 }}>
          <span style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            color: colors.muted, fontSize: 16, pointerEvents: 'none',
          }}>
            🔍
          </span>
          <input
            type="text"
            placeholder="Search games…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              ...input.base, paddingLeft: 38, fontSize: 16,
              height: 46, borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: colors.muted,
                cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 0,
              }}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* ── Search results ── */}
      {isSearching ? (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.muted, margin: 0 }}>
              {igdbLoading
                ? `Searching IGDB for "${search}"…`
                : `${igdbResults.length} result${igdbResults.length !== 1 ? 's' : ''} for "${search}"`}
            </p>
            {!igdbLoading && igdbResults.length > 0 && (
              <span style={{
                fontFamily: fonts.body, fontSize: 11, fontWeight: 700,
                background: colors.navy, color: colors.white,
                padding: '2px 8px', borderRadius: 10, letterSpacing: '0.4px',
              }}>
                IGDB
              </span>
            )}
            {isCurator && !igdbLoading && igdbResults.length > 0 && (
              <span style={{ fontFamily: fonts.body, fontSize: 11, color: colors.muted, fontStyle: 'italic' }}>
                — click ✕ to block a game
              </span>
            )}
          </div>
          {igdbLoading ? (
            <SkeletonRow />
          ) : igdbResults.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48, color: colors.muted, fontFamily: fonts.body }}>
              No games found. Try a different search.
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
              {igdbResults.map(game => (
                <GameCardWithBlock key={game.id} game={game} />
              ))}
            </div>
          )}
        </div>

      ) : (

        /* ── Browse content ── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>

          {/* Genre rows */}
          {GENRE_ROWS.map(row => {
            const games = (genreGames[row.key] || []).filter(g => !blockedIds.has(g.id));
            const loading = genreLoading[row.key];
            const expanded = expandedRows[row.key];

            return (
              <div key={row.key}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 4, height: 24, background: row.accent, borderRadius: 2 }} />
                  <h2 style={{
                    fontFamily: fonts.pixel, fontSize: 11,
                    color: colors.text, margin: 0,
                  }}>
                    {row.label}
                  </h2>
                  {!loading && (
                    <>
                      <span style={{ fontFamily: fonts.body, fontSize: 13, color: colors.muted }}>
                        {games.length} games
                      </span>
                      <button
                        onClick={() => setExpandedRows(e => ({ ...e, [row.key]: !e[row.key] }))}
                        style={{
                          marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer',
                          fontFamily: fonts.body, fontSize: 13, fontWeight: 600, color: row.accent,
                          padding: '4px 8px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4,
                        }}
                      >
                        {expanded ? 'Show less ↑' : `See all ${games.length} →`}
                      </button>
                    </>
                  )}
                </div>

                {loading ? (
                  <SkeletonRow />
                ) : expanded ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                    {games.map(game => (
                      <GameCardWithBlock key={game.id} game={game} />
                    ))}
                  </div>
                ) : (
                  <div style={{
                    display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 12,
                    scrollbarWidth: 'thin', scrollbarColor: `${colors.border} transparent`,
                  }}>
                    {games.map(game => (
                      <GameCardWithBlock key={game.id} game={game} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Browse by Year */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <div style={{ width: 4, height: 24, background: colors.yellow, borderRadius: 2 }} />
              <h2 style={{
                fontFamily: fonts.pixel, fontSize: 11,
                color: colors.text, margin: 0,
              }}>
                Browse by Year
              </h2>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(e.target.value)}
                style={{
                  ...input.base, width: 'auto', fontSize: 14,
                  padding: '6px 12px', borderRadius: 8, cursor: 'pointer',
                }}
              >
                <option value="">— Pick a year —</option>
                {YEARS.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              {selectedYear && !yearLoading && yearGames.length > 0 && (
                <span style={{ fontFamily: fonts.body, fontSize: 13, color: colors.muted }}>
                  {yearGames.filter(g => !blockedIds.has(g.id)).length} games
                </span>
              )}
            </div>

            {yearLoading ? (
              <SkeletonRow />
            ) : yearGames.length > 0 ? (
              <div style={{
                display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 12,
                scrollbarWidth: 'thin', scrollbarColor: `${colors.border} transparent`,
              }}>
                {yearGames.filter(g => !blockedIds.has(g.id)).map(game => (
                  <GameCardWithBlock key={game.id} game={game} />
                ))}
              </div>
            ) : selectedYear ? (
              <div style={{ fontFamily: fonts.body, fontSize: 14, color: colors.muted, padding: '20px 0' }}>
                No games found for {selectedYear}.
              </div>
            ) : null}
          </div>

        </div>
      )}

      {/* ── Curator: Blocked Games panel ── */}
      {isCurator && (
        <div style={{ ...card, padding: '20px 24px', marginTop: 48 }}>
          <h2 style={{
            fontFamily: fonts.pixel, fontSize: 10, color: colors.text,
            margin: '0 0 16px', paddingBottom: 10, borderBottom: `2px solid ${colors.border}`,
          }}>
            Blocked Games ({blockedList.length})
          </h2>
          {blockedList.length === 0 ? (
            <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.muted, margin: 0 }}>
              No games blocked yet. Search for a game and click ✕ to block it.
            </p>
          ) : (
            blockedList.map(entry => (
              <div key={entry.game_id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 0', borderBottom: `1px solid ${colors.border}`,
              }}>
                <div>
                  <span style={{ fontFamily: fonts.body, fontSize: 14, color: colors.text, fontWeight: 500 }}>
                    {entry.title}
                  </span>
                  <span style={{ fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginLeft: 10 }}>
                    {new Date(entry.blocked_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <button onClick={() => restoreGame(entry.game_id)} style={{ ...button.ghost, fontSize: 12, padding: '3px 10px' }}>
                  Restore
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
