export const colors = {
  bg: '#F5F2EC',
  text: '#1A1A1A',
  navy: '#1B2A4A',
  orange: '#E8621A',
  yellow: '#F5C842',
  white: '#FFFFFF',
  border: '#DDD',
  muted: '#888',
  lightBg: '#EDEAE3',
};

export const fonts = {
  heading: "Georgia, 'Times New Roman', serif",
  body: 'system-ui, sans-serif',
  pixel: "'Press Start 2P', monospace",
};

export const card = {
  background: colors.white,
  border: `1px solid ${colors.border}`,
  borderRadius: 8,
  padding: 16,
};

export const button = {
  primary: {
    background: colors.orange,
    color: colors.white,
    border: 'none',
    borderRadius: 6,
    padding: '8px 18px',
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  secondary: {
    background: colors.navy,
    color: colors.white,
    border: 'none',
    borderRadius: 6,
    padding: '8px 18px',
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  ghost: {
    background: 'transparent',
    color: colors.navy,
    border: `1px solid ${colors.navy}`,
    borderRadius: 6,
    padding: '7px 17px',
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  danger: {
    background: 'transparent',
    color: '#C0392B',
    border: '1px solid #C0392B',
    borderRadius: 6,
    padding: '5px 12px',
    fontFamily: fonts.body,
    fontSize: 13,
    cursor: 'pointer',
  },
};

export const input = {
  base: {
    fontFamily: fonts.body,
    fontSize: 14,
    border: `1px solid ${colors.border}`,
    borderRadius: 6,
    padding: '8px 12px',
    background: colors.white,
    color: colors.text,
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
};
