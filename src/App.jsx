import { useState, useEffect } from 'react';
import { colors } from './styles/theme';
import { useAuth } from './contexts/AuthContext';
import { getGameById } from './data/games';
import Nav from './components/Nav';
import LoadingScreen from './components/LoadingScreen';
import Home from './pages/Home';
import FeedPage from './pages/FeedPage';
import GamePage from './pages/GamePage';
import PlayerPage from './pages/PlayerPage';
import ProfilePage from './pages/ProfilePage';
import SquadPage from './pages/SquadPage';
import SettingsPage from './pages/SettingsPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

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
  const [showLoading, setShowLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(() => {
    if (window.location.pathname === '/reset-password') return 'reset-password';
    return load('gg_currentPage', 'feed');
  });
  const [selectedGame, setSelectedGame] = useState(() => {
    const id = load('gg_selectedGameId', null);
    return id ? (getGameById(id) ?? null) : null;
  });
  const [selectedProfile, setSelectedProfile] = useState(() => {
    const id = load('gg_selectedProfileId', null);
    const page = load('gg_currentPage', 'home');
    return id && page === 'profile' ? { id, username: null } : null;
  });

  useEffect(() => { localStorage.setItem('gg_currentPage', JSON.stringify(currentPage)); }, [currentPage]);
  useEffect(() => { localStorage.setItem('gg_selectedGameId', JSON.stringify(selectedGame?.id ?? null)); }, [selectedGame]);
  useEffect(() => { localStorage.setItem('gg_selectedProfileId', JSON.stringify(selectedProfile?.id ?? null)); }, [selectedProfile]);

  function navigateTo(page, data = null) {
    if (page === 'game') {
      setCurrentPage('game');
      setSelectedGame(data);
      setSelectedProfile(null);
    } else if (page === 'profile') {
      setCurrentPage('profile');
      setSelectedProfile(data);
      setSelectedGame(null);
    } else {
      setCurrentPage(page);
      setSelectedGame(null);
      setSelectedProfile(null);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div style={{ minHeight: '100vh', background: `var(--page-bg, ${colors.bg})` }}>
      {showLoading && <LoadingScreen onComplete={() => setShowLoading(false)} />}
      <Nav
        currentPage={['game', 'profile'].includes(currentPage) ? null : currentPage}
        navigateTo={navigateTo}
      />
      <main>
        {currentPage === 'feed' && (
          <FeedPage navigateTo={navigateTo} />
        )}
        {currentPage === 'home' && (
          <Home navigateTo={navigateTo} currentUser={currentUser} />
        )}
        {currentPage === 'game' && selectedGame && (
          <GamePage game={selectedGame} navigateTo={navigateTo} />
        )}
        {currentPage === 'player' && (
          <PlayerPage navigateTo={navigateTo} />
        )}
        {currentPage === 'profile' && selectedProfile && (
          <ProfilePage userId={selectedProfile.id} navigateTo={navigateTo} />
        )}
        {currentPage === 'squad' && (
          <SquadPage navigateTo={navigateTo} />
        )}
        {currentPage === 'settings' && (
          <SettingsPage navigateTo={navigateTo} />
        )}
        {currentPage === 'reset-password' && (
          <ResetPasswordPage navigateTo={navigateTo} />
        )}
      </main>
    </div>
  );
}
