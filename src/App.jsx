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
  const [squads, setSquads] = useState(() => load('gg_squads', []));

  useEffect(() => { localStorage.setItem('gg_currentPage', JSON.stringify(currentPage)); }, [currentPage]);
  useEffect(() => { localStorage.setItem('gg_selectedGameId', JSON.stringify(selectedGame?.id ?? null)); }, [selectedGame]);
  useEffect(() => { localStorage.setItem('gg_squads', JSON.stringify(squads)); }, [squads]);

  function navigateTo(page, game = null) {
    setCurrentPage(game ? 'game' : page);
    setSelectedGame(game);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div style={{ minHeight: '100vh', background: colors.bg }}>
      <Nav
        currentPage={currentPage === 'game' ? null : currentPage}
        navigateTo={navigateTo}
      />
      <main>
        {currentPage === 'home' && (
          <Home navigateTo={navigateTo} currentUser={currentUser} />
        )}
        {currentPage === 'game' && selectedGame && (
          <GamePage game={selectedGame} navigateTo={navigateTo} />
        )}
        {currentPage === 'player' && (
          <PlayerPage navigateTo={navigateTo} />
        )}
        {currentPage === 'squad' && (
          <SquadPage squads={squads} setSquads={setSquads} navigateTo={navigateTo} />
        )}
      </main>
    </div>
  );
}
