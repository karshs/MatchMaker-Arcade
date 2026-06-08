import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { customersApi, notesApi } from '../api'
import './CustomerDetailPage.css'

const TABS = ['Personal Details', 'Lifestyle & Plans', 'Partner Preferences', 'Family Background']

const JOURNEY_STATUSES = [
  'Profile Verified',
  'Searching',
  'Matches Shared',
  'Interested',
  'Call Scheduled',
  'Meeting Scheduled',
  'Successful Match',
  'Paused',
  'Inactive',
]

const STATUS_MAP = {
  'Searching':         { cls: 'searching',  dot: '#7A5C00', bg: '#FFF3CC', border: 'rgba(200, 146, 10, 0.45)' },
  'Profile Verified':  { cls: 'verified',   dot: '#B58000', bg: '#FFFDF2', border: 'rgba(200, 146, 10, 0.25)' },
  'Matches Shared':    { cls: 'review',     dot: '#E65100', bg: '#FFF8E1', border: 'rgba(230, 81, 0, 0.4)' },
  'Interested':        { cls: 'interested', dot: '#1565C0', bg: '#E8F4FD', border: 'rgba(21, 101, 192, 0.4)' },
  'Call Scheduled':    { cls: 'call',       dot: '#2E7D32', bg: '#EDF7ED', border: 'rgba(46, 125, 50, 0.4)' },
  'Meeting Scheduled': { cls: 'meeting',    dot: '#006064', bg: '#E0F7FA', border: 'rgba(0, 151, 167, 0.4)' },
  'Successful Match':  { cls: 'match',      dot: '#6A1B9A', bg: '#F3E5F5', border: 'rgba(106, 27, 154, 0.4)' },
  'Paused':            { cls: 'paused',     dot: '#757575', bg: '#EEEEEE', border: 'rgba(117, 117, 117, 0.4)' },
  'Inactive':          { cls: 'closed',     dot: '#C62828', bg: '#FFEBEE', border: 'rgba(198, 40, 40, 0.4)' },
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function timeAgo(d) {
  if (!d) return '—'
  const diff = Date.now() - new Date(d)
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return fmtDate(d)
}

const NAV = [
  { icon: 'dashboard', label: 'Dashboard',     path: '/'          },
  { icon: 'group',     label: 'Customers',     path: '/customers', active: true },
  { icon: 'search',    label: 'Global Search', path: '/'          },
  { icon: 'event',     label: 'Calendar',      path: '/'          },
]

export default function CustomerDetailPage() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const { matchmaker, logout } = useAuth()

  const [customer,  setCustomer]  = useState(null)
  const [notes,     setNotes]     = useState([])
  const [timeline,  setTimeline]  = useState([])
  const [sentMatch, setSentMatch] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')

  const [activeTab, setActiveTab] = useState(0)
  const [noteText,  setNoteText]  = useState('')
  const [saving,    setSaving]    = useState(false)

  /* ── Status dropdown state ── */
  const [statusOpen,    setStatusOpen]    = useState(false)
  const [statusSaving,  setStatusSaving]  = useState(false)
  const statusRef = useRef(null)

  /* Close dropdown on outside click */
  useEffect(() => {
    function handleClick(e) {
      if (statusRef.current && !statusRef.current.contains(e.target)) {
        setStatusOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  /* ── Fetch all data in parallel ── */
  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const [custRes, notesRes, tlRes, sentRes] = await Promise.all([
        customersApi.get(id),
        notesApi.list(id),
        customersApi.journeyEvents(id),
        customersApi.sentMatches(id),
      ])
      setCustomer(custRes.data)
      setNotes(notesRes.data)
      setTimeline(tlRes.data.reverse()) // newest first
      setSentMatch(sentRes.data)
    } catch (err) {
      if (err.status === 401) { logout(); navigate('/login') }
      if (err.status === 404) { navigate('/customers') }
      setError(err.message || 'Failed to load customer.')
    } finally {
      setLoading(false)
    }
  }, [id, logout, navigate])

  useEffect(() => { load() }, [load])

  /* ── Save note ── */
  async function handleSaveNote() {
    if (!noteText.trim()) return
    setSaving(true)
    try {
      const res = await notesApi.add(id, 'General Note', noteText.trim())
      setNotes(n => [res.data, ...n])
      setNoteText('')
    } catch (err) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  /* ── Update journey status ── */
  async function handleStatusChange(newStatus) {
    if (!customer || newStatus === customer.journey_status) {
      setStatusOpen(false)
      return
    }
    setStatusOpen(false)
    setStatusSaving(true)
    // Optimistic update
    setCustomer(c => ({ ...c, journey_status: newStatus }))
    try {
      await customersApi.updateJourney(id, newStatus)
      // Refresh timeline to show the new event
      const tlRes = await customersApi.journeyEvents(id)
      setTimeline(tlRes.data.reverse())
    } catch (err) {
      // Revert on failure
      setCustomer(c => ({ ...c, journey_status: customer.journey_status }))
      alert('Failed to update status: ' + err.message)
    } finally {
      setStatusSaving(false)
    }
  }

  /* ── Loading / error states ── */
  if (loading) {
    return (
      <div className="cd cd-shell" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#777', fontSize: 14 }}>Loading customer profile…</div>
      </div>
    )
  }

  if (error || !customer) {
    return (
      <div className="cd cd-shell" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#C62828', fontSize: 14 }}>{error || 'Customer not found.'}</div>
      </div>
    )
  }

  const statusCfg = STATUS_MAP[customer.journey_status] || STATUS_MAP['Paused']
  const fullName  = `${customer.first_name} ${customer.last_name}`
  const initials  = `${customer.first_name?.[0] ?? ''}${customer.last_name?.[0] ?? ''}`.toUpperCase()

  return (
    <div className="cd cd-shell">

      {/* ── Sidebar ── */}
      <aside className="cd-sidebar">
        <div className="cd-brand-name">The Date Crew</div>
        <div className="cd-brand-sub">Matchmaker Portal</div>
        <button className="cd-new-btn" id="cd-new-case-btn">
          <span className="ms">add</span>New Matchmaking Case
        </button>
        <nav className="cd-nav">
          {NAV.map(item => (
            <button
              key={item.label}
              className={`cd-nav-link ${item.active ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
              id={`cd-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <span className="ms">{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>
        <div className="cd-sidebar-footer">
          <button className="cd-nav-link" id="cd-nav-support"><span className="ms">help</span>Support</button>
          <button className="cd-nav-link" id="cd-nav-signout" onClick={logout}><span className="ms">logout</span>Sign Out</button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="cd-main">

        {/* Topbar */}
        <header className="cd-topbar">
          <span className="cd-topbar-logo">The Date Crew</span>
          <nav className="cd-topbar-nav">
            <button className="cd-topbar-link" onClick={() => navigate('/')} id="cd-top-dashboard">Dashboard</button>
            <button className="cd-topbar-link active" onClick={() => navigate('/customers')} id="cd-top-customers">Customers</button>
          </nav>
          <div className="cd-topbar-right">
            <button className="cd-topbar-icon-btn" id="cd-top-notif"><span className="ms">notifications</span></button>
            <button className="cd-topbar-icon-btn" id="cd-top-settings"><span className="ms">settings</span></button>
            <div className="cd-topbar-avatar" style={{ background: '#C8920A', color: '#fff', display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,borderRadius:'50%',width:30,height:30 }}>
              {matchmaker?.name?.split(' ').map(w => w[0]).join('').slice(0,2) || 'MM'}
            </div>
          </div>
        </header>

        {/* Canvas */}
        <div className="cd-canvas">

          {/* Hero */}
          <section className="cd-hero">
            <div className="cd-hero-photo-wrap">
              {customer.photo_url ? (
                <img className="cd-hero-photo" src={customer.photo_url} alt={fullName} />
              ) : (
                <div className="cd-hero-photo" style={{ background:'#F5F3F0',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,fontWeight:800,color:'#C8920A' }}>
                  {initials}
                </div>
              )}
              <div className="cd-verified-badge">
                <span className="ms" style={{ fontVariationSettings:"'FILL' 1" }}>verified</span>
              </div>
            </div>

            <div className="cd-hero-info">
              <div className="cd-hero-top">
                <div>
                  <h1 className="cd-client-name">{fullName}</h1>
                  <div className="cd-client-sub">
                    <span className="ms">location_on</span>
                    {customer.age} • {customer.city}{customer.state ? `, ${customer.state}` : ''} • {customer.occupation}
                  </div>
                </div>
                {/* Status pill with dropdown */}
                <div className="cd-status-wrap" ref={statusRef}>
                  <button
                    className={`cd-status-pill ${statusCfg.cls} ${statusSaving ? 'saving' : ''}`}
                    id="cd-status-pill"
                    onClick={() => !statusSaving && setStatusOpen(p => !p)}
                    disabled={statusSaving}
                    title="Change client journey status"
                  >
                    {statusSaving ? (
                      <span className="ms cd-status-spin">sync</span>
                    ) : (
                      <span className="cd-status-dot" style={{ background: statusCfg.dot }} />
                    )}
                    {customer.journey_status?.toUpperCase()}
                    <span className="ms cd-status-chevron">
                      {statusOpen ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>

                  {statusOpen && (
                    <div className="cd-status-dropdown" id="cd-status-dropdown">
                      <div className="cd-status-dropdown-header">Change Status</div>
                      {JOURNEY_STATUSES.map(s => {
                        const cfg = STATUS_MAP[s]
                        const isActive = s === customer.journey_status
                        return (
                          <button
                            key={s}
                            className={`cd-status-option ${isActive ? 'active' : ''}`}
                            id={`cd-status-opt-${s.toLowerCase().replace(/\s+/g, '-')}`}
                            onClick={() => handleStatusChange(s)}
                            style={isActive ? { background: cfg.bg, borderColor: cfg.border } : {}}
                          >
                            <span
                              className="cd-status-option-dot"
                              style={{ background: cfg.dot }}
                            />
                            {s}
                            {isActive && <span className="ms cd-status-check">check</span>}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="cd-hero-meta">
                <div className="cd-meta-item">
                  <span className="ms">calendar_today</span>
                  <div>
                    <div className="cd-meta-label">Registered</div>
                    <div className="cd-meta-value">{fmtDate(customer.created_at)}</div>
                  </div>
                </div>
                <div className="cd-meta-item">
                  <span className="ms">history</span>
                  <div>
                    <div className="cd-meta-label">Last Updated</div>
                    <div className="cd-meta-value">{timeAgo(customer.last_updated)}</div>
                  </div>
                </div>
                <div className="cd-meta-item">
                  <span className="ms accent">workspace_premium</span>
                  <div>
                    <div className="cd-meta-label">Religion</div>
                    <div className="cd-meta-value accent">{customer.religion || '—'}</div>
                  </div>
                </div>
                <div className="cd-meta-item">
                  <span className="ms">support_agent</span>
                  <div>
                    <div className="cd-meta-label">Marital Status</div>
                    <div className="cd-meta-value underline">{customer.marital_status || '—'}</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Tabs */}
          <div className="cd-tabs">
            {TABS.map((tab, i) => (
              <button key={tab} className={`cd-tab ${activeTab === i ? 'active' : ''}`}
                id={`cd-tab-${i}`} onClick={() => setActiveTab(i)}>{tab}</button>
            ))}
          </div>

          {/* Content grid */}
          <div className="cd-grid">

            {/* LEFT */}
            <div className="cd-left">

              {/* Background & Career */}
              <div className="cd-card">
                <div className="cd-card-header">
                  <span className="cd-card-title">Background &amp; Career</span>
                  <button className="cd-edit-btn" id="cd-edit-career"><span className="ms">edit</span></button>
                </div>
                <div className="cd-card-body">
                  <div className="cd-card-cols">
                    <div>
                      <div className="cd-section-label">Professional</div>
                      <div className="cd-kv-list">
                        <div className="cd-kv"><span className="cd-kv-key">Occupation</span><span className="cd-kv-val">{customer.occupation || '—'}</span></div>
                        <div className="cd-kv"><span className="cd-kv-key">Education</span><span className="cd-kv-val">{customer.education || '—'}</span></div>
                        <div className="cd-kv"><span className="cd-kv-key">Company</span><span className="cd-kv-val">{customer.company || '—'}</span></div>
                        <div className="cd-kv"><span className="cd-kv-key">Income</span><span className="cd-kv-val">{customer.annual_income ? `₹${customer.annual_income.toLocaleString()}` : '—'}</span></div>
                      </div>
                    </div>
                    <div>
                      <div className="cd-section-label">Family</div>
                      <div className="cd-kv-list">
                        <div className="cd-kv"><span className="cd-kv-key">Religion</span><span className="cd-kv-val">{customer.religion || '—'}</span></div>
                        <div className="cd-kv"><span className="cd-kv-key">Caste</span><span className="cd-kv-val">{customer.caste || '—'}</span></div>
                        <div className="cd-kv"><span className="cd-kv-key">Family Type</span><span className="cd-kv-val">{customer.family_type || '—'}</span></div>
                        <div className="cd-kv"><span className="cd-kv-key">Values</span><span className="cd-kv-val"><span className="cd-tag">{customer.family_values || '—'}</span></span></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lifestyle */}
              <div className="cd-card">
                <div className="cd-card-header">
                  <span className="cd-card-title">Lifestyle &amp; Preferences</span>
                  <button className="cd-edit-btn" id="cd-edit-lifestyle"><span className="ms">edit</span></button>
                </div>
                <div className="cd-card-body">
                  <div className="cd-card-cols">
                    <div>
                      <div className="cd-section-label">Habits</div>
                      <div className="cd-habits-list">
                        {customer.diet && <span className="cd-habit-chip"><span className="ms">restaurant</span>{customer.diet}</span>}
                        {customer.smoking === false && <span className="cd-habit-chip"><span className="ms">smoke_free</span>Non-Smoker</span>}
                        {customer.smoking === true  && <span className="cd-habit-chip"><span className="ms">smoking_rooms</span>Smoker</span>}
                        {customer.drinking && <span className="cd-habit-chip"><span className="ms">liquor</span>{customer.drinking}</span>}
                        {customer.physical_activity && <span className="cd-habit-chip"><span className="ms">fitness_center</span>{customer.physical_activity}</span>}
                      </div>
                      {customer.marriage_timeline && <>
                        <div className="cd-section-label" style={{ marginTop: 12 }}>Future Plans</div>
                        <p className="cd-future-plans">Marriage timeline: {customer.marriage_timeline}. {customer.want_kids ? 'Wants kids.' : ''} {customer.open_to_relocate ? 'Open to relocate.' : ''}</p>
                      </>}
                    </div>
                    <div>
                      <div className="cd-section-label">Partner Preferences</div>
                      <div className="cd-pref-list">
                        {customer.pref_age_min && <div className="cd-pref-item"><span className="ms">check_circle</span>Age: {customer.pref_age_min}–{customer.pref_age_max}</div>}
                        {customer.pref_location && <div className="cd-pref-item"><span className="ms">check_circle</span>Location: {customer.pref_location}</div>}
                        {customer.deal_breakers?.length > 0 && customer.deal_breakers.map((db, i) => (
                          <div key={i} className="cd-pref-item deal-breaker"><span className="ms breaker">cancel</span>Deal Breaker: {db}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sent Matches */}
              <div>
                <div className="cd-matches-title">Sent Matches History</div>
                {sentMatch.length === 0 ? (
                  <div style={{ fontSize: 13, color: '#777', padding: '8px 0' }}>No matches sent yet.</div>
                ) : sentMatch.map(m => (
                  <div key={m.id} className="cd-match-card">
                    {m.photo_url ? (
                      <img className="cd-match-photo" src={m.photo_url} alt={m.first_name} />
                    ) : (
                      <div className="cd-match-photo" style={{ background:'#F5F3F0',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:700,color:'#C8920A',borderRadius:6,flexShrink:0,width:60,height:60 }}>
                        {`${m.first_name?.[0]??''}${m.last_name?.[0]??''}`.toUpperCase()}
                      </div>
                    )}
                    <div className="cd-match-info">
                      <div className="cd-match-top">
                        <div>
                          <div className="cd-match-name">{m.first_name} {m.last_name}</div>
                          <div className="cd-match-loc">{m.city} • {m.occupation}</div>
                        </div>
                        <span className={`cd-match-chip ${m.status === 'Interested' ? 'interested' : 'rejected'}`}>
                          {m.status}
                        </span>
                      </div>
                      <div className="cd-match-meta">
                        {m.annual_income && <div className="cd-match-meta-item"><span className="cd-match-meta-label">Income</span><span className="cd-match-meta-val">₹{m.annual_income.toLocaleString()}</span></div>}
                        {m.sent_at && <div className="cd-match-meta-item"><span className="cd-match-meta-label">Sent</span><span className="cd-match-meta-val">{fmtDate(m.sent_at)}</span></div>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT */}
            <div className="cd-right">

              {/* AI card */}
              <div className="cd-ai-card" id="cd-ai-card">
                <div className="cd-ai-inner">
                  <span className="ms">auto_awesome</span>
                  <div className="cd-ai-title">Find Matches</div>
                  <div className="cd-ai-sub">Discover premium profiles for {customer.first_name}</div>
                  <button
                    className="cd-ai-btn"
                    id="cd-start-matching-btn"
                    onClick={() => navigate(`/customers/${id}/matches`)}
                  >
                    Start Matching Now
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div className="cd-notes-card">
                <div className="cd-notes-title">Consultant Notes</div>
                <textarea
                  id="cd-note-input"
                  className="cd-notes-textarea"
                  placeholder="Add a private note about this client…"
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                />
                <button className="cd-save-btn" id="cd-save-note-btn" onClick={handleSaveNote} disabled={saving}>
                  <span className="ms">save</span>{saving ? 'Saving…' : 'Save Note'}
                </button>

                <div className="cd-notes-log">
                  {notes.map((n, i) => (
                    <div key={n.id || i} className={`cd-note-item ${i === 0 ? '' : 'secondary'}`}>
                      <div className="cd-note-head">
                        <div className="cd-note-label">
                          <span className="ms">{n.note_type === 'Call' ? 'call' : n.note_type === 'Meeting' ? 'groups' : 'note'}</span>
                          {n.note_type}
                          <span className="cd-note-date">• {fmtDate(n.created_at)}</span>
                        </div>
                        <button className="cd-note-more-btn"><span className="ms">more_horiz</span></button>
                      </div>
                      <p className="cd-note-text">{n.content}</p>
                    </div>
                  ))}
                  {notes.length === 0 && <div style={{ fontSize: 12, color: '#aaa' }}>No notes yet.</div>}
                </div>
              </div>

              {/* Journey Timeline */}
              <div className="cd-timeline-card">
                <div className="cd-timeline-title">Journey Timeline</div>
                <div className="cd-timeline">
                  {timeline.length === 0 ? (
                    <div style={{ fontSize: 12, color: '#aaa' }}>No timeline events yet.</div>
                  ) : timeline.map((t, i) => (
                    <div key={t.id || i} className="cd-tl-item">
                      <div className={`cd-tl-dot ${i === 0 ? '' : 'muted'}`} />
                      <div className="cd-tl-title">{t.to_status || t.status}</div>
                      <div className="cd-tl-sub">{t.note ? `${t.note} • ` : ''}{fmtDate(t.changed_at)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
