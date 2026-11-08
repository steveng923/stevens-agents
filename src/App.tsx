import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  Activity, ArrowDownRight, ArrowUpRight, Bell, CalendarDays, Check, ChevronDown,
  CircleHelp, Command, Dumbbell, LayoutDashboard, ListChecks, Menu, Plus, Search,
  Settings2, ShieldCheck, Sparkles, Target, Users, X,
} from 'lucide-react';

type Agent = { id: string; name: string; department: string; purpose: string };
type Task = { id: number; title: string; completed: boolean; created_at: string };
type Page = 'Overview' | 'Schedule' | 'Tasks' | 'Agents' | 'Goals' | 'Fitness' | 'Settings';

const navigation: { name: Page; icon: typeof LayoutDashboard }[] = [
  { name: 'Overview', icon: LayoutDashboard },
  { name: 'Schedule', icon: CalendarDays },
  { name: 'Tasks', icon: ListChecks },
  { name: 'Agents', icon: Users },
  { name: 'Goals', icon: Target },
  { name: 'Fitness', icon: Dumbbell },
];

function App() {
  const [page, setPage] = useState<Page>('Overview');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [addingTask, setAddingTask] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [query, setQuery] = useState('');

  async function loadData() {
    setLoading(true);
    try {
      const [agentResponse, taskResponse] = await Promise.all([
        fetch('/api/agents'), fetch('/api/tasks'),
      ]);
      if (!agentResponse.ok || !taskResponse.ok) throw new Error('The local API returned an error.');
      setAgents(await agentResponse.json());
      setTasks(await taskResponse.json());
      setApiError('');
    } catch {
      setApiError('Can’t reach the local service. Start the FastAPI server to load agents and save tasks.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadData(); }, []);

  const openTasks = useMemo(() => tasks.filter((task) => !task.completed), [tasks]);
  const filteredTasks = useMemo(() => openTasks.filter((task) => task.title.toLowerCase().includes(query.toLowerCase())), [openTasks, query]);

  async function addTask(event: FormEvent) {
    event.preventDefault();
    const title = taskTitle.trim();
    if (!title) return;
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title }),
      });
      if (!response.ok) throw new Error('Could not save this task.');
      const task = await response.json() as Task;
      setTasks((current) => [task, ...current]);
      setTaskTitle('');
      setAddingTask(false);
      setApiError('');
    } catch {
      setApiError('Task was not saved. Check that the local API is running, then try again.');
    }
  }

  async function toggleTask(task: Task) {
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !task.completed }),
      });
      if (!response.ok) throw new Error();
      const updated = await response.json() as Task;
      setTasks((current) => current.map((item) => item.id === updated.id ? updated : item));
      setApiError('');
    } catch {
      setApiError('Task update failed. Check the local API connection.');
    }
  }

  const activePage = page === 'Overview' ? 'Your command center' : page;
  const date = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenu ? 'sidebar-open' : ''}`}>
        <a className="brand" href="#home" onClick={() => setPage('Overview')}>
          <span className="brand-mark"><ShieldCheck size={20} /></span>
          <span><strong>STEVEN'S</strong><small>AGENTS</small></span>
          <button className="icon-button mobile-close" aria-label="Close navigation" onClick={(event) => { event.preventDefault(); setMobileMenu(false); }}><X size={18} /></button>
        </a>
        <div className="workspace-label">PERSONAL HQ <ChevronDown size={13} /></div>
        <nav className="nav-list" aria-label="Main navigation">
          {navigation.map(({ name, icon: Icon }) => (
            <button key={name} className={`nav-item ${page === name ? 'active' : ''}`} onClick={() => { setPage(name); setMobileMenu(false); }}>
              <Icon size={17} /><span>{name}</span>{name === 'Tasks' && openTasks.length > 0 && <span className="nav-count">{openTasks.length}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="online-card"><span className="online-dot" /><span><b>Local workspace</b><small>Private development mode</small></span></div>
          <button className={`nav-item ${page === 'Settings' ? 'active' : ''}`} onClick={() => setPage('Settings')}><Settings2 size={17} /><span>Settings</span></button>
          <div className="profile"><div className="avatar">S</div><span><b>Steven</b><small>Personal workspace</small></span><CircleHelp size={17} className="profile-help" /></div>
        </div>
      </aside>

      {mobileMenu && <button className="mobile-scrim" aria-label="Close menu" onClick={() => setMobileMenu(false)} />}
      <main className="main-area">
        <header className="topbar">
          <button className="icon-button mobile-menu-button" aria-label="Open navigation" onClick={() => setMobileMenu(true)}><Menu size={20} /></button>
          <div className="breadcrumbs"><span>Personal HQ</span><span className="crumb-slash">/</span><strong>{activePage}</strong></div>
          <div className="top-actions">
            <label className="search-box"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search open tasks" aria-label="Search open tasks" /><kbd><Command size={11} /> K</kbd></label>
            <button className="icon-button notification-button" aria-label="Notifications"><Bell size={18} /><i /></button>
          </div>
        </header>

        <div className="page-content">
          {apiError && <div className="alert" role="status">{apiError}<button onClick={() => void loadData()}>Retry</button></div>}
          {page === 'Overview' || page === 'Tasks' ? (
            <>
              <section className="welcome-row">
                <div><p className="eyebrow">{date}</p><h1>{page === 'Tasks' ? 'Your tasks' : <>Good to see you, Steven<span className="gold-dot">.</span></>}</h1><p className="subheading">{page === 'Tasks' ? 'A clear next step makes a good day.' : 'Your day, organized in one place.'}</p></div>
                <button className="primary-button" onClick={() => setAddingTask(true)}><Plus size={16} /> Add a task</button>
              </section>
              <section className="assistant-banner">
                <div className="assistant-icon"><Sparkles size={20} /></div>
                <div className="assistant-copy"><span className="eyebrow">ALFRED <span className="status-pill">FOUNDATION</span></span><p>I’m here to help bring your day into focus. Your workspace is ready for its first tasks.</p></div>
                <span className="banner-decoration">A</span>
              </section>
              <section className="stats-grid" aria-label="Workspace summary">
                <article className="stat-card"><span className="stat-icon blue"><ListChecks size={17} /></span><span className="stat-label">Open tasks</span><strong>{loading ? '—' : openTasks.length.toString().padStart(2, '0')}</strong><small><ArrowUpRight size={13} /> Keep your next step visible</small></article>
                <article className="stat-card"><span className="stat-icon gold"><Users size={17} /></span><span className="stat-label">Ready agents</span><strong>{loading ? '—' : agents.length.toString().padStart(2, '0')}</strong><small><Activity size={13} /> Agent profiles available</small></article>
                <article className="stat-card"><span className="stat-icon green"><CalendarDays size={17} /></span><span className="stat-label">Today's schedule</span><strong>—</strong><small><ArrowDownRight size={13} /> Calendar not connected</small></article>
                <article className="stat-card"><span className="stat-icon purple"><Target size={17} /></span><span className="stat-label">Active goals</span><strong>—</strong><small>Goal tracking coming in a later stage</small></article>
              </section>
              <section className="content-grid">
                <article className="panel task-panel">
                  <div className="panel-heading"><div><p className="eyebrow">YOUR PRIORITIES</p><h2>Tasks to move forward</h2></div><button className="text-button" onClick={() => setPage('Tasks')}>View all <ArrowUpRight size={14} /></button></div>
                  {addingTask && <form className="add-task-form" onSubmit={(event) => void addTask(event)}><input autoFocus value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="What needs to get done?" maxLength={200} aria-label="New task title" /><button className="primary-button compact" type="submit">Save</button><button type="button" className="icon-button" aria-label="Cancel" onClick={() => { setAddingTask(false); setTaskTitle(''); }}><X size={16} /></button></form>}
                  {loading ? <p className="empty-state">Connecting to your workspace…</p> : filteredTasks.length ? <ul className="task-list">{filteredTasks.slice(0, 6).map((task) => <li key={task.id}><button className="check-button" aria-label={`Complete ${task.title}`} onClick={() => void toggleTask(task)}><Check size={13} /></button><span>{task.title}</span><small>Personal</small></li>)}</ul> : <div className="empty-state"><span className="empty-icon"><Check size={19} /></span><b>A little room to think.</b><span>Add a task when you're ready to make a plan.</span></div>}
                </article>
                <article className="panel agent-panel">
                  <div className="panel-heading"><div><p className="eyebrow">YOUR TEAM</p><h2>Agents on standby</h2></div><button className="text-button" onClick={() => setPage('Agents')}>Command center <ArrowUpRight size={14} /></button></div>
                  <div className="agent-list">{agents.slice(0, 4).map((agent, index) => <div className="agent-row" key={agent.id}><div className={`agent-avatar agent-${index}`}>{agent.name.slice(0, 1)}</div><div><b>{agent.name}</b><small>{agent.purpose}</small></div><span className="agent-ready">READY</span></div>)}{!loading && agents.length === 0 && <p className="empty-state">Agent profiles are unavailable.</p>}</div>
                </article>
              </section>
              <footer className="page-footer"><span><ShieldCheck size={14} /> Your workspace is in local development mode</span><span>External accounts are not connected</span></footer>
            </>
          ) : (
            <section className="section-page"><p className="eyebrow">PERSONAL HQ</p><h1>{page}</h1>
              {page === 'Agents' ? <><p className="subheading">A coordinated team of specialized profiles. Instructions and permissions will be configurable in a later stage.</p><div className="directory-grid">{agents.map((agent, index) => <article className="panel directory-card" key={agent.id}><div className={`agent-avatar agent-${index % 4}`}>{agent.name.slice(0, 1)}</div><span className="agent-ready">PROFILE</span><h2>{agent.name}</h2><p>{agent.purpose}</p><small>{agent.department}</small></article>)}</div></> : page === 'Tasks' ? <p className="subheading">Your persisted tasks are shown on the overview.</p> : <div className="panel coming-soon"><span className="stat-icon gold"><Sparkles size={18} /></span><h2>This department is not connected yet.</h2><p>This section will be built in a later stage. No external data is being shown or simulated.</p><button className="secondary-button" onClick={() => setPage('Overview')}>Back to overview</button></div>}
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
