import { useState } from 'react'
import './CustomerDetailPage.css'

/* ── Mock data (swap with API call: GET /api/customers/:id) ─── */
const CLIENT = {
  name:        'Rahul Sharma',
  age:         29,
  city:        'Mumbai',
  occupation:  'Software Architect',
  status:      'SEARCHING',
  registered:  'Oct 12, 2023',
  lastUpdated: '2 days ago',
  tier:        'Elite Platinum',
  assignedTo:  'Ananya Iyer',
  // Professional
  currentRole: 'Senior Architect at Google',
  education:   'MS, Stanford University',
  income:      '₹85L - 1Cr PA',
  // Family
  religion:    'Hindu, Brahmin (Saraswat)',
  values:      'Liberal-Modern',
  grewUp:      'South Mumbai (Colaba)',
  // Habits
  habits:      [
    { icon: 'restaurant',  label: 'Vegetarian' },
    { icon: 'smoke_free',  label: 'Non-Smoker' },
    { icon: 'liquor',      label: 'Socially'   },
  ],
  futurePlans: 'Wants 2 children, looking to marry within the next 12–18 months. Open to relocating to Bangalore or London.',
  preferences: [
    { ok: true,  text: 'Age: 25 - 30' },
    { ok: true,  text: 'Location: Mumbai / Pune / Overseas' },
    { ok: false, text: 'Deal Breaker: Smoking' },
  ],
  // Notes
  notes: [
    { type: 'call',    icon: 'call',   label: 'Call',    date: '20 Oct', text: "Rahul expressed interest in Priya's profile. Needs more info on her work schedule.", primary: true },
    { type: 'meeting', icon: 'groups', label: 'Meeting', date: '12 Oct', text: 'In-person onboarding. Client is very focused on core values and education background.', primary: false },
  ],
  // Timeline
  timeline: [
    { title: 'Status: Searching',      sub: 'Updated by System • Oct 14', active: true  },
    { title: 'Screening Completed',    sub: 'Validated by AI Engine • Oct 13', active: false },
    { title: 'Account Created',        sub: 'Direct Registration • Oct 12',   active: false },
  ],
  // Sent matches
  sentMatches: [
    {
      name: 'Priya Malhotra',
      city: 'Mumbai',
      role: 'Senior Product Manager',
      income: '₹85L - 1Cr PA',
      sentDate: '14 Oct 2023',
      response: 'interested',
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB4197vTks4fZKTWfyIk55ynSTIjl-2pHXrPEIRZXx9BMkTk-fX0Lxgf8m0r1Lq-6n6ZedPhhNWhx0IfQrsr4U43vDKqPnpz25TSTQQ5WX71pFr7RL4x4YOmXIVL7A4dLIxfD16_4rCx-R9MI0WM_W4iUUm3UuZgIN84tXBa0vWNmRqt3rZN7cEBNLJyGD99bcxIVt0xA1MAHAX11EYGXCZ-LuvQEXDHvP8AihqWrSphK7PDmv38o9XsuyEbZmCN4_Lh5-Tu97c5rM',
    },
    {
      name: 'Sanya Gupta',
      city: 'Pune',
      role: 'Creative Director',
      income: '₹60L - 75L PA',
      sentDate: '02 Oct 2023',
      response: 'rejected',
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB6mxR3nC6H3yGYT8KP0uWd03oZiTezI3qnvrVtBqMtx-Ps2r3w_C29Vu55SyVkGhT71GWT8cxx8SJ07fQDny7ZEJJ4wPoRvHmsu_68EA40DoTiFDzA3bn6QP6-wtby_BOlvf-jHfafKzYZbhFwRWoHVhbjf5adNOL7U-EVQUF7H0lnQx6kvpjOrQ5Wg6babG0DTJJJKGYMMlH8sh3jvGNhiZsM7A-t0WZAX59UsBoOItLwUKpGXSFqoxnqt2A3BuqhMSmr5S4COH0',
    },
  ],
  photoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA1Pe_grMwXOBuOgC7hInW1tX0G-Uect_RNXjmY4vq2erckpu4i3rS2XHhQmm6E2MExyvetiJNWkRvZ7GtrujRkV4ayWP0xiJcrkAK56r2YHxMmBAxG_S_1eunuVn7ztmuLHxmGTqpFBHQitEKITs9FV4eKO6ExHOfp5pJ05okaE2cup9WApLl9J348jP-21wPHFJNhh6vdmGJVPbj6XASEcAilrA6qBdd7skDkeua-O0WhFWdDwtH_SCHNu3PuID11ovpvxxbs-mA',
}

const TABS = ['Personal Details', 'Lifestyle & Plans', 'Partner Preferences', 'Family Background']

const NAV = [
  { icon: 'dashboard', label: 'Dashboard',     active: false },
  { icon: 'group',     label: 'Customers',     active: true  },
  { icon: 'search',    label: 'Global Search', active: false },
  { icon: 'event',     label: 'Calendar',      active: false },
]

/* ── Component ─────────────────────────────────────────────── */
export default function CustomerDetailPage() {
  const [activeTab, setActiveTab] = useState(0)
  const [note, setNote] = useState('')

  return (
    <div className="cd cd-shell">

      {/* ── Sidebar ── */}
      <aside className="cd-sidebar">
        <div className="cd-brand-name">The Date Crew</div>
        <div className="cd-brand-sub">Matchmaker Portal</div>

        <button className="cd-new-btn" id="cd-new-case-btn">
          <span className="ms">add</span>
          New Matchmaking Case
        </button>

        <nav className="cd-nav">
          {NAV.map(item => (
            <button
              key={item.label}
              className={`cd-nav-link ${item.active ? 'active' : ''}`}
              id={`cd-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <span className="ms">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="cd-sidebar-footer">
          <button className="cd-nav-link" id="cd-nav-support">
            <span className="ms">help</span>Support
          </button>
          <button className="cd-nav-link" id="cd-nav-signout">
            <span className="ms">logout</span>Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="cd-main">

        {/* Topbar */}
        <header className="cd-topbar">
          <span className="cd-topbar-logo">The Date Crew</span>
          <nav className="cd-topbar-nav">
            <button className="cd-topbar-link" id="cd-top-dashboard">Dashboard</button>
            <button className="cd-topbar-link active" id="cd-top-customers">Customers</button>
          </nav>
          <div className="cd-topbar-right">
            <button className="cd-topbar-icon-btn" id="cd-top-notif" title="Notifications">
              <span className="ms">notifications</span>
            </button>
            <button className="cd-topbar-icon-btn" id="cd-top-settings" title="Settings">
              <span className="ms">settings</span>
            </button>
            <img
              className="cd-topbar-avatar"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuA5jpvF0t2DpsLtMbvBq5jRuqDZXUffcNfKJNqDKdHkFjpan6m_tHawpjMccxcvnHEsJ4nbUSanL_uySt-Gkp8NEpx3EBoSU9RhSXb0DR_ak1kEYe8BkAKe7dzM3ikg8PEyru_h_Vx2u36GKIztaqABZacQjLNdsSMcwe5DGViJiygEKSbnLgvS3oGzzEXkQN1U2YCwk7K1Nedp3HLAAe2ib8_dG8P1E19e2pekUNtloMAoUXGpqlNpp2yhQil3d9VW61SGajinkBc"
              alt="Matchmaker avatar"
            />
          </div>
        </header>

        {/* Scrollable canvas */}
        <div className="cd-canvas">

          {/* Hero profile card */}
          <section className="cd-hero">
            <div className="cd-hero-photo-wrap">
              <img className="cd-hero-photo" src={CLIENT.photoUrl} alt={CLIENT.name} />
              <div className="cd-verified-badge">
                <span className="ms" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              </div>
            </div>

            <div className="cd-hero-info">
              <div className="cd-hero-top">
                <div>
                  <h1 className="cd-client-name">{CLIENT.name}</h1>
                  <div className="cd-client-sub">
                    <span className="ms">location_on</span>
                    {CLIENT.age} • {CLIENT.city} • {CLIENT.occupation}
                  </div>
                </div>

                <div className="cd-status-pill" id="cd-status-pill">
                  <span className="cd-status-dot" />
                  {CLIENT.status}
                  <span className="ms">expand_more</span>
                </div>
              </div>

              <div className="cd-hero-meta">
                <div className="cd-meta-item">
                  <span className="ms">calendar_today</span>
                  <div>
                    <div className="cd-meta-label">Registered</div>
                    <div className="cd-meta-value">{CLIENT.registered}</div>
                  </div>
                </div>
                <div className="cd-meta-item">
                  <span className="ms">history</span>
                  <div>
                    <div className="cd-meta-label">Last Updated</div>
                    <div className="cd-meta-value">{CLIENT.lastUpdated}</div>
                  </div>
                </div>
                <div className="cd-meta-item">
                  <span className="ms accent">workspace_premium</span>
                  <div>
                    <div className="cd-meta-label">Tier</div>
                    <div className="cd-meta-value accent">{CLIENT.tier}</div>
                  </div>
                </div>
                <div className="cd-meta-item">
                  <span className="ms">support_agent</span>
                  <div>
                    <div className="cd-meta-label">Assigned To</div>
                    <div className="cd-meta-value underline">{CLIENT.assignedTo}</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Tabs */}
          <div className="cd-tabs">
            {TABS.map((tab, i) => (
              <button
                key={tab}
                className={`cd-tab ${activeTab === i ? 'active' : ''}`}
                id={`cd-tab-${i}`}
                onClick={() => setActiveTab(i)}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Content grid */}
          <div className="cd-grid">

            {/* ── Left column ── */}
            <div className="cd-left">

              {/* Background & Career */}
              <div className="cd-card">
                <div className="cd-card-header">
                  <span className="cd-card-title">Background &amp; Career</span>
                  <button className="cd-edit-btn" id="cd-edit-career">
                    <span className="ms">edit</span>
                  </button>
                </div>
                <div className="cd-card-body">
                  <div className="cd-card-cols">
                    <div>
                      <div className="cd-section-label">Professional</div>
                      <div className="cd-kv-list">
                        <div className="cd-kv">
                          <span className="cd-kv-key">Current Role</span>
                          <span className="cd-kv-val">{CLIENT.currentRole}</span>
                        </div>
                        <div className="cd-kv">
                          <span className="cd-kv-key">Education</span>
                          <span className="cd-kv-val">{CLIENT.education}</span>
                        </div>
                        <div className="cd-kv">
                          <span className="cd-kv-key">Income</span>
                          <span className="cd-kv-val">{CLIENT.income}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="cd-section-label">Family</div>
                      <div className="cd-kv-list">
                        <div className="cd-kv">
                          <span className="cd-kv-key">Religion / Caste</span>
                          <span className="cd-kv-val">{CLIENT.religion}</span>
                        </div>
                        <div className="cd-kv">
                          <span className="cd-kv-key">Values</span>
                          <span className="cd-kv-val"><span className="cd-tag">{CLIENT.values}</span></span>
                        </div>
                        <div className="cd-kv">
                          <span className="cd-kv-key">Grew up in</span>
                          <span className="cd-kv-val">{CLIENT.grewUp}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lifestyle & Preferences */}
              <div className="cd-card">
                <div className="cd-card-header">
                  <span className="cd-card-title">Lifestyle &amp; Preferences</span>
                  <button className="cd-edit-btn" id="cd-edit-lifestyle">
                    <span className="ms">edit</span>
                  </button>
                </div>
                <div className="cd-card-body">
                  <div className="cd-card-cols">
                    <div>
                      <div className="cd-section-label">Habits</div>
                      <div className="cd-habits-list">
                        {CLIENT.habits.map(h => (
                          <span key={h.label} className="cd-habit-chip">
                            <span className="ms">{h.icon}</span>
                            {h.label}
                          </span>
                        ))}
                      </div>
                      <div className="cd-section-label" style={{ marginTop: 12 }}>Future Plans</div>
                      <p className="cd-future-plans">{CLIENT.futurePlans}</p>
                    </div>
                    <div>
                      <div className="cd-section-label">Partner Preferences</div>
                      <div className="cd-pref-list">
                        {CLIENT.preferences.map((p, i) => (
                          <div key={i} className={`cd-pref-item ${!p.ok ? 'deal-breaker' : ''}`}>
                            <span className={`ms ${!p.ok ? 'breaker' : ''}`}>
                              {p.ok ? 'check_circle' : 'cancel'}
                            </span>
                            {p.text}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sent Matches */}
              <div>
                <div className="cd-matches-title">Sent Matches History</div>
                {CLIENT.sentMatches.map(m => (
                  <div key={m.name} className="cd-match-card">
                    <img className="cd-match-photo" src={m.img} alt={m.name} />
                    <div className="cd-match-info">
                      <div className="cd-match-top">
                        <div>
                          <div className="cd-match-name">{m.name}</div>
                          <div className="cd-match-loc">{m.city} • {m.role}</div>
                        </div>
                        <span className={`cd-match-chip ${m.response}`}>
                          {m.response.charAt(0).toUpperCase() + m.response.slice(1)}
                        </span>
                      </div>
                      <div className="cd-match-meta">
                        <div className="cd-match-meta-item">
                          <span className="cd-match-meta-label">Income</span>
                          <span className="cd-match-meta-val">{m.income}</span>
                        </div>
                        <div className="cd-match-meta-item">
                          <span className="cd-match-meta-label">Sent Date</span>
                          <span className="cd-match-meta-val">{m.sentDate}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>{/* end left */}

            {/* ── Right column ── */}
            <div className="cd-right">

              {/* AI Find Matches card — colours untouched */}
              <div className="cd-ai-card" id="cd-ai-card">
                <div className="cd-ai-inner">
                  <span className="ms">auto_awesome</span>
                  <div className="cd-ai-title">Find Matches</div>
                  <div className="cd-ai-sub">Discover premium profiles for {CLIENT.name.split(' ')[0]}</div>
                  <button className="cd-ai-btn" id="cd-start-matching-btn">
                    Start Matching Now
                  </button>
                </div>
              </div>

              {/* Consultant Notes */}
              <div className="cd-notes-card">
                <div className="cd-notes-title">Consultant Notes</div>
                <textarea
                  id="cd-note-input"
                  className="cd-notes-textarea"
                  placeholder="Add a private note about this client…"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                />
                <button className="cd-save-btn" id="cd-save-note-btn">
                  <span className="ms">save</span>
                  Save Note
                </button>

                <div className="cd-notes-log">
                  {CLIENT.notes.map((n, i) => (
                    <div key={i} className={`cd-note-item ${n.primary ? '' : 'secondary'}`}>
                      <div className="cd-note-head">
                        <div className="cd-note-label">
                          <span className="ms">{n.icon}</span>
                          {n.label}
                          <span className="cd-note-date">• {n.date}</span>
                        </div>
                        <button className="cd-note-more-btn">
                          <span className="ms">more_horiz</span>
                        </button>
                      </div>
                      <p className="cd-note-text">{n.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Journey Timeline */}
              <div className="cd-timeline-card">
                <div className="cd-timeline-title">Journey Timeline</div>
                <div className="cd-timeline">
                  {CLIENT.timeline.map((t, i) => (
                    <div key={i} className="cd-tl-item">
                      <div className={`cd-tl-dot ${t.active ? '' : 'muted'}`} />
                      <div className="cd-tl-title">{t.title}</div>
                      <div className="cd-tl-sub">{t.sub}</div>
                    </div>
                  ))}
                </div>
              </div>

            </div>{/* end right */}
          </div>{/* end cd-grid */}
        </div>{/* end cd-canvas */}
      </main>
    </div>
  )
}
