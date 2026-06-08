import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { customersApi, notesApi } from '../api'
import './CustomerDetailPage.css'

const DefaultAvatar = ({ className, style = {} }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ background: '#EAE7E2', borderRadius: '50%', display: 'block', ...style }}
  >
    <path
      d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"
      fill="#B1ABA2"
    />
  </svg>
)

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
  const [noteType,  setNoteType]  = useState('General Note')
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
      const res = await notesApi.add(id, noteType, noteText.trim())
      setNotes(n => [res.data, ...n])
      setNoteText('')
      setNoteType('General Note')
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
              <DefaultAvatar className="cd-hero-photo" />
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
                  <span className="ms">favorite_border</span>
                  <div>
                    <div className="cd-meta-label">Marital Status</div>
                    <div className="cd-meta-value underline">{customer.marital_status || '—'}</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Tabs */}
          <div className="cd-tabs" style={{ flexShrink: 0 }}>
            {TABS.map((tab, i) => (
              <button key={tab} className={`cd-tab ${activeTab === i ? 'active' : ''}`}
                id={`cd-tab-${i}`} onClick={() => setActiveTab(i)}>{tab}</button>
            ))}
          </div>

          {/* Content grid */}
          <div className="cd-grid">

            {/* LEFT */}
            <div className="cd-left">

              {activeTab === 0 && (
                <>
                  <div className="cd-card">
                    <div className="cd-card-header">
                      <span className="cd-card-title">Physical Attributes</span>
                    </div>
                    <div className="cd-card-body">
                      <div className="cd-card-cols">
                        <div>
                          <div className="cd-kv-list">
                            <div className="cd-kv"><span className="cd-kv-key">Gender</span><span className="cd-kv-val">{customer.gender || '—'}</span></div>
                            <div className="cd-kv"><span className="cd-kv-key">Height</span><span className="cd-kv-val">{customer.height_cm ? `${customer.height_cm} cm` : '—'}</span></div>
                          </div>
                        </div>
                        <div>
                          <div className="cd-kv-list">
                            <div className="cd-kv"><span className="cd-kv-key">Complexion</span><span className="cd-kv-val">{customer.complexion || '—'}</span></div>
                            <div className="cd-kv"><span className="cd-kv-key">Body Type</span><span className="cd-kv-val">{customer.body_type || '—'}</span></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

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
                            <div className="cd-kv"><span className="cd-kv-key">Company</span><span className="cd-kv-val">{customer.company || '—'}</span></div>
                            <div className="cd-kv"><span className="cd-kv-key">Income</span><span className="cd-kv-val">{customer.annual_income ? `₹${customer.annual_income.toLocaleString()}L` : '—'}</span></div>
                            <div className="cd-kv"><span className="cd-kv-key">Employed In</span><span className="cd-kv-val">{customer.employed_in || '—'}</span></div>
                          </div>
                        </div>
                        <div>
                          <div className="cd-section-label">Education</div>
                          <div className="cd-kv-list">
                            <div className="cd-kv"><span className="cd-kv-key">Degree</span><span className="cd-kv-val">{customer.education || '—'}</span></div>
                            <div className="cd-kv"><span className="cd-kv-key">College</span><span className="cd-kv-val">{customer.college || '—'}</span></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 1 && (
                <>
                  <div className="cd-card">
                    <div className="cd-card-header">
                      <span className="cd-card-title">Lifestyle &amp; Plans</span>
                      <button className="cd-edit-btn" id="cd-edit-lifestyle"><span className="ms">edit</span></button>
                    </div>
                    <div className="cd-card-body">
                      <div className="cd-card-cols">
                        <div>
                          <div className="cd-section-label">Languages Known</div>
                          <div className="cd-habits-list">
                            {customer.languages && customer.languages.length > 0 ? customer.languages.map(lang => (
                              <span key={lang} className="cd-habit-chip"><span className="ms">language</span>{lang}</span>
                            )) : <span className="cd-kv-val">—</span>}
                          </div>
                          <div className="cd-section-label" style={{ marginTop: 12 }}>Habits</div>
                          <div className="cd-habits-list">
                            {customer.diet && <span className="cd-habit-chip"><span className="ms">restaurant</span>{customer.diet}</span>}
                            {customer.smoking === 'Never' && <span className="cd-habit-chip"><span className="ms">smoke_free</span>Non-Smoker</span>}
                            {customer.smoking && customer.smoking !== 'Never' && <span className="cd-habit-chip"><span className="ms">smoking_rooms</span>{customer.smoking}</span>}
                            {customer.drinking && <span className="cd-habit-chip"><span className="ms">liquor</span>{customer.drinking}</span>}
                            {customer.physical_activity && <span className="cd-habit-chip"><span className="ms">fitness_center</span>{customer.physical_activity}</span>}
                          </div>
                          {(customer.marriage_timeline || customer.want_kids || customer.open_to_relocate !== undefined) && <>
                            <div className="cd-section-label" style={{ marginTop: 12 }}>Future Plans</div>
                            <div className="cd-kv-list">
                              {customer.marriage_timeline && (
                                <div className="cd-kv"><span className="cd-kv-key">Marriage Timeline</span><span className="cd-kv-val">{customer.marriage_timeline}</span></div>
                              )}
                              {customer.want_kids && (
                                <div className="cd-kv"><span className="cd-kv-key">Wants Kids</span><span className="cd-kv-val">{customer.want_kids}</span></div>
                              )}
                              {customer.open_to_relocate !== undefined && (
                                <div className="cd-kv"><span className="cd-kv-key">Relocation</span><span className="cd-kv-val">{customer.open_to_relocate ? 'Open to relocate' : 'Not open to relocate'}</span></div>
                              )}
                            </div>
                          </>}
                        </div>
                        <div>
                          <div className="cd-section-label">Personality &amp; Interests</div>
                          <div className="cd-kv-list">
                            <div className="cd-kv"><span className="cd-kv-key">Personality</span><span className="cd-kv-val">{customer.personality_type || '—'}</span></div>
                            <div className="cd-kv"><span className="cd-kv-key">Pets</span><span className="cd-kv-val">{customer.open_to_pets ? 'Open to pets' : 'Not open to pets'}</span></div>
                            <div className="cd-kv" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                              <span className="cd-kv-key" style={{ marginBottom: 4 }}>Interests</span>
                              <div className="cd-habits-list">
                                {customer.interests && customer.interests.length > 0 ? customer.interests.map(interest => (
                                  <span key={interest} className="cd-tag">{interest}</span>
                                )) : <span className="cd-kv-val">—</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 2 && (
                <>
                  <div className="cd-card">
                    <div className="cd-card-header">
                      <span className="cd-card-title">Partner Preferences</span>
                      <button className="cd-edit-btn" id="cd-edit-prefs"><span className="ms">edit</span></button>
                    </div>
                    <div className="cd-card-body">
                      <div className="cd-card-cols">
                        <div>
                          <div className="cd-section-label">Basic Criteria</div>
                          <div className="cd-pref-list">
                            {customer.pref_age_min && <div className="cd-pref-item"><span className="ms">check_circle</span>Age: {customer.pref_age_min}–{customer.pref_age_max}</div>}
                            {customer.pref_location && customer.pref_location.length > 0 && <div className="cd-pref-item"><span className="ms">check_circle</span>Location: {customer.pref_location.join(', ')}</div>}
                            {customer.pref_education && customer.pref_education.length > 0 && <div className="cd-pref-item"><span className="ms">check_circle</span>Education: {customer.pref_education.join(', ')}</div>}
                            {(customer.pref_income_min || customer.pref_income_max) && <div className="cd-pref-item"><span className="ms">check_circle</span>Income: {customer.pref_income_min ? `₹${customer.pref_income_min}L` : 'Any'} – {customer.pref_income_max ? `₹${customer.pref_income_max}L` : 'Any'}</div>}
                          </div>
                        </div>
                        <div>
                          <div className="cd-section-label">Background &amp; Lifestyle</div>
                          <div className="cd-pref-list">
                            {customer.pref_religion && customer.pref_religion.length > 0 && <div className="cd-pref-item"><span className="ms">check_circle</span>Religion: {customer.pref_religion.join(', ')}</div>}
                            {customer.pref_caste && customer.pref_caste.length > 0 && <div className="cd-pref-item"><span className="ms">check_circle</span>Caste: {customer.pref_caste.join(', ')}</div>}
                            {customer.pref_diet && customer.pref_diet.length > 0 && <div className="cd-pref-item"><span className="ms">check_circle</span>Diet: {customer.pref_diet.join(', ')}</div>}
                            {customer.pref_family_type && customer.pref_family_type.length > 0 && <div className="cd-pref-item"><span className="ms">check_circle</span>Family: {customer.pref_family_type.join(', ')}</div>}
                            {customer.pref_manglik && <div className="cd-pref-item"><span className="ms">check_circle</span>Manglik: {customer.pref_manglik}</div>}
                          </div>
                        </div>
                      </div>
                      {customer.deal_breakers?.length > 0 && (
                        <div style={{ marginTop: 20 }}>
                          <div className="cd-section-label">Deal Breakers</div>
                          <div className="cd-pref-list" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                            {customer.deal_breakers.map((db, i) => (
                              <div key={i} className="cd-pref-item deal-breaker" style={{ margin: 0 }}><span className="ms breaker">cancel</span>{db}</div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {activeTab === 3 && (
                <>
                  <div className="cd-card">
                    <div className="cd-card-header">
                      <span className="cd-card-title">Family Details</span>
                      <button className="cd-edit-btn" id="cd-edit-family"><span className="ms">edit</span></button>
                    </div>
                    <div className="cd-card-body">
                      <div className="cd-card-cols">
                        <div>
                          <div className="cd-section-label">Background</div>
                          <div className="cd-kv-list">
                            <div className="cd-kv"><span className="cd-kv-key">Religion</span><span className="cd-kv-val">{customer.religion || '—'}</span></div>
                            <div className="cd-kv"><span className="cd-kv-key">Caste</span><span className="cd-kv-val">{customer.caste || '—'}</span></div>
                            <div className="cd-kv"><span className="cd-kv-key">Sub Caste</span><span className="cd-kv-val">{customer.sub_caste || '—'}</span></div>
                            <div className="cd-kv"><span className="cd-kv-key">Mother Tongue</span><span className="cd-kv-val">{customer.mother_tongue || '—'}</span></div>
                            <div className="cd-kv"><span className="cd-kv-key">Manglik Status</span><span className="cd-kv-val">{customer.manglik_status || '—'}</span></div>
                          </div>
                        </div>
                        <div>
                          <div className="cd-section-label">Family Setup</div>
                          <div className="cd-kv-list">
                            <div className="cd-kv"><span className="cd-kv-key">Family Type</span><span className="cd-kv-val">{customer.family_type || '—'}</span></div>
                            <div className="cd-kv"><span className="cd-kv-key">Values</span><span className="cd-kv-val"><span className="cd-tag">{customer.family_values || '—'}</span></span></div>
                            <div className="cd-kv"><span className="cd-kv-key">Father's Occ.</span><span className="cd-kv-val">{customer.father_occupation || '—'}</span></div>
                            <div className="cd-kv"><span className="cd-kv-key">Mother's Occ.</span><span className="cd-kv-val">{customer.mother_occupation || '—'}</span></div>
                            <div className="cd-kv"><span className="cd-kv-key">Siblings</span><span className="cd-kv-val">{customer.num_siblings ?? '—'}</span></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

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

              {/* Sent Matches */}
              <div className="cd-timeline-card">
                <div className="cd-timeline-title">Sent Matches History</div>
                <div style={{ padding: '0 20px 20px' }}>
                  {sentMatch.length === 0 ? (
                    <div style={{ fontSize: 13, color: '#777', padding: '8px 0' }}>No matches sent yet.</div>
                  ) : sentMatch.map(m => (
                    <div key={m.id} className="cd-match-card" style={{ marginBottom: 12 }}>
                      <DefaultAvatar className="cd-match-photo" style={{ borderRadius: '6px' }} />
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
                          {m.annual_income && <div className="cd-match-meta-item"><span className="cd-match-meta-label">Income</span><span className="cd-match-meta-val">₹{m.annual_income.toLocaleString()}L</span></div>}
                          {m.sent_at && <div className="cd-match-meta-item"><span className="cd-match-meta-label">Sent</span><span className="cd-match-meta-val">{fmtDate(m.sent_at)}</span></div>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="cd-notes-card">
                <div className="cd-notes-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  Consultant Notes
                  <select
                    className="cd-status-select"
                    style={{ padding: '4px 8px', fontSize: 12, borderRadius: 4, border: '1px solid #ddd', height: 'auto', background: 'transparent' }}
                    value={noteType}
                    onChange={e => setNoteType(e.target.value)}
                  >
                    <option value="General Note">General Note</option>
                    <option value="Call">Call</option>
                    <option value="Meeting">Meeting</option>
                    <option value="Follow Up">Follow Up</option>
                  </select>
                </div>
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
                        <div className="cd-note-label" style={{ fontWeight: 600, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>{n.note_type === 'Call' ? '📞' : n.note_type === 'Meeting' ? '🤝' : n.note_type === 'Follow Up' ? '🔄' : '📝'}</span>
                          {n.note_type === 'General Note' ? 'Note' : n.note_type}
                          <span className="cd-note-date" style={{ fontWeight: 500, opacity: 0.6 }}>• {fmtDate(n.created_at).toUpperCase()}</span>
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
