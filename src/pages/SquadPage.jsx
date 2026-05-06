// SQL MIGRATIONS — run once in Supabase SQL editor:
//
// CREATE TABLE IF NOT EXISTS squad_notification_prefs (
//   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
//   user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
//   squad_id uuid NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
//   poll_created boolean NOT NULL DEFAULT true,
//   poll_closing_soon boolean NOT NULL DEFAULT true,
//   game_night_scheduled boolean NOT NULL DEFAULT true,
//   thread_created boolean NOT NULL DEFAULT true,
//   mentioned_in_thread boolean NOT NULL DEFAULT true,
//   replied_in_thread boolean NOT NULL DEFAULT true,
//   UNIQUE(user_id, squad_id)
// );
//
// CREATE TABLE IF NOT EXISTS notifications (
//   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
//   user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
//   squad_id uuid REFERENCES squads(id) ON DELETE CASCADE,
//   type text NOT NULL,
//   body text NOT NULL,
//   read boolean NOT NULL DEFAULT false,
//   created_at timestamptz NOT NULL DEFAULT now()
// );
//
// ALTER TABLE squad_notification_prefs ENABLE ROW LEVEL SECURITY;
// ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
// CREATE POLICY "Users manage own prefs" ON squad_notification_prefs FOR ALL USING (auth.uid() = user_id);
// CREATE POLICY "Users read own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
// CREATE POLICY "Authenticated users insert notifications" ON notifications FOR INSERT TO authenticated WITH CHECK (true);

import { useState, useEffect } from 'react';
import { colors, fonts, card, button, input } from '../styles/theme';
import { getGameById } from '../data/games';
import { getGameById as getIgdbGame } from '../lib/igdb';
import { GENRE_COLORS } from '../components/GameCard';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import RequireAuth from '../components/auth/RequireAuth';

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  return formatDate(iso);
}

const NOTIF_META = {
  poll_created:          { icon: '📊', sectionId: 'section-polls' },
  poll_closing_soon:     { icon: '⏱',  sectionId: 'section-polls' },
  game_night_scheduled:  { icon: '📅', sectionId: 'section-meetup' },
  thread_created:        { icon: '💬', sectionId: 'section-threads' },
  replied_in_thread:     { icon: '↩',  sectionId: 'section-threads' },
  mentioned_in_thread:   { icon: '@',  sectionId: 'section-threads' },
};

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

// poll: { id, question, options, myVote (number|null), tallies }
// castVote(optionIndex)
function PollSection({ poll, castVote }) {
  const hasVoted = poll.myVote !== null && poll.myVote !== undefined;
  const tallies = poll.tallies;
  const total = tallies.reduce((a, b) => a + b, 0);

  return (
    <div style={{ ...card, padding: '16px 20px', marginBottom: 12 }}>
      <div style={{ fontFamily: fonts.heading, fontSize: 16, fontWeight: 700, color: colors.text, marginBottom: 12 }}>
        {poll.question}
      </div>
      {poll.options.map((opt, i) => {
        const pct = total > 0 ? Math.round((tallies[i] / total) * 100) : 0;
        const isMyVote = poll.myVote === i;
        return (
          <div key={i} style={{ marginBottom: 8, position: 'relative' }}>
            <div style={{
              border: `1px solid ${isMyVote ? colors.navy : colors.border}`,
              borderRadius: 8,
              overflow: 'hidden',
              background: colors.white,
              cursor: hasVoted ? 'default' : 'pointer',
            }}
              onClick={() => !hasVoted && castVote(i)}
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
        {total} vote{total !== 1 ? 's' : ''} · {hasVoted ? 'Voted' : 'Click an option to vote'}
      </div>
    </div>
  );
}

// onCreate(question, options[])
function CreatePollForm({ onCreate }) {
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
    onCreate(question.trim() || 'What should we play next?', filled);
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

// threads: [{ id, title, author, date, replies: [{ id, author, body, date }] }]
// onCreateThread(title), onAddReply(threadId, body)
function ThreadSection({ threads, onCreateThread, onAddReply, currentUser }) {
  const [newTitle, setNewTitle] = useState('');
  const [replyText, setReplyText] = useState({});
  const [openThread, setOpenThread] = useState(null);

  function createThread() {
    if (!newTitle.trim()) return;
    onCreateThread(newTitle.trim());
    setNewTitle('');
  }

  function addReply(threadId) {
    const text = (replyText[threadId] || '').trim();
    if (!text) return;
    onAddReply(threadId, text);
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

// selected: [{id, username}], onAdd(user), onRemove(userId), excludeUsernames: string[]
function MemberSearchInput({ selected, onAdd, onRemove, excludeUsernames = [], placeholder = 'Search usernames…' }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!query.trim()) { setSuggestions([]); setOpen(false); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      const { data } = await supabase
        .from('profiles')
        .select('id, username')
        .ilike('username', `${query.trim()}%`)
        .limit(8);
      const filtered = (data || []).filter(u => !excludeUsernames.includes(u.username));
      setSuggestions(filtered);
      setOpen(true);
      setSearching(false);
    }, 200);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function pick(user) {
    onAdd(user);
    setQuery('');
    setSuggestions([]);
    setOpen(false);
  }

  return (
    <div style={{ position: 'relative' }}>
      {selected.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {selected.map(u => (
            <div key={u.id} style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: colors.navy, color: colors.white,
              borderRadius: 14, padding: '3px 8px 3px 10px',
              fontFamily: fonts.body, fontSize: 13,
            }}>
              {u.username}
              <button
                onClick={() => onRemove(u.id)}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: '0 0 0 2px', fontSize: 15, lineHeight: 1 }}
              >×</button>
            </div>
          ))}
        </div>
      )}
      <input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={e => setQuery(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        style={{ ...input.base, fontSize: 14 }}
      />
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
          background: colors.white, border: `1px solid ${colors.border}`,
          borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', marginTop: 2,
        }}>
          {searching && (
            <div style={{ padding: '10px 14px', fontFamily: fonts.body, fontSize: 13, color: colors.muted }}>
              Searching…
            </div>
          )}
          {!searching && suggestions.length === 0 && (
            <div style={{ padding: '10px 14px', fontFamily: fonts.body, fontSize: 13, color: colors.muted }}>
              No users found for "{query}"
            </div>
          )}
          {!searching && suggestions.map(u => (
            <div
              key={u.id}
              onMouseDown={() => pick(u)}
              style={{ padding: '9px 14px', cursor: 'pointer', fontFamily: fonts.body, fontSize: 14, color: colors.text, display: 'flex', alignItems: 'center', gap: 8 }}
              onMouseEnter={e => e.currentTarget.style.background = colors.lightBg}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <MemberAvatar name={u.username} size={24} />
              {u.username}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SquadPage({ navigateTo }) {
  const { user, profile, loading, isLoggedIn } = useAuth();
  const currentUser = profile?.username || null;

  const [squads, setSquads] = useState([]);
  const [squadsLoading, setSquadsLoading] = useState(true);
  const [activeSquadId, setActiveSquadId] = useState(null);
  const [polls, setPolls] = useState([]);
  const [threads, setThreads] = useState([]);
  const [topGames, setTopGames] = useState([]);
  const [squadWishlist, setSquadWishlist] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [squadName, setSquadName] = useState('');
  const [invitedMembers, setInvitedMembers] = useState([]);
  const [addingMember, setAddingMember] = useState(false);
  const [newMembers, setNewMembers] = useState([]);
  const [meetupInput, setMeetupInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState({
    poll_created: true, poll_closing_soon: true, game_night_scheduled: true,
    thread_created: true, mentioned_in_thread: true, replied_in_thread: true,
  });
  const [notifications, setNotifications] = useState([]);
  const [notifsOpen, setNotifsOpen] = useState(false);
  const [notifsLoading, setNotifsLoading] = useState(false);

  const resolvedId = activeSquadId || squads[0]?.id || null;
  const currentSquad = resolvedId ? squads.find(s => s.id === resolvedId) : null;

  // ── data loaders ──────────────────────────────────────────────────────────

  async function loadSquads() {
    if (!user?.id) return;
    const { data: memberRows } = await supabase
      .from('squad_members')
      .select('squad_id')
      .eq('user_id', user.id);

    if (!memberRows?.length) {
      setSquads([]);
      setSquadsLoading(false);
      return;
    }

    const squadIds = memberRows.map(r => r.squad_id);

    const [{ data: squadRows }, { data: allMemberRows }] = await Promise.all([
      supabase
        .from('squads')
        .select('id, name, owner_id, meetup_date')
        .in('id', squadIds)
        .order('created_at', { ascending: false }),
      supabase
        .from('squad_members')
        .select('squad_id, user_id')
        .in('squad_id', squadIds),
    ]);

    const uniqueUserIds = [...new Set((allMemberRows || []).map(m => m.user_id))];
    const { data: profileRows } = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', uniqueUserIds);

    const profileMap = Object.fromEntries((profileRows || []).map(p => [p.id, p.username]));

    const assembled = (squadRows || []).map(s => ({
      ...s,
      members: (allMemberRows || [])
        .filter(m => m.squad_id === s.id)
        .map(m => ({ user_id: m.user_id, username: profileMap[m.user_id] || 'unknown' })),
    }));

    setSquads(assembled);
    setSquadsLoading(false);
  }

  async function loadPolls(squadId) {
    const { data: pollRows } = await supabase
      .from('polls')
      .select('id, question, options, created_at')
      .eq('squad_id', squadId)
      .order('created_at', { ascending: false });

    if (!pollRows?.length) { setPolls([]); return; }

    const pollIds = pollRows.map(p => p.id);

    const [{ data: myVoteRows }, { data: allVoteRows }] = await Promise.all([
      supabase.from('poll_votes').select('poll_id, option_index').eq('user_id', user.id).in('poll_id', pollIds),
      supabase.from('poll_votes').select('poll_id, option_index').in('poll_id', pollIds),
    ]);

    const assembled = pollRows.map(p => {
      const myVoteRow = (myVoteRows || []).find(v => v.poll_id === p.id);
      const tallies = p.options.map((_, i) =>
        (allVoteRows || []).filter(v => v.poll_id === p.id && v.option_index === i).length
      );
      return {
        id: p.id,
        question: p.question,
        options: p.options,
        myVote: myVoteRow?.option_index ?? null,
        tallies,
      };
    });

    setPolls(assembled);
  }

  async function loadThreads(squadId) {
    const { data: threadRows } = await supabase
      .from('threads')
      .select('id, title, created_at, user_id')
      .eq('squad_id', squadId)
      .order('created_at', { ascending: false });

    if (!threadRows?.length) { setThreads([]); return; }

    const threadIds = threadRows.map(t => t.id);
    const { data: replyRows } = await supabase
      .from('replies')
      .select('id, thread_id, body, created_at, user_id')
      .in('thread_id', threadIds)
      .order('created_at', { ascending: true });

    const allUserIds = [
      ...new Set([
        ...threadRows.map(t => t.user_id),
        ...(replyRows || []).map(r => r.user_id),
      ]),
    ];
    const { data: profileRows } = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', allUserIds);

    const profileMap = Object.fromEntries((profileRows || []).map(p => [p.id, p.username]));

    const assembled = threadRows.map(t => ({
      id: t.id,
      title: t.title,
      author: profileMap[t.user_id] || 'unknown',
      date: formatDate(t.created_at),
      replies: (replyRows || [])
        .filter(r => r.thread_id === t.id)
        .map(r => ({
          id: r.id,
          author: profileMap[r.user_id] || 'unknown',
          body: r.body,
          date: formatDate(r.created_at),
        })),
    }));

    setThreads(assembled);
  }

  async function loadTopGames(squad) {
    const memberIds = squad.members.map(m => m.user_id);
    if (!memberIds.length) { setTopGames([]); return; }

    const { data: top10Rows } = await supabase
      .from('top10')
      .select('user_id, game_id, rank')
      .in('user_id', memberIds);

    if (!top10Rows?.length) { setTopGames([]); return; }

    const scores = {};
    top10Rows.forEach(row => {
      const pts = 11 - row.rank;
      scores[row.game_id] = (scores[row.game_id] || 0) + pts;
    });

    const ranked = Object.entries(scores)
      .map(([game_id, score]) => ({ game: getGameById(Number(game_id)), score }))
      .filter(({ game }) => game)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    setTopGames(ranked);
  }

  async function loadSquadWishlist(squad) {
    const memberIds = squad.members.map(m => m.user_id);
    if (memberIds.length < 2) { setSquadWishlist([]); return; }

    const { data: wishlistRows } = await supabase
      .from('wishlist')
      .select('user_id, game_id')
      .in('user_id', memberIds);

    if (!wishlistRows?.length) { setSquadWishlist([]); return; }

    const counts = {};
    wishlistRows.forEach(row => {
      counts[row.game_id] = (counts[row.game_id] || 0) + 1;
    });

    const qualifying = Object.entries(counts)
      .filter(([, count]) => count >= 2)
      .sort(([, a], [, b]) => b - a);

    if (!qualifying.length) { setSquadWishlist([]); return; }

    const igdbEntries = qualifying.filter(([id]) => String(id).startsWith('igdb_'));
    const localEntries = qualifying.filter(([id]) => !String(id).startsWith('igdb_'));

    const [igdbResults] = await Promise.all([
      Promise.all(igdbEntries.map(([id]) => getIgdbGame(id).then(g => g ? [id, g] : null))),
    ]);

    const gameMap = {};
    igdbResults.filter(Boolean).forEach(([id, g]) => { gameMap[id] = g; });
    localEntries.forEach(([id]) => {
      const g = getGameById(Number(id));
      if (g) gameMap[id] = g;
    });

    setSquadWishlist(
      qualifying
        .map(([id, count]) => ({ game: gameMap[id], count }))
        .filter(({ game }) => game)
    );
  }

  async function loadNotifications() {
    setNotifsLoading(true);
    const { data: rows } = await supabase
      .from('notifications')
      .select('id, squad_id, type, body, read, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30);

    if (!rows?.length) { setNotifications([]); setNotifsLoading(false); return; }

    const squadIds = [...new Set(rows.map(r => r.squad_id).filter(Boolean))];
    const { data: squadRows } = await supabase
      .from('squads').select('id, name').in('id', squadIds);
    const squadNameMap = Object.fromEntries((squadRows || []).map(s => [s.id, s.name]));

    setNotifications(rows.map(r => ({ ...r, squad_name: squadNameMap[r.squad_id] || 'Unknown squad' })));
    setNotifsLoading(false);
  }

  async function markRead(id) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    await supabase.from('notifications').update({ read: true }).eq('id', id).eq('user_id', user.id);
  }

  async function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id);
  }

  async function handleNotifClick(notif) {
    if (!notif.read) await markRead(notif.id);
    setActiveSquadId(notif.squad_id);
    setCreating(false);
    setNotifsOpen(false);
    const sectionId = NOTIF_META[notif.type]?.sectionId;
    if (sectionId) {
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 400);
    }
  }

  async function loadNotifPrefs(squadId) {
    const { data } = await supabase
      .from('squad_notification_prefs')
      .select('*')
      .eq('user_id', user.id)
      .eq('squad_id', squadId)
      .single();
    setNotifPrefs(data ? {
      poll_created: data.poll_created,
      poll_closing_soon: data.poll_closing_soon,
      game_night_scheduled: data.game_night_scheduled,
      thread_created: data.thread_created,
      mentioned_in_thread: data.mentioned_in_thread,
      replied_in_thread: data.replied_in_thread,
    } : {
      poll_created: true, poll_closing_soon: true, game_night_scheduled: true,
      thread_created: true, mentioned_in_thread: true, replied_in_thread: true,
    });
  }

  // Returns member user_ids (excluding self) who have prefKey = true (or no row → default true).
  async function getSubscribedMemberIds(squadId, prefKey) {
    const squad = squads.find(s => s.id === squadId);
    if (!squad) return [];
    const memberIds = squad.members.map(m => m.user_id);
    const { data: prefRows } = await supabase
      .from('squad_notification_prefs')
      .select(`user_id, ${prefKey}`)
      .eq('squad_id', squadId)
      .in('user_id', memberIds);
    const prefMap = Object.fromEntries((prefRows || []).map(r => [r.user_id, r[prefKey]]));
    return memberIds.filter(id => {
      if (id === user.id) return false;
      const pref = prefMap[id];
      return pref === undefined ? true : pref;
    });
  }

  async function insertNotifications(userIds, squadId, type, body) {
    if (!userIds.length) return;
    await supabase.from('notifications').insert(
      userIds.map(userId => ({ user_id: userId, squad_id: squadId, type, body }))
    );
  }

  // TODO: mentioned_in_thread — trigger when a reply body is saved.
  // Scan reply `body` for @username patterns: const mentions = body.match(/@(\w+)/g)?.map(m => m.slice(1)) ?? [];
  // Then: SELECT id FROM profiles WHERE username = ANY(mentions) AND id IN (squad member ids).
  // Filter those user_ids by mentioned_in_thread pref (same getSubscribedMemberIds pattern).
  // Insert notification type 'mentioned_in_thread', body: `${actorUsername} mentioned you in ${squadName}: ${threadTitle}`
  // Call this inside addReply() after the existing replied_in_thread block, excluding users already notified there.

  // TODO: poll_closing_soon — requires a scheduled background job (e.g. Supabase pg_cron or Edge Function on a cron).
  // Query: SELECT p.id, p.question, p.closes_at, p.squad_id, s.name AS squad_name
  //        FROM polls p JOIN squads s ON s.id = p.squad_id
  //        WHERE p.closes_at BETWEEN now() AND now() + interval '1 hour'
  //          AND p.closing_soon_notified = false;
  // For each matching poll: getSubscribedMemberIds(squad_id, 'poll_closing_soon'), insertNotifications(..., 'poll_closing_soon', ...)
  // Then: UPDATE polls SET closing_soon_notified = true WHERE id = ANY(notified_ids);
  // Requires adding `closes_at timestamptz` and `closing_soon_notified boolean DEFAULT false` columns to the polls table.

  async function saveNotifPref(key, value) {
    setNotifPrefs(prev => ({ ...prev, [key]: value }));
    await supabase
      .from('squad_notification_prefs')
      .upsert({ user_id: user.id, squad_id: resolvedId, [key]: value }, { onConflict: 'user_id,squad_id' });
  }

  // ── effects ───────────────────────────────────────────────────────────────

  useEffect(() => { // eslint-disable-line react-hooks/exhaustive-deps
    if (user?.id) { loadSquads(); loadNotifications(); }
  }, [user?.id]); // eslint-disable-line

  useEffect(() => {
    if (!resolvedId) return;
    const squad = squads.find(s => s.id === resolvedId);
    if (!squad) return;
    setAddingMember(false);
    setNewMembers([]);
    setSquadWishlist([]);
    setShowSettings(false);
    setDetailLoading(true);
    Promise.all([
      loadPolls(resolvedId),
      loadThreads(resolvedId),
      loadTopGames(squad),
      loadSquadWishlist(squad),
      loadNotifPrefs(resolvedId),
    ]).finally(() => setDetailLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedId]);

  // ── mutations ─────────────────────────────────────────────────────────────

  async function createSquad() {
    if (!squadName.trim() || submitting) return;
    setSubmitting(true);

    const { data: squad, error } = await supabase
      .from('squads')
      .insert({ name: squadName.trim(), owner_id: user.id })
      .select('id')
      .single();

    if (error) { setSubmitting(false); return; }

    await supabase.from('squad_members').insert({ squad_id: squad.id, user_id: user.id });

    for (const m of invitedMembers) {
      await supabase.from('squad_members').insert({ squad_id: squad.id, user_id: m.id });
    }

    await loadSquads();
    setActiveSquadId(squad.id);
    setCreating(false);
    setSquadName('');
    setInvitedMembers([]);
    setSubmitting(false);
  }

  async function addMemberToSquad(squadId, members) {
    for (const m of members) {
      await supabase.from('squad_members').insert({ squad_id: squadId, user_id: m.id });
    }
    await loadSquads();
    setAddingMember(false);
    setNewMembers([]);
  }

  async function castVote(pollId, optionIndex) {
    setPolls(prev => prev.map(p => {
      if (p.id !== pollId) return p;
      return {
        ...p,
        myVote: optionIndex,
        tallies: p.tallies.map((t, i) => i === optionIndex ? t + 1 : t),
      };
    }));

    const { error } = await supabase
      .from('poll_votes')
      .insert({ poll_id: pollId, user_id: user.id, option_index: optionIndex });

    if (error) {
      setPolls(prev => prev.map(p => {
        if (p.id !== pollId) return p;
        return {
          ...p,
          myVote: null,
          tallies: p.tallies.map((t, i) => i === optionIndex ? t - 1 : t),
        };
      }));
    }
  }

  async function createPoll(question, options) {
    const { error } = await supabase
      .from('polls')
      .insert({ squad_id: resolvedId, question, options });
    if (!error) {
      await loadPolls(resolvedId);
      const recipientIds = await getSubscribedMemberIds(resolvedId, 'poll_created');
      await insertNotifications(recipientIds, resolvedId, 'poll_created',
        `${currentUser} started a new poll in ${currentSquad.name}: ${question}`);
    }
  }

  async function createThread(title) {
    const { error } = await supabase
      .from('threads')
      .insert({ squad_id: resolvedId, user_id: user.id, title });
    if (!error) {
      await loadThreads(resolvedId);
      const recipientIds = await getSubscribedMemberIds(resolvedId, 'thread_created');
      await insertNotifications(recipientIds, resolvedId, 'thread_created',
        `${currentUser} started a new thread in ${currentSquad.name}: ${title}`);
    }
  }

  async function addReply(threadId, body) {
    // Capture thread title before await (threads state is current at call time).
    const thread = threads.find(t => t.id === threadId);
    const threadTitle = thread?.title || 'a thread';

    const { error } = await supabase
      .from('replies')
      .insert({ thread_id: threadId, user_id: user.id, body });
    if (!error) {
      await loadThreads(resolvedId);

      // Notify all prior participants in this thread (author + previous repliers) who opted in.
      const [{ data: priorReplies }, { data: threadRow }] = await Promise.all([
        supabase.from('replies').select('user_id').eq('thread_id', threadId).neq('user_id', user.id),
        supabase.from('threads').select('user_id').eq('id', threadId).single(),
      ]);
      const participantIds = [...new Set([
        ...(priorReplies || []).map(r => r.user_id),
        ...(threadRow ? [threadRow.user_id] : []),
      ])].filter(id => id !== user.id);

      if (participantIds.length) {
        const { data: prefRows } = await supabase
          .from('squad_notification_prefs')
          .select('user_id, replied_in_thread')
          .eq('squad_id', resolvedId)
          .in('user_id', participantIds);
        const prefMap = Object.fromEntries((prefRows || []).map(r => [r.user_id, r.replied_in_thread]));
        const recipientIds = participantIds.filter(id => {
          const pref = prefMap[id];
          return pref === undefined ? true : pref;
        });
        await insertNotifications(recipientIds, resolvedId, 'replied_in_thread',
          `${currentUser} replied in a thread you're following: ${threadTitle}`);
      }
    }
  }

  async function saveMeetup(squadId) {
    if (!meetupInput) return;
    await supabase.from('squads').update({ meetup_date: meetupInput }).eq('id', squadId);
    setSquads(prev => prev.map(s => s.id === squadId ? { ...s, meetup_date: meetupInput } : s));
    const formattedDate = new Date(meetupInput).toLocaleString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit',
    });
    const squad = squads.find(s => s.id === squadId);
    const recipientIds = await getSubscribedMemberIds(squadId, 'game_night_scheduled');
    await insertNotifications(recipientIds, squadId, 'game_night_scheduled',
      `Game night in ${squad?.name || 'your squad'} is scheduled for ${formattedDate}`);
    setMeetupInput('');
  }

  // ── render ────────────────────────────────────────────────────────────────

  if (loading) return null;
  if (!isLoggedIn) return <RequireAuth message="Log in to view your squads." />;
  if (!currentUser) return null;

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

        {squadsLoading ? (
          <div style={{ fontFamily: fonts.body, fontSize: 13, color: colors.muted, padding: '8px 0' }}>
            Loading…
          </div>
        ) : squads.map(s => (
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

        {/* ── Notification Feed ─────────────────────────────────────────── */}
        {(() => {
          const unread = notifications.filter(n => !n.read);
          const read   = notifications.filter(n => n.read);
          const unreadCount = unread.length;
          return (
            <div style={{ marginBottom: 20 }}>
              {/* Bell trigger row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: notifsOpen ? 10 : 0 }}>
                <button
                  onClick={() => { if (notifsOpen) { setNotifsOpen(false); } else { loadNotifications(); setNotifsOpen(true); } }}
                  style={{
                    position: 'relative', background: 'none', border: 'none',
                    cursor: 'pointer', padding: 4, color: colors.navy,
                    display: 'flex', alignItems: 'center',
                  }}
                  title="Notifications"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                  {unreadCount > 0 && (
                    <span style={{
                      position: 'absolute', top: 0, right: 0,
                      background: colors.orange, color: colors.white,
                      borderRadius: '50%', width: 16, height: 16,
                      fontSize: 9, fontFamily: fonts.body, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      lineHeight: 1,
                    }}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                {notifsOpen && unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontFamily: fonts.body, fontSize: 12, color: colors.muted,
                      padding: 0, textDecoration: 'underline',
                    }}
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              {/* Feed panel */}
              {notifsOpen && (
                <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
                  {notifsLoading ? (
                    <div style={{ padding: '16px 18px', fontFamily: fonts.body, fontSize: 13, color: colors.muted }}>
                      Loading…
                    </div>
                  ) : notifications.length === 0 ? (
                    <div style={{ padding: '24px 18px', fontFamily: fonts.body, fontSize: 14, color: colors.muted, textAlign: 'center' }}>
                      No notifications yet
                    </div>
                  ) : (
                    <>
                      {unread.map((n, i) => (
                        <div
                          key={n.id}
                          onClick={() => handleNotifClick(n)}
                          style={{
                            display: 'flex', alignItems: 'flex-start', gap: 12,
                            padding: '12px 16px',
                            borderBottom: i < unread.length - 1 || read.length > 0 ? `1px solid ${colors.border}` : 'none',
                            cursor: 'pointer',
                            background: '#FFF8F3',
                            borderLeft: `3px solid ${colors.orange}`,
                            transition: 'background 0.12s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#FFF0E6'}
                          onMouseLeave={e => e.currentTarget.style.background = '#FFF8F3'}
                        >
                          <span style={{ fontSize: 16, flexShrink: 0, lineHeight: 1.4 }}>
                            {NOTIF_META[n.type]?.icon || '•'}
                          </span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontFamily: fonts.body, fontSize: 13, color: colors.text, lineHeight: 1.45 }}>
                              {n.body}
                            </div>
                            <div style={{ display: 'flex', gap: 8, marginTop: 3 }}>
                              <span style={{ fontFamily: fonts.body, fontSize: 11, color: colors.muted }}>{n.squad_name}</span>
                              <span style={{ fontFamily: fonts.body, fontSize: 11, color: colors.muted }}>·</span>
                              <span style={{ fontFamily: fonts.body, fontSize: 11, color: colors.muted }}>{timeAgo(n.created_at)}</span>
                            </div>
                          </div>
                        </div>
                      ))}

                      {unread.length > 0 && read.length > 0 && (
                        <div style={{
                          padding: '5px 16px',
                          background: colors.lightBg,
                          fontFamily: fonts.body, fontSize: 10, fontWeight: 700,
                          textTransform: 'uppercase', letterSpacing: '0.6px', color: colors.muted,
                        }}>
                          Read
                        </div>
                      )}

                      {read.map((n, i) => (
                        <div
                          key={n.id}
                          onClick={() => handleNotifClick(n)}
                          style={{
                            display: 'flex', alignItems: 'flex-start', gap: 12,
                            padding: '12px 16px',
                            borderBottom: i < read.length - 1 ? `1px solid ${colors.border}` : 'none',
                            cursor: 'pointer',
                            background: colors.white,
                            borderLeft: '3px solid transparent',
                            transition: 'background 0.12s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = colors.lightBg}
                          onMouseLeave={e => e.currentTarget.style.background = colors.white}
                        >
                          <span style={{ fontSize: 16, flexShrink: 0, lineHeight: 1.4, opacity: 0.5 }}>
                            {NOTIF_META[n.type]?.icon || '•'}
                          </span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontFamily: fonts.body, fontSize: 13, color: colors.muted, lineHeight: 1.45 }}>
                              {n.body}
                            </div>
                            <div style={{ display: 'flex', gap: 8, marginTop: 3 }}>
                              <span style={{ fontFamily: fonts.body, fontSize: 11, color: colors.muted }}>{n.squad_name}</span>
                              <span style={{ fontFamily: fonts.body, fontSize: 11, color: colors.muted }}>·</span>
                              <span style={{ fontFamily: fonts.body, fontSize: 11, color: colors.muted }}>{timeAgo(n.created_at)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })()}

        {/* Create form */}
        {creating && (
          <div style={{ ...card, padding: '24px 28px', marginBottom: 24 }}>
            <h2 style={{ fontFamily: fonts.pixel, fontSize: 10, color: colors.text, margin: '0 0 18px', lineHeight: 1.6 }}>
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
                <span style={{ fontWeight: 400, color: colors.muted }}>(optional — you can add members later)</span>
              </label>
              <MemberSearchInput
                selected={invitedMembers}
                onAdd={u => setInvitedMembers(prev => [...prev, u])}
                onRemove={id => setInvitedMembers(prev => prev.filter(u => u.id !== id))}
                excludeUsernames={[profile.username, ...invitedMembers.map(u => u.username)]}
                placeholder="Search for a member…"
              />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={createSquad}
                disabled={submitting}
                style={{ ...button.primary, opacity: submitting ? 0.6 : 1, cursor: submitting ? 'not-allowed' : 'pointer' }}
              >
                {submitting ? 'Creating…' : 'Create Squad'}
              </button>
              <button
                onClick={() => { setCreating(false); setSquadName(''); setInvitedMembers([]); }}
                style={button.ghost}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!currentSquad && !creating && !squadsLoading && (
          <div style={{ textAlign: 'center', padding: '60px 24px', ...card }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎮</div>
            <h2 style={{ fontFamily: fonts.pixel, fontSize: 11, color: colors.text, marginBottom: 12, lineHeight: 1.6 }}>
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
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
                <h1 style={{ fontFamily: fonts.pixel, fontSize: 12, color: colors.text, margin: 0, lineHeight: 1.6 }}>
                  {currentSquad.name}
                </h1>
                <button
                  onClick={() => setShowSettings(s => !s)}
                  style={{ ...button.ghost, fontSize: 12, padding: '5px 12px', whiteSpace: 'nowrap', flexShrink: 0 }}
                >
                  {showSettings ? '✕ Close Settings' : '⚙ Squad Settings'}
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap' }}>
                {currentSquad.members.map((m, i) => (
                  <div
                    key={m.user_id}
                    title={m.username === currentUser ? `${m.username} (you)` : m.username}
                    style={{ marginLeft: i === 0 ? 0 : -8, zIndex: currentSquad.members.length - i }}
                  >
                    <MemberAvatar name={m.username} size={36} isYou={m.username === currentUser} />
                  </div>
                ))}
                <div style={{ marginLeft: 14 }}>
                  {currentSquad.members.map((m, i) => (
                    <span key={m.user_id} style={{
                      fontFamily: fonts.body,
                      fontSize: 13,
                      color: m.username === currentUser ? colors.orange : colors.text,
                      fontWeight: m.username === currentUser ? 700 : 400,
                    }}>
                      {m.username === currentUser ? `${m.username} (you)` : m.username}
                      {i < currentSquad.members.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </div>
              </div>

              {/* Add member */}
              {!addingMember ? (
                <button
                  onClick={() => setAddingMember(true)}
                  style={{ ...button.ghost, marginTop: 12, fontSize: 13, padding: '5px 12px' }}
                >
                  + Add member
                </button>
              ) : (
                <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <MemberSearchInput
                      selected={newMembers}
                      onAdd={u => setNewMembers(prev => [...prev, u])}
                      onRemove={id => setNewMembers(prev => prev.filter(u => u.id !== id))}
                      excludeUsernames={currentSquad.members.map(m => m.username).concat(newMembers.map(u => u.username))}
                      placeholder="Search for a member…"
                    />
                  </div>
                  <button
                    onClick={() => addMemberToSquad(currentSquad.id, newMembers)}
                    disabled={newMembers.length === 0}
                    style={{ ...button.secondary, fontSize: 13, padding: '8px 14px', opacity: newMembers.length === 0 ? 0.5 : 1, cursor: newMembers.length === 0 ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}
                  >
                    Add
                  </button>
                  <button
                    onClick={() => { setAddingMember(false); setNewMembers([]); }}
                    style={{ ...button.ghost, fontSize: 13, padding: '8px 14px', whiteSpace: 'nowrap' }}
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Inline Settings Panel */}
              {showSettings && (
                <div style={{ ...card, padding: '18px 22px', marginTop: 16, background: colors.lightBg }}>
                  <div style={{ fontFamily: fonts.body, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: colors.muted, marginBottom: 14 }}>
                    Notifications
                  </div>
                  {[
                    { key: 'poll_created',          label: 'When a poll is created' },
                    { key: 'poll_closing_soon',      label: 'When a poll is 1 hour from closing' },
                    { key: 'game_night_scheduled',   label: 'When a game night has been scheduled' },
                    { key: 'thread_created',         label: 'When a thread is created' },
                    { key: 'mentioned_in_thread',    label: "When I'm mentioned in a thread" },
                    { key: 'replied_in_thread',      label: "When someone replies to a thread I've commented in" },
                  ].map(({ key, label }, idx, arr) => (
                    <div
                      key={key}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                        padding: '10px 0',
                        borderBottom: idx < arr.length - 1 ? `1px solid ${colors.border}` : 'none',
                      }}
                    >
                      <span style={{ fontFamily: fonts.body, fontSize: 14, color: colors.text }}>{label}</span>
                      <div
                        onClick={() => saveNotifPref(key, !notifPrefs[key])}
                        style={{
                          width: 38, height: 22, borderRadius: 11, cursor: 'pointer', flexShrink: 0,
                          background: notifPrefs[key] ? colors.navy : colors.border,
                          position: 'relative', transition: 'background 0.2s',
                        }}
                      >
                        <div style={{
                          position: 'absolute', top: 3,
                          left: notifPrefs[key] ? 19 : 3,
                          width: 16, height: 16, borderRadius: '50%', background: colors.white,
                          transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {detailLoading ? (
              <div style={{ fontFamily: fonts.body, fontSize: 14, color: colors.muted, padding: '40px 0', textAlign: 'center' }}>
                Loading…
              </div>
            ) : (
              <>
                {/* Top Games */}
                <div style={{ ...card, padding: '18px 22px', marginBottom: 20 }}>
                  <h2 style={{ fontFamily: fonts.pixel, fontSize: 10, color: colors.text, margin: '0 0 16px' }}>
                    Squad's Top Games
                  </h2>
                  {topGames.length === 0 ? (
                    <p style={{ fontFamily: fonts.body, fontSize: 13, color: colors.muted }}>
                      Squad members need to add games to their Top 10 on their Player page first.
                    </p>
                  ) : topGames.map(({ game, score }, idx) => {
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
                  })}
                </div>

                {/* Squad Wishlist */}
                <div style={{ ...card, padding: '18px 22px', marginBottom: 20 }}>
                  <h2 style={{ fontFamily: fonts.pixel, fontSize: 10, color: colors.text, margin: '0 0 16px' }}>
                    Squad Wishlist
                  </h2>
                  {squadWishlist.length === 0 ? (
                    <p style={{ fontFamily: fonts.body, fontSize: 13, color: colors.muted }}>
                      No games in common yet — start wishlisting!
                    </p>
                  ) : (
                    <div style={{
                      display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8,
                      scrollbarWidth: 'thin', scrollbarColor: `${colors.border} transparent`,
                    }}>
                      {squadWishlist.map(({ game, count }) => (
                        <div
                          key={game.id}
                          onClick={() => navigateTo && navigateTo('game', game)}
                          style={{
                            width: 130, minWidth: 130, background: colors.white,
                            border: `1px solid ${colors.border}`, borderRadius: 8,
                            overflow: 'hidden', cursor: 'pointer', flexShrink: 0,
                            transition: 'transform 0.15s, box-shadow 0.15s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; }}
                          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                        >
                          <div style={{
                            height: 90, background: game.coverColor || colors.navy,
                            position: 'relative', overflow: 'hidden',
                          }}>
                            {game.coverUrl && (
                              <img src={game.coverUrl} alt={game.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                            )}
                            <div style={{
                              position: 'absolute', bottom: 5, right: 5,
                              background: 'rgba(0,0,0,0.65)', color: colors.white,
                              borderRadius: 4, padding: '2px 6px',
                              fontFamily: fonts.body, fontSize: 10, fontWeight: 700,
                            }}>
                              {count} member{count !== 1 ? 's' : ''}
                            </div>
                          </div>
                          <div style={{
                            padding: '8px 10px', fontFamily: fonts.heading, fontSize: 12,
                            fontWeight: 700, color: colors.text, lineHeight: 1.3,
                            overflow: 'hidden', display: '-webkit-box',
                            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                          }}>
                            {game.title}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Polls */}
                <div id="section-polls" style={{ ...card, padding: '18px 22px', marginBottom: 20 }}>
                  <h2 style={{ fontFamily: fonts.pixel, fontSize: 10, color: colors.text, margin: '0 0 16px' }}>
                    Polls
                  </h2>
                  <CreatePollForm onCreate={createPoll} />
                  {polls.length === 0 && (
                    <p style={{ fontFamily: fonts.body, fontSize: 13, color: colors.muted, textAlign: 'center', padding: '4px 0 8px' }}>
                      No polls yet. Create one above!
                    </p>
                  )}
                  {polls.map(poll => (
                    <PollSection
                      key={poll.id}
                      poll={poll}
                      castVote={i => castVote(poll.id, i)}
                    />
                  ))}
                </div>

                {/* Next Meetup */}
                <div id="section-meetup" style={{ ...card, padding: '18px 22px', marginBottom: 20 }}>
                  <h2 style={{ fontFamily: fonts.pixel, fontSize: 10, color: colors.text, margin: '0 0 16px' }}>
                    Next Game Night
                  </h2>
                  {currentSquad.meetup_date ? (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontFamily: fonts.body, fontSize: 15, color: colors.text, marginBottom: 6 }}>
                        📅 {new Date(currentSquad.meetup_date).toLocaleString('en-US', {
                          weekday: 'long', month: 'long', day: 'numeric',
                          hour: 'numeric', minute: '2-digit',
                        })}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontFamily: fonts.body, fontSize: 13, color: colors.muted }}>Countdown: </span>
                        <Countdown target={currentSquad.meetup_date} />
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
                      onClick={() => saveMeetup(currentSquad.id)}
                      style={{ ...button.secondary, whiteSpace: 'nowrap' }}
                    >
                      {currentSquad.meetup_date ? 'Update' : 'Schedule'}
                    </button>
                  </div>
                </div>

                {/* Threads */}
                <div id="section-threads" style={{ ...card, padding: '18px 22px' }}>
                  <h2 style={{ fontFamily: fonts.pixel, fontSize: 10, color: colors.text, margin: '0 0 16px' }}>
                    Threads
                  </h2>
                  <ThreadSection
                    threads={threads}
                    onCreateThread={createThread}
                    onAddReply={addReply}
                    currentUser={currentUser}
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
