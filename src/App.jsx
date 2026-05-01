import { useState, useEffect } from 'react';
import { colors } from './styles/theme';
import { useAuth } from './contexts/AuthContext';
import { getGameById } from './data/games';
import Nav from './components/Nav';
import Home from './pages/Home';
import GamePage from './pages/GamePage';
import PlayerPage from './pages/PlayerPage';
import SquadPage from './pages/SquadPage';

function load(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}

export default function App() {
  const { profile } = useAuth();
  const currentUser = profile?.username || null;

  const [currentPage, setCurrentPage] = useState(() => load('gg_currentPage', 'home'));
  const [selectedGame, setSelectedGame] = useState(() => {
    const id = load('gg_selectedGameId', null);
    return id ? (getGameById(id) ?? null) : null;
  });
  const [reviews, setReviews] = useState(() => load('gg_reviews', {}));
  const [squads, setSquads] = useState(() => load('gg_squads', []));
  const [playerData, setPlayerData] = useState(() => load('gg_playerData', {}));
  const [reviewVotes, setReviewVotes] = useState(() => load('gg_reviewVotes', {}));

  useEffect(() => { localStorage.setItem('gg_currentPage', JSON.stringify(currentPage)); }, [currentPage]);
  useEffect(() => { localStorage.setItem('gg_selectedGameId', JSON.stringify(selectedGame?.id ?? null)); }, [selectedGame]);
  useEffect(() => { localStorage.setItem('gg_reviews', JSON.stringify(reviews)); }, [reviews]);
  useEffect(() => { localStorage.setItem('gg_squads', JSON.stringify(squads)); }, [squads]);
  useEffect(() => { localStorage.setItem('gg_playerData', JSON.stringify(playerData)); }, [playerData]);
  useEffect(() => { localStorage.setItem('gg_reviewVotes', JSON.stringify(reviewVotes)); }, [reviewVotes]);

  function navigateTo(page, game = null) {
    setCurrentPage(game ? 'game' : page);
    setSelectedGame(game);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const sharedProps = {
    reviews,
    setReviews,
    squads,
    setSquads,
    playerData,
    setPlayerData,
    reviewVotes,
    setReviewVotes,
    navigateTo,
  };

  return (
    <div style={{ minHeight: '100vh', background: colors.bg }}>
      <Nav
        currentPage={currentPage === 'game' ? null : currentPage}
        navigateTo={navigateTo}
      />
      <main>
        {currentPage === 'home' && (
          <Home
            reviews={reviews}
            navigateTo={navigateTo}
            currentUser={currentUser}
            playerData={playerData}
          />
        )}
        {currentPage === 'game' && selectedGame && (
          <GamePage game={selectedGame} {...sharedProps} />
        )}
        {currentPage === 'player' && (
          <PlayerPage {...sharedProps} />
        )}
        {currentPage === 'squad' && (
          <SquadPage {...sharedProps} />
        )}
      </main>
    </div>
  );
}
