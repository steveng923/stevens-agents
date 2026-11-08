import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Activity, ArrowUpRight, CalendarDays, Check, ChevronDown, Command, Dumbbell, LayoutDashboard, ListChecks, Menu, Plus, Search, Settings2, ShieldCheck, Sparkles, Target, Users, X } from 'lucide-react';

type Agent = { id: string; name: string; department: string; purpose: string };
type Task = { id: number; title: string; completed: boolean; created_at: string };
type Conversation = { id: number; title: string; created_at: string; message_count: number };
type Message = { id: number; conversation_id: number; role: 'user' | 'assistant'; content: string; created_at: string };
type Memory = { id: number; key: string; value: string; category: string; source: string; created_at: string };
type Page = 'Overview' | 'Schedule' | 'Tasks' | 'Agents' | 'Goals' | 'Fitness' | 'Settings';

const navigation: { name: Page; icon: typeof LayoutDashboard }[] = [
  { name: 'Overview', icon: LayoutDashboard }, { name: 'Schedule', icon: CalendarDays },
  { name: 'Tasks', icon: ListChecks }, { name: 'Agents', icon: Users },
  { name: 'Goals', icon: Target }, { name: 'Fitness', icon: Dumbbell },
];

function App() {
  const [page, setPage] = useState<Page>('Overview');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [memory, setMemory] = useState<Memory[]>([]);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [chatText, setChatText] = useState('');
  const [memoryKey, setMemoryKey] = useState('');
  const [memoryValue, setMemoryValue] = useState('');
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [a, t, c, m] = await Promise.all([
        fetch('/api/agents'), fetch('/api/tasks'), fetch('/api/conversations'), fetch('/api/memory'),
      ]);
      if (![a, t, c, m].every((r) => r.ok)) throw new Error('API request failed');
      const [agentRows, taskRows, conversationRows, memoryRows] = await Promise.all([
        a.json() as Promise<Agent[]>, t.json() as Promise<Task[]>, c.json() as Promise<Conversation[]>, m.json() as Promise<Memory[]>,
      ]);
      setAgents(agentRows); setTasks(taskRows); setConversations(conversationRows); setMemory(memoryRows);
      const active = conversationRows[0];
      if (active) {
        setConversationId(active.id);
        const response = await fetch(`/api/conversations/${active.id}/messages`);
        if (response.ok) setMessages(await response.json() as Message[]);
      } else { setConversationId(null); setMessages([]); }
      setError('');
    } catch { setError('The local API is unavailable. Start FastAPI, then retry.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  const openTasks = useMemo(() => tasks.filter((task) => !task.completed), [tasks]);
  const filteredTasks = useMemo(() => openTasks.filter((task) => task.title.toLowerCase().includes(search.toLowerCase())), [openTasks, search]);
  const date = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());

  async function addTask(event: FormEvent) {
    event.preventDefault();
    if (!taskTitle.trim()) return;
    try {
      const response = await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: taskTitle.trim() }) });
      if (!response.ok) throw new Error();
      setTasks((items) => [await response.json() as Task, ...items]); setTaskTitle(''); setError('');
    } catch { setError('Task could not be saved. Check the API connection.'); }
  }
  async function toggleTask(task: Task) {
    try {
      const response = await fetch(`/api/tasks/${task.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ completed: !task.completed }) });
      if (!response.ok) throw new Error();
      const updated = await response.json() as Task;
      setTasks((items) => items.map((item) => item.id === task.id ? updated : item));
    } catch { setError('Task update failed.'); }
  }
  async function sendChat(event: FormEvent) {
    event.preventDefault();
    if (!chatText.trim() || busy) return;
    setBusy(true);
    try {
      const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: chatText.trim(), conversation_id: conversationId }) });
      if (!response.ok) throw new Error();
      const result = await response.json() as { conversation_id: number; reply: string };
      setConversationId(result.conversation_id);
      setMessages((items) => [...items,
        { id: Date.now(), conversation_id: result.conversation_id, role: 'user', content: chatText.trim(), created_at: new Date().toISOString() },
        { id: Date.now() + 1, conversation_id: result.conversation_id, role: 'assistant', content: result.reply, created_at: new Date().toISOString() },
      ]);
      setChatText(''); setError('');
      const conversationsResponse = await fetch('/api/conversations');
      if (conversationsResponse.ok) setConversations(await conversationsResponse.json() as Conversation[]);
    } catch { setError('Alfred could not reply. Check the local API.'); }
    finally { setBusy(false); }
  }
  async function saveMemory(event: FormEvent) {
    event.preventDefault();
    if (!memoryKey.trim() || !memoryValue.trim()) return;
    try {
      const response = await fetch('/api/memory', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: memoryKey.trim(), value: memoryValue.trim() }) });
      if (!response.ok) throw new Error();
      setMemory((items) => [await response.json() as Memory, ...items]); setMemoryKey(''); setMemoryValue('');
    } catch { setError('Memory entry was not saved.'); }
  }
  async function deleteMemory(id: number) {
    try {
      const response = await fetch(`/api/memory/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error();
      setMemory((items) => items.filter((entry) => entry.id !== id));
    } catch { setError('Could not delete that memory entry.'); }
  }

  return <div className="app-shell">
    <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
      <div className="brand"><span className="brand-mark"><ShieldCheck size={20}/></span><span><strong>STEVEN'S</strong><small>AGENTS</small></span><button className="icon-button mobile-close" aria-label="Close menu" onClick={() => setMenuOpen(false)}><X size={18}/></button></div>
      <div className="workspace-label">PERSONAL HQ <ChevronDown size={13}/></div>
      <nav className="nav-list" aria-label="Main navigation">{navigation.map(({ name, icon: Icon }) => <button key={name} className={`nav-item ${page === name ? 'active' : ''}`} onClick={() => { setPage(name); setMenuOpen(false); }}><Icon size={17}/><span>{name}</span>{name === 'Tasks' && openTasks.length > 0 && <span className="nav-count">{openTasks.length}</span>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="online-card"><span className="online-dot"/><span><b>Local workspace</b><small>Development mode</small></span></div><button className={`nav-item ${page === 'Settings' ? 'active' : ''}`} onClick={() => setPage('Settings')}><Settings2 size={17}/><span>Settings</span></button><div className="profile"><div className="avatar">S</div><span><b>Steven</b><small>Personal workspace</small></span></div></div>
    </aside>
    {menuOpen && <button className="mobile-scrim" aria-label="Close menu" onClick={() => setMenuOpen(false)}/>}
    <main className="main-area">
      <header className="topbar"><button className="icon-button mobile-menu-button" aria-label="Open menu" onClick={() => setMenuOpen(true)}><Menu size={20}/></button><div className="breadcrumbs"><span>Personal HQ</span><span className="crumb-slash">/</span><strong>{page === 'Overview' ? 'Your command center' : page}</strong></div><label className="search-box"><Search size={16}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search open tasks" aria-label="Search tasks"/><kbd><Command size={11}/> K</kbd></label></header>
      <div className="page-content">
        {error && <div className="alert" role="status">{error}<button onClick={() => void load()}>Retry</button></div>}
        {page === 'Overview' || page === 'Tasks' ? <>
          <section className="welcome-row"><div><p className="eyebrow">{date}</p><h1>{page === 'Tasks' ? 'Your tasks' : <>Good to see you, Steven<span className="gold-dot">.</span></>}</h1><p className="subheading">A clear next step makes a good day.</p></div></section>
          <section className="assistant-banner"><div className="assistant-icon"><Sparkles size={20}/></div><div className="assistant-copy"><span className="eyebrow">ALFRED <span className="status-pill">LOCAL DEMO</span></span><p>I can review saved tasks and offer simple planning guidance. No external AI provider is connected.</p></div><span className="banner-decoration">A</span></section>
          <section className="stats-grid"><article className="stat-card"><span className="stat-icon blue"><ListChecks size={17}/></span><span className="stat-label">Open tasks</span><strong>{loading ? '—' : openTasks.length.toString().padStart(2, '0')}</strong><small>Keep your next step visible</small></article><article className="stat-card"><span className="stat-icon gold"><Users size={17}/></span><span className="stat-label">Agent profiles</span><strong>{loading ? '—' : agents.length.toString().padStart(2, '0')}</strong><small><Activity size={13}/> Starter profiles</small></article><article className="stat-card"><span className="stat-icon green"><CalendarDays size={17}/></span><span className="stat-label">Today's schedule</span><strong>—</strong><small>Calendar not connected</small></article><article className="stat-card"><span className="stat-icon purple"><Target size={17}/></span><span className="stat-label">Active goals</span><strong>—</strong><small>Goals module not built</small></article></section>
          <section className="content-grid"><article className="panel"><div className="panel-heading"><div><p className="eyebrow">YOUR PRIORITIES</p><h2>Tasks to move forward</h2></div><button className="text-button" onClick={() => setPage('Tasks')}>View all <ArrowUpRight size={14}/></button></div><form className="add-task-form" onSubmit={(event) => void addTask(event)}><input value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="What needs to get done?" maxLength={200} aria-label="New task title"/><button className="primary-button compact" type="submit"><Plus size={14}/> Add</button></form>{loading ? <p className="empty-state">Connecting…</p> : filteredTasks.length ? <ul className="task-list">{filteredTasks.slice(0, 8).map((task) => <li key={task.id}><button className={`check-button ${task.completed ? 'checked' : ''}`} aria-label={`Complete ${task.title}`} onClick={() => void toggleTask(task)}><Check size={13}/></button><span>{task.title}</span></li>)}</ul> : <div className="empty-state"><b>No open tasks.</b><span>Add one when you’re ready to plan.</span></div>}</article>
            <article className="panel"><div className="panel-heading"><div><p className="eyebrow">YOUR TEAM</p><h2>Agent profiles</h2></div><button className="text-button" onClick={() => setPage('Agents')}>Directory <ArrowUpRight size={14}/></button></div><div className="agent-list">{agents.slice(0, 5).map((agent, index) => <div className="agent-row" key={agent.id}><div className={`agent-avatar agent-${index % 4}`}>{agent.name[0]}</div><div><b>{agent.name}</b><small>{agent.purpose}</small></div><span className="agent-ready">PROFILE</span></div>)}</div></article></section>
          <section className="panel chat-panel"><div className="panel-heading"><div><p className="eyebrow">ALFRED</p><h2>Assistant chat</h2></div><span className="local-label">Local rules · no AI API</span></div><div className="chat-thread">{messages.length ? messages.map((message) => <div key={message.id} className={`chat-bubble ${message.role}`}><span className="bubble-role">{message.role === 'assistant' ? 'Alfred' : 'You'}</span><p>{message.content}</p></div>) : <div className="empty-state chat-empty"><b>Start a conversation.</b><span>Try “What should I focus on today?”</span></div>}</div><form className="chat-form" onSubmit={(event) => void sendChat(event)}><input value={chatText} onChange={(event) => setChatText(event.target.value)} placeholder="Ask Alfred about your saved tasks…" aria-label="Message Alfred" maxLength={2000}/><button className="primary-button compact" disabled={busy} type="submit">{busy ? 'Thinking…' : 'Send'}</button></form></section>
          <section className="panel memory-panel"><div className="panel-heading"><div><p className="eyebrow">USER-CONTROLLED MEMORY</p><h2>Saved preferences</h2></div></div><form className="memory-form" onSubmit={(event) => void saveMemory(event)}><input value={memoryKey} onChange={(event) => setMemoryKey(event.target.value)} placeholder="Memory label" maxLength={100} aria-label="Memory label"/><input value={memoryValue} onChange={(event) => setMemoryValue(event.target.value)} placeholder="Preference or goal (only saved when you submit)" maxLength={500} aria-label="Memory value"/><button className="secondary-button" type="submit">Save memory</button></form>{memory.length ? <ul className="memory-list">{memory.map((entry) => <li key={entry.id}><div><b>{entry.key}</b><span>{entry.value}</span></div><button className="delete-button" onClick={() => void deleteMemory(entry.id)} aria-label={`Delete ${entry.key}`}>Delete</button></li>)}</ul> : <div className="empty-state memory-empty">Nothing stored yet. You decide what to save.</div>}</section>
          <footer className="page-footer"><span><ShieldCheck size={14}/> Local development workspace</span><span>Unauthenticated — do not expose publicly</span></footer>
        </> : <section className="section-page"><p className="eyebrow">PERSONAL HQ</p><h1>{page}</h1>{page === 'Agents' ? <div className="directory-grid">{agents.map((agent, index) => <article className="panel directory-card" key={agent.id}><div className={`agent-avatar agent-${index % 4}`}>{agent.name[0]}</div><h2>{agent.name}</h2><p>{agent.purpose}</p><small>{agent.department}</small></article>)}</div> : <div className="panel coming-soon"><span className="stat-icon gold"><Sparkles size={18}/></span><h2>This module is not implemented yet.</h2><p>No external data or mock integration is being presented as live. The roadmap tracks the planned work.</p><button className="secondary-button" onClick={() => setPage('Overview')}>Back to overview</button></div>}</section>}
      </div>
    </main>
  </div>;
}
export default App;
