import { useState, useEffect } from 'react';

const SLAM_DELAY = 900;   // ms before goodgames-05 slams in
const FADE_DELAY = 2000;  // ms before screen starts fading
const DONE_DELAY = 2400;  // ms before onComplete fires

export default function LoadingScreen({ onComplete }) {
  const [slammed, setSlammed] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setSlammed(true), SLAM_DELAY);
    const t2 = setTimeout(() => setFading(true), FADE_DELAY);
    const t3 = setTimeout(onComplete, DONE_DELAY);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#1B2A4A',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      opacity: fading ? 0 : 1,
      transition: 'opacity 0.4s ease',
      pointerEvents: fading ? 'none' : 'all',
    }}>
      <style>{`
        @keyframes gg-flip {
          0%   { transform: scaleX(1)  scaleY(1); }
          25%  { transform: scaleX(-1) scaleY(1); }
          50%  { transform: scaleX(-1) scaleY(-1); }
          75%  { transform: scaleX(1)  scaleY(-1); }
          100% { transform: scaleX(1)  scaleY(1); }
        }
        @keyframes gg-slam {
          0%   { transform: scale(3.5); opacity: 0; }
          45%  { transform: scale(0.93); opacity: 1; }
          70%  { transform: scale(1.04); }
          100% { transform: scale(1); }
        }
      `}</style>

      <div style={{ position: 'relative', width: 420, height: 420 }}>
        {/* Background logo — flips rapidly until slam */}
        <img
          src="/goodgames-04.png"
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            animation: slammed ? 'none' : 'gg-flip 0.18s step-start infinite',
            transform: slammed ? 'scaleX(1) scaleY(1)' : undefined,
          }}
        />

        {/* Foreground logo — slams in on top */}
        {slammed && (
          <img
            src="/goodgames-05.png"
            alt="GoodGames"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              animation: 'gg-slam 0.45s cubic-bezier(0.22, 1, 0.36, 1) forwards',
              filter: 'brightness(0) invert(1)',
            }}
          />
        )}
      </div>
    </div>
  );
}
