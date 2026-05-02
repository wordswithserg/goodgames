const PROXY = '/api/igdb';

async function igdbFetch(endpoint, body) {
  const res = await fetch(PROXY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint, body }),
  });
  return res.json();
}

function coverUrl(imageId) {
  return `https://images.igdb.com/igdb/image/upload/t_cover_big/${imageId}.jpg`;
}

async function fetchCovers(coverIds) {
  if (!coverIds.length) return {};
  const data = await igdbFetch(
    'covers',
    `where id = (${coverIds.join(',')}); fields id,image_id; limit ${coverIds.length};`
  );
  const map = {};
  if (Array.isArray(data)) data.forEach(c => { map[c.id] = coverUrl(c.image_id); });
  return map;
}

function formatGame(g, url, genreOverride) {
  const genreName = genreOverride || g.genres?.[0]?.name || 'Unknown';
  return {
    id: `igdb_${g.id}`,
    title: g.name,
    coverUrl: url || null,
    genre: genreName,
    genreLabel: genreName,
    year: g.first_release_date ? new Date(g.first_release_date * 1000).getFullYear() : null,
    platforms: (g.platforms || []).map(p => p.name),
    description: g.summary || '',
    summary: g.summary || '',
    source: 'igdb',
  };
}

export async function searchGames(query) {
  const data = await igdbFetch(
    'games',
    `search "${query}"; fields id,name,cover,genres.name,first_release_date,rating,total_rating_count; where cover != null; limit 20;`
  );
  if (!Array.isArray(data)) return [];

  const coverIds = data.filter(g => g.cover).map(g => g.cover);
  const covers = await fetchCovers(coverIds);

  return data.map(g => formatGame(g, g.cover ? covers[g.cover] : null));
}

export async function fetchIgdbGenres() {
  const data = await igdbFetch('genres', 'fields id,name; limit 20; sort name asc;');
  return Array.isArray(data) ? data : [];
}

export async function fetchGenreGames(genreId) {
  const data = await igdbFetch(
    'games',
    `fields id,name,cover,genres.name,first_release_date,platforms.name,rating,total_rating_count; where genres = ${genreId} & cover != null & total_rating_count > 50; sort total_rating_count desc; limit 20;`
  );
  if (!Array.isArray(data)) return [];
  const coverIds = data.filter(g => g.cover).map(g => g.cover);
  const covers = await fetchCovers(coverIds);
  return data.map(g => formatGame(g, g.cover ? covers[g.cover] : null));
}

export async function fetchThemeGames(themeId, genreOverride) {
  const data = await igdbFetch(
    'games',
    `fields id,name,cover,themes,first_release_date,platforms.name,rating,total_rating_count; where themes = ${themeId} & cover != null & total_rating_count > 50; sort total_rating_count desc; limit 20;`
  );
  if (!Array.isArray(data)) return [];
  const coverIds = data.filter(g => g.cover).map(g => g.cover);
  const covers = await fetchCovers(coverIds);
  return data.map(g => formatGame(g, g.cover ? covers[g.cover] : null, genreOverride));
}

export async function fetchYearGames(year) {
  const start = Math.floor(new Date(`${year}-01-01T00:00:00Z`).getTime() / 1000);
  const end = Math.floor(new Date(`${year}-12-31T23:59:59Z`).getTime() / 1000);
  const data = await igdbFetch(
    'games',
    `fields id,name,cover,genres.name,first_release_date,platforms.name,rating,total_rating_count; where first_release_date >= ${start} & first_release_date <= ${end} & cover != null & total_rating_count > 10; sort total_rating_count desc; limit 20;`
  );
  if (!Array.isArray(data)) return [];
  const coverIds = data.filter(g => g.cover).map(g => g.cover);
  const covers = await fetchCovers(coverIds);
  return data.map(g => formatGame(g, g.cover ? covers[g.cover] : null));
}

export async function getGameById(igdbId) {
  const numericId = String(igdbId).replace('igdb_', '');
  const data = await igdbFetch(
    'games',
    `where id = ${numericId}; fields id,name,cover,genres.name,first_release_date,platforms.name,summary; limit 1;`
  );
  if (!Array.isArray(data) || !data.length) return null;

  const g = data[0];
  const covers = await fetchCovers(g.cover ? [g.cover] : []);
  return formatGame(g, g.cover ? covers[g.cover] : null);
}
