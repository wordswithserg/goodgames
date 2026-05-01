import { colors, fonts } from '../styles/theme';
import NavAuth from './auth/NavAuth';

const NAV_LINKS = [
  { label: 'Home', page: 'home' },
  { label: 'Player', page: 'player' },
  { label: 'Squad', page: 'squad' },
];

export default function Nav({ currentPage, navigateTo }) {
  return (
    <nav style={{
      background: colors.navy,
      color: colors.bg,
      display: 'flex',
      alignItems: 'center',
      padding: '0 28px',
      height: 56,
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
      gap: 24,
    }}>
      {/* Logo */}
      <button
        onClick={() => navigateTo('home')}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginRight: 8,
        }}
      >
        <span style={{
          fontFamily: fonts.heading,
          fontSize: 22,
          fontWeight: 700,
          color: colors.bg,
          letterSpacing: '-0.5px',
        }}>
          good<span style={{ color: colors.yellow }}>games</span>
        </span>
        <span style={{
          background: colors.orange,
          color: colors.white,
          borderRadius: 4,
          fontSize: 10,
          fontWeight: 700,
          padding: '2px 6px',
          fontFamily: fonts.body,
          letterSpacing: '0.5px',
        }}>
          BETA
        </span>
      </button>

      {/* Page links */}
      <div style={{ display: 'flex', gap: 4, flex: 1 }}>
        {NAV_LINKS.map(link => (
          <button
            key={link.page}
            onClick={() => navigateTo(link.page)}
            style={{
              background: currentPage === link.page ? 'rgba(245,200,66,0.18)' : 'none',
              border: 'none',
              color: currentPage === link.page ? colors.yellow : colors.bg,
              fontFamily: fonts.body,
              fontSize: 15,
              fontWeight: currentPage === link.page ? 600 : 400,
              cursor: 'pointer',
              padding: '6px 14px',
              borderRadius: 6,
              transition: 'background 0.15s',
            }}
          >
            {link.label}
          </button>
        ))}
      </div>

      {/* Auth controls */}
      <NavAuth onNavigateToProfile={() => navigateTo('player')} />
    </nav>
  );
}
