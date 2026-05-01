import { useState, useEffect } from 'react';
import { colors, fonts, card, button, input } from '../styles/theme';
import { games } from '../data/games';
import { GENRE_COLORS } from '../components/GameCard';
import { useAuth } from '../contexts/AuthContext';
import RequireAuth from '../components/auth/RequireAuth';

function getGameById(id) {
  return games.find(g => g.id === id);
}

function MemberAvatar({ name, size = 32, isYou = false }) {
  return (
    <div
      title={isYou ? `${name} (you)` : name}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: isYou ? colors.orange : colors.navy,
        color: colors.white,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: fonts.body,
        fontWeight: 700,
        fontSize: size * 0.4,
        flexShrink: 0,
        border: `2px solid ${colors.white}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
      }}
    >
      {name[0].toUpperCase()}
    </div>
  );
}

function useCountdown(target) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);
  if (!target) return null;
  const diff = new Date(target) - now;
  if (diff <= 0) return { expired: true };
  const days = Math.floor(diff / 86400000);
  const hrs = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  return { days, hrs, mins, expired: false };
}

function Countdown({ target }) {
  const cd = useCountdown(target);
  if (!cd) return null;
  if (cd.expired) {
    return (
      <span style={{ color: colors.orange, fontFamily: fonts.body, fontSize: 13, fontWeight: 600 }}>
        Happening now!
      </span>
    );
  }
  return (
    <span style={{ fontFamily: fonts.body, fontSize: 15, color: colors.text }}>
      {cd.days > 0 && <><strong style={{ fontSize: 18 }}>{cd.days}</strong>d{' '}</>}
      <strong style={{ fontSize: 18 }}>{cd.hrs}</strong>h{' '}
      <strong style={{ fontSize: 18 }}>{cd.mins}</strong>m
    </span>
  );
}

function PollSection({ poll, currentUser, squadId, setSquads }) {
  const voted = poll.votes?.[currentUser];
  const tallies = poll.tallies || poll.options.map(() => 0);
  const total = tallies.reduce((a, b) => a + b, 0);

  function castVote(i) {
    if (voted !== undefined) return;
    setSquads(sq => sq.map(s => {
      if (s.id !== squadId) return s;
      return {
        ...s,
        polls: s.polls.map(p => {
          if (p.id !== poll.id) return p;
          return {
            ...p,
            votes: { ...(p.votes || {}), [currentUser]: i },
            tallies: (p.tallies || p.options.map(() => 0)).map((t, j) => j === i ? t + 1 : t),
          };
        }),
      };
    }));
  }

  return (
    <div style={{ ...card, padding: '16px 20px', marginBottom: 12 }}>
      <div style={{ fontFamily: fonts.heading, fontSize: 16, fontWeight: 700, color: colors.text, marginBottom: 12 }}>
        {poll.question}
      </div>
      {poll.options.map((opt, i) => {
        const pct = total > 0 ? Math.round((tallies[i] / total) * 100) : 0;
        const isMyVote = voted === i;
        const hasVoted = voted !== undefined;
        return (
          <div key={i} style={{ marginBottom: 8, position: 'relative' }}>
            <div style={{
              border: `1px solid ${isMyVote ? colors.navy : colors.border}`,
              borderRadius: 8,
              overflow: 'hidden',
              background: colors.white,
              cursor: hasVoted ? 'default' : 'pointer',
            }}
              onClick={() => castVote(i)}
            >
              {hasVoted && (
                <div style={{
                  position: 'absolute',
                  top: 0, left: 0,
                  height: '100%',
                  width: `${pct}%`,
                  background: isMyVote ? `${colors.navy}20` : `${colors.border}88`,
                  transition: 'width 0.35s',
                  pointerEvents: 'none',
                  borderRadius: 8,
                }} />
              )}
              <div style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
              }}>
                <span style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 600, color: colors.text, flex: 1 }}>
                  {opt}
                </span>
                {!hasVoted && (
                  <span style={{
                    ...button.ghost,
                    padding: '3px 10px',
                    fontSize: 12,
                    display: 'inline-block',
                    pointerEvents: 'none',
                  }}>
                    Vote
                  </span>
                )}
                {hasVoted && (
                  <span style={{ fontFamily: fonts.body, fontSize: 12, color: colors.muted, flexShrink: 0 }}>
                    {pct}% · {tallies[i]}
                  </span>
                )}
                {isMyVote && (
                  <span style={{ fontSize: 12, color: colors.navy, fontWeight: 700, flexShrink: 0 }}>✓</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
      <div style={{ fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 2 }}>
        {total} vote{total !== 1 ? 's' : ''} · {voted !== undefined ? 'Voted' : 'Click an option to vote'}
      </div>
    </div>
  );
}

function CreatePollForm({ squadId, setSquads }) {
  const [question, setQuestion] = useState('What should we play next?');
  const [options, setOptions] = useState(['', '']);

  function setOption(i, val) {
    setOptions(opts => opts.map((o, j) => j === i ? val : o));
  }

  function addOption() {
    if (options.length < 4) setOptions(o => [...o, '']);
  }

  function removeOption(i) {
    if (options.length <= 2) return;
    setOptions(o => o.filter((_, j) => j !== i));
  }

  function submit() {
    const filled = options.map(o => o.trim()).filter(Boolean);
    if (filled.length < 2) return;
    const poll = {
      id: Date.now().toString(),
      question: question.trim() || 'What should we play next?',
      options: filled,
      votes: {},
      tallies: filled.map(() => 0),
    };
    setSquads(sq => sq.map(s => s.id === squadId ? { ...s, polls: [poll, ...s.polls] } : s));
    setQuestion('What should we play next?');
    setOptions(['', '']);
  }

  const filledCount = options.filter(o => o.trim()).length;

  return (
    <div style={{ ...card, padding: '16px 20px', marginBottom: 16, background: colors.lightBg, border: `1px solid ${colors.border}` }}>
      <div style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 10 }}>
        Create a Poll
      </div>
      <input
        type="text"
        value={question}
        onChange={e => setQuestion(e.target.value)}
        placeholder="Poll question"
        style={{ ...input.base, fontSize: 13, marginBottom: 10 }}
      />
      {options.map((opt, i) => (
        <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 7 }}>
          <input
            type="text"
            placeholder={`Option ${i + 1}${i < 2 ? ' (required)' : ''}`}
            value={opt}
            onChange={e => setOption(i, e.target.value)}
            style={{ ...input.base, fontSize: 13, flex: 1 }}
          />
          {options.length > 2 && (
            <button
              onClick={() => removeOption(i)}
              style={{ ...button.danger, padding: '5px 10px', fontSize: 16, lineHeight: 1 }}
            >
              ×
            </button>
          )}
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        {options.length < 4 && (
          <button onClick={addOption} style={{ ...button.ghost, fontSize: 12, padding: '5px 12px' }}>
            + Add option
          </button>
        )}
        <button
          onClick={submit}
          disabled={filledCount < 2}
          style={{
            ...button.secondary,
            opacity: filledCount < 2 ? 0.5 : 1,
            cursor: filledCount < 2 ? 'not-allowed' : 'pointer',
          }}
        >
          Create Poll
        </button>
      </div>
    </div>
  );
}

function ThreadSection({ squadId, squads, setSquads, currentUser }) {
  const squad = squads.find(s => s.id === squadId);
  const threads = squad?.threads || [];
  const [newTitle, setNewTitle] = useState('');
  const [replyText, setReplyText] = useState({});
  const [openThread, setOpenThread] = useState(null);

  function createThread() {
    if (!newTitle.trim()) return;
    const thread = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      author: currentUser,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      replies: [],
    };
    setSquads(sq => sq.map(s => s.id === squadId ? { ...s, threads: [thread, ...s.threads] } : s));
    setNewTitle('');
    setOpenThread(thread.id);
  }

  function addReply(threadId) {
    const text = (replyText[threadId] || '').trim();
    if (!text) return;
    const reply = {
      id: Date.now().toString(),
      author: currentUser,
      body: text,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    };
    setSquads(sq => sq.map(s => {
      if (s.id !== squadId) return s;
      return {
        ...s,
        threads: s.threads.map(t =>
          t.id === threadId ? { ...t, replies: [...t.replies, reply] } : t
        ),
      };
    }));
    setReplyText(r => ({ ...r, [threadId]: '' }));
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Start a new thread…"
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && createThread()}
          style={{ ...input.base, fontSize: 13 }}
        />
        <button onClick={createThread} style={{ ...button.primary, whiteSpace: 'nowrap' }}>
          Post
        </button>
      </div>

      {threads.length === 0 && (
        <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.muted, textAlign: 'center', padding: '20px 0' }}>
          No threads yet. Start a conversation!
        </p>
      )}

      {threads.map(thread => {
        const isOpen = openThread === thread.id;
        return (
          <div key={thread.id} style={{ ...card, padding: '14px 18px', marginBottom: 10 }}>
            <div
              onClick={() => setOpenThread(isOpen ? null : thread.id)}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: fonts.body, fontWeight: 600, fontSize: 14, color: colors.text }}>
                  {thread.title}
                </div>
                <div style={{ fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 2 }}>
                  {thread.author} · {thread.date} · {thread.replies.length} repl{thread.replies.length !== 1 ? 'ies' : 'y'}
                </div>
              </div>
              <span style={{ color: colors.muted, fontSize: 14, flexShrink: 0 }}>
                {isOpen ? '▲' : '▼'}
              </span>
            </div>

            {isOpen && (
              <div style={{ marginTop: 12 }}>
                {thread.replies.map(r => (
                  <div key={r.id} style={{
                    padding: '10px 0',
                    borderTop: `1px solid ${colors.border}`,
                    display: 'flex',
                    gap: 10,
                  }}>
                    <MemberAvatar name={r.author} size={28} />
                    <div>
                      <div style={{ fontFamily: fonts.body, fontSize: 12, fontWeight: 600, color: colors.text }}>
                        {r.author} <span style={{ color: colors.muted, fontWeight: 400 }}>· {r.date}</span>
                      </div>
                      <div style={{ fontFamily: fonts.body, fontSize: 13, color: colors.text, marginTop: 2, lineHeight: 1.55 }}>
                        {r.body}
                      </div>
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    placeholder="Reply…"
                    value={replyText[thread.id] || ''}
                    onChange={e => setReplyText(r => ({ ...r, [thread.id]: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && addReply(thread.id)}
                    style={{ ...input.base, fontSize: 13 }}
                  />
                  <button onClick={() => addReply(thread.id)} style={{ ...button.ghost, whiteSpace: 'nowrap' }}>
                    Reply
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function SquadPage({ squads, setSquads }) {
  const { profile, loading, isLoggedIn } = useAuth();
  const currentUser = profile?.username || null;
  const [creating, setCreating] = useState(false);
  const [squadName, setSquadName] = useState('');
  const [membersInput, setMembersInput] = useState('');
  const [activeSquadId, setActiveSquadId] = useState(null);
  const [meetupInput, setMeetupInput] = useState('');

  const userSquads = squads.filter(s =>
    s.members.includes(currentUser) || s.owner === currentUser
  );

  const resolvedId = activeSquadId || userSquads[0]?.id || null;
  const currentSquad = resolvedId ? squads.find(s => s.id === resolvedId) : null;

  function createSquad() {
    if (!squadName.trim()) return;
    const members = [
      currentUser,
      ...membersInput.split(',').map(m => m.trim()).filter(m => m && m !== currentUser),
    ];
    const squad = {
      id: Date.now().toString(),
      name: squadName.trim(),
      owner: currentUser,
      members,
      polls: [],
      threads: [],
      nextMeetup: null,
    };
    setSquads(sq => [squad, ...sq]);
    setActiveSquadId(squad.id);
    setCreating(false);
    setSquadName('');
    setMembersInput('');
  }

  function setMeetup(squadId) {
    if (!meetupInput) return;
    setSquads(sq => sq.map(s => s.id === squadId ? { ...s, nextMeetup: meetupInput } : s));
    setMeetupInput('');
  }

  // Squad top games aggregation is pending Supabase migration for cross-user top10 lookup.
  function getTopGames(_squad) {
    return [];
  }



  if (loading) return null;
  if (!isLoggedIn) return <RequireAuth message="Log in to view your squads." />;
  if (!currentUser) return null; // logged in but profile still resolving

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px', display: 'flex', gap: 24, alignItems: 'flex-start' }}>
      {/* Sidebar */}
      <div style={{ width: 220, flexShrink: 0 }}>
        <div style={{
          fontFamily: fonts.body,
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.8px',
          color: colors.muted,
          marginBottom: 10,
        }}>
          Your Squads
        </div>

        {userSquads.map(s => (
          <div
            key={s.id}
            onClick={() => { setActiveSquadId(s.id); setCreating(false); }}
            style={{
              padding: '10px 12px',
              borderRadius: 8,
              cursor: 'pointer',
              background: currentSquad?.id === s.id ? colors.navy : 'transparent',
              color: currentSquad?.id === s.id ? colors.white : colors.text,
              fontFamily: fonts.body,
              fontSize: 14,
              fontWeight: 600,
              marginBottom: 4,
              border: `1px solid ${currentSquad?.id === s.id ? colors.navy : colors.border}`,
            }}
          >
            <div style={{ marginBottom: 2 }}>{s.name}</div>
            <div style={{
              fontSize: 11,
              color: currentSquad?.id === s.id ? 'rgba(255,255,255,0.65)' : colors.muted,
              fontWeight: 400,
            }}>
              {s.members.length} member{s.members.length !== 1 ? 's' : ''}
            </div>
          </div>
        ))}

        <button
          onClick={() => setCreating(true)}
          style={{ ...button.ghost, width: '100%', marginTop: 8, display: 'flex', justifyContent: 'center' }}
        >
          + New Squad
        </button>
      </div>

      {/* Main */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Create form */}
        {creating && (
          <div style={{ ...card, padding: '24px 28px', marginBottom: 24 }}>
            <h2 style={{ fontFamily: fonts.heading, fontSize: 20, fontWeight: 700, color: colors.text, margin: '0 0 16px' }}>
              Create a Squad
            </h2>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 600, color: colors.text, display: 'block', marginBottom: 6 }}>
                Squad Name
              </label>
              <input
                type="text"
                placeholder="e.g. Weekend Warriors"
                value={squadName}
                onChange={e => setSquadName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && createSquad()}
                style={{ ...input.base, fontSize: 14 }}
                autoFocus
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 600, color: colors.text, display: 'block', marginBottom: 6 }}>
                Invite Members{' '}
                <span style={{ fontWeight: 400, color: colors.muted }}>(usernames, comma-separated)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. alex, sam, casey"
                value={membersInput}
                onChange={e => setMembersInput(e.target.value)}
                style={{ ...input.base, fontSize: 14 }}
              />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={createSquad} style={button.primary}>Create Squad</button>
              <button
                onClick={() => { setCreating(false); setSquadName(''); setMembersInput(''); }}
                style={button.ghost}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!currentSquad && !creating && (
          <div style={{ textAlign: 'center', padding: '60px 24px', ...card }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎮</div>
            <h2 style={{ fontFamily: fonts.heading, fontSize: 22, color: colors.text, marginBottom: 8 }}>
              No squads yet
            </h2>
            <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.muted, marginBottom: 20 }}>
              Create a squad to coordinate with friends, run polls, and schedule game nights.
            </p>
            <button onClick={() => setCreating(true)} style={button.primary}>
              Create a Squad
            </button>
          </div>
        )}

        {/* Squad view */}
        {currentSquad && !creating && (
          <div>
            {/* Squad header */}
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontFamily: fonts.heading, fontSize: 28, fontWeight: 700, color: colors.text, margin: '0 0 12px' }}>
                {currentSquad.name}
              </h1>
              {/* Member avatars */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap' }}>
                {currentSquad.members.map((m, i) => (
                  <div
                    key={m}
                    title={m === currentUser ? `${m} (you)` : m}
                    style={{ marginLeft: i === 0 ? 0 : -8, zIndex: currentSquad.members.length - i }}
                  >
                    <MemberAvatar name={m} size={36} isYou={m === currentUser} />
                  </div>
                ))}
                <div style={{ marginLeft: 14 }}>
                  {currentSquad.members.map(m => (
                    <span key={m} style={{
                      fontFamily: fonts.body,
                      fontSize: 13,
                      color: m === currentUser ? colors.orange : colors.text,
                      fontWeight: m === currentUser ? 700 : 400,
                    }}>
                      {m === currentUser ? `${m} (you)` : m}
                      {m !== currentSquad.members[currentSquad.members.length - 1] ? ', ' : ''}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Games */}
            <div style={{ ...card, padding: '18px 22px', marginBottom: 20 }}>
              <h2 style={{ fontFamily: fonts.heading, fontSize: 18, fontWeight: 700, color: colors.text, margin: '0 0 14px' }}>
                Squad's Top Games
              </h2>
              {(() => {
                const topGames = getTopGames(currentSquad);
                if (topGames.length === 0) {
                  return (
                    <p style={{ fontFamily: fonts.body, fontSize: 13, color: colors.muted }}>
                      Squad members need to add games to their Top 10 on their Player page first.
                    </p>
                  );
                }
                return topGames.map(({ game, score }, idx) => {
                  const gc = GENRE_COLORS[game.genre] || { bg: '#EEE', text: '#555' };
                  return (
                    <div key={game.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '9px 0',
                      borderBottom: idx < topGames.length - 1 ? `1px solid ${colors.border}` : 'none',
                    }}>
                      <span style={{ fontFamily: fonts.heading, fontSize: 16, fontWeight: 700, color: colors.muted, width: 22, textAlign: 'right', flexShrink: 0 }}>
                        {idx + 1}
                      </span>
                      <div style={{ width: 28, height: 28, borderRadius: 6, background: game.coverColor, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: fonts.body, fontWeight: 600, fontSize: 14, color: colors.text }}>{game.title}</div>
                        <span style={{
                          background: gc.bg, color: gc.text,
                          fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 8,
                          textTransform: 'uppercase', letterSpacing: '0.4px', fontFamily: fonts.body,
                        }}>
                          {game.genreLabel}
                        </span>
                      </div>
                      <span style={{ fontFamily: fonts.body, fontSize: 12, color: colors.muted, flexShrink: 0 }}>
                        {score} pts
                      </span>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Polls */}
            <div style={{ ...card, padding: '18px 22px', marginBottom: 20 }}>
              <h2 style={{ fontFamily: fonts.heading, fontSize: 18, fontWeight: 700, color: colors.text, margin: '0 0 14px' }}>
                Polls
              </h2>
              <CreatePollForm squadId={currentSquad.id} setSquads={setSquads} />
              {(currentSquad.polls || []).length === 0 && (
                <p style={{ fontFamily: fonts.body, fontSize: 13, color: colors.muted, textAlign: 'center', padding: '4px 0 8px' }}>
                  No polls yet. Create one above!
                </p>
              )}
              {(currentSquad.polls || []).map(poll => (
                <PollSection
                  key={poll.id}
                  poll={poll}
                  currentUser={currentUser}
                  squadId={currentSquad.id}
                  setSquads={setSquads}
                />
              ))}
            </div>

            {/* Next Meetup */}
            <div style={{ ...card, padding: '18px 22px', marginBottom: 20 }}>
              <h2 style={{ fontFamily: fonts.heading, fontSize: 18, fontWeight: 700, color: colors.text, margin: '0 0 14px' }}>
                Next Game Night
              </h2>
              {currentSquad.nextMeetup ? (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontFamily: fonts.body, fontSize: 15, color: colors.text, marginBottom: 6 }}>
                    📅 {new Date(currentSquad.nextMeetup).toLocaleString('en-US', {
                      weekday: 'long', month: 'long', day: 'numeric',
                      hour: 'numeric', minute: '2-digit',
                    })}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: fonts.body, fontSize: 13, color: colors.muted }}>Countdown: </span>
                    <Countdown target={currentSquad.nextMeetup} />
                  </div>
                </div>
              ) : (
                <p style={{ fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginBottom: 14 }}>
                  No game night scheduled yet.
                </p>
              )}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="datetime-local"
                  value={meetupInput}
                  onChange={e => setMeetupInput(e.target.value)}
                  style={{ ...input.base, fontSize: 13, maxWidth: 260 }}
                />
                <button
                  onClick={() => setMeetup(currentSquad.id)}
                  style={{ ...button.secondary, whiteSpace: 'nowrap' }}
                >
                  {currentSquad.nextMeetup ? 'Update' : 'Schedule'}
                </button>
              </div>
            </div>

            {/* Threads */}
            <div style={{ ...card, padding: '18px 22px' }}>
              <h2 style={{ fontFamily: fonts.heading, fontSize: 18, fontWeight: 700, color: colors.text, margin: '0 0 14px' }}>
                Threads
              </h2>
              <ThreadSection
                squadId={currentSquad.id}
                squads={squads}
                setSquads={setSquads}
                currentUser={currentUser}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
