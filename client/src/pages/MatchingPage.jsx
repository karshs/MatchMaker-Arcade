import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { matchesApi } from '../api'
import { useNotification } from '../context/NotificationContext'
import './MatchingPage.css'

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

/* ── Tier helpers ──────────────────────────────────────────── */
function getTier(score) {
  if (score >= 90) return 'excellent'
  if (score >= 70) return 'good'
  return 'fair'
}

function getTierLabel(score) {
  if (score >= 90) return 'Excellent'
  if (score >= 70) return 'Good Match'
  return 'Fair Match'
}

const NAV = [
  { icon: 'dashboard', label: 'Dashboard',     path: '/'          },
  { icon: 'group',     label: 'Customers',     path: '/customers', active: true },
]

/* ── Match card ────────────────────────────────────────────── */
function MatchCard({ candidate, customerId, customerName, onSendSuccess }) {
  const tier      = getTier(candidate.compatibility_score)
  const tierLabel = getTierLabel(candidate.compatibility_score)

  const [showBreakdown, setShowBreakdown] = useState(false)
  const [showAI,           setShowAI]           = useState(false)
  const [sent,             setSent]             = useState(false)
  const [sending,          setSending]          = useState(false)
  const [barWidth,         setBarWidth]         = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setBarWidth(candidate.compatibility_score), 150)
    return () => clearTimeout(t)
  }, [candidate.compatibility_score])

  async function handleSend() {
    if (sent || sending) return
    setSending(true)
    try {
      await matchesApi.sendMatch(customerId, candidate.id, candidate.compatibility_score)
      setSent(true)
      if (onSendSuccess) onSendSuccess(candidate)
    } catch (err) {
      alert(err.message || 'Failed to send match.')
    } finally {
      setSending(false)
    }
  }

  // Build traits from breakdown + score label
  const traits = []
  if (candidate.match_label)       traits.push({ label: candidate.match_label, highlight: true })
  if (candidate.religion)          traits.push({ label: candidate.religion, highlight: false })
  if (candidate.diet)              traits.push({ label: candidate.diet, highlight: false })
  if (candidate.family_values)     traits.push({ label: candidate.family_values, highlight: false })
  if (candidate.activity_multiplier < 0.9) traits.push({ label: 'Less Active Profile', highlight: false })

  // Build breakdown rows from score_breakdown
  const bd = candidate.score_breakdown || {}
  const breakdownRows = Object.entries(bd).map(([key, val]) => ({
    key: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    val: typeof val === 'number' ? `${val} pts` : String(val),
    warn: val === 0 || val === false,
  }))

  return (
    <div className={`mp-card ${tier}`}>
      <div className="mp-card-main">
        <div className="mp-card-photo-wrap">
          <DefaultAvatar className="mp-card-photo" style={{ borderRadius: '8px' }} />
        </div>

        <div className="mp-card-info">
          <div className="mp-card-top">
            <div>
              <div className="mp-candidate-name">{candidate.first_name} {candidate.last_name}</div>
              <div className="mp-candidate-sub">
                {candidate.age} • {candidate.city} • {candidate.occupation}
              </div>
            </div>
            <div className={`mp-score-block ${tier}`}>
              <div className="mp-score-tier">{tierLabel}</div>
              <div className="mp-score-number">
                {Math.round(candidate.compatibility_score)}<span className="mp-score-pct">%</span>
              </div>
            </div>
          </div>

          <div className="mp-score-bar-track">
            <div className="mp-score-bar-fill" style={{ width: `${barWidth}%` }} />
          </div>

          <div className="mp-traits">
            {traits.slice(0, 4).map(t => (
              <span key={t.label} className={`mp-trait ${t.highlight ? 'highlight' : 'default'}`}>
                {t.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div className={`mp-breakdown ${showBreakdown ? 'mp-breakdown-open' : ''}`}>
        <div className="mp-breakdown-summary" onClick={() => setShowBreakdown(p => !p)} role="button" tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && setShowBreakdown(p => !p)}>
          <span>Compatibility Breakdown</span>
          <span className="ms">expand_more</span>
        </div>
        <div className="mp-breakdown-body">
          {breakdownRows.slice(0, 8).map((row, i) => (
            <div key={i} className="mp-breakdown-row">
              <span className="mp-breakdown-key">{row.key}</span>
              <span className={`mp-breakdown-val ${row.warn ? 'warn' : ''}`}>{row.val}</span>
            </div>
          ))}
          {breakdownRows.length === 0 && (
            <div style={{ fontSize: 12, color: '#aaa', padding: '8px 0' }}>No breakdown available.</div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mp-actions">
        <button className="mp-ai-btn" id={`ai-btn-${candidate.id}`} onClick={() => setShowAI(true)}>
          <span className="ms">psychology</span>AI Insights
        </button>
        <button
          className={`mp-send-btn ${sent ? 'sent' : ''}`}
          id={`send-btn-${candidate.id}`}
          onClick={handleSend}
          disabled={sent || sending}
        >
          <span className="ms">{sent ? 'check_circle' : 'send'}</span>
          {sending ? 'Sending…' : sent ? 'Sent to Client' : 'Send Match'}
        </button>
      </div>

      {/* AI overlay */}
      <div className={`mp-ai-overlay ${showAI ? 'visible' : ''}`}>
        <div className="mp-ai-overlay-head">
          <div className="mp-ai-overlay-title">✦ Intelligence Report</div>
          <button className="mp-ai-close-btn" id={`ai-close-${candidate.id}`} onClick={() => setShowAI(false)}>
            <span className="ms">close</span>
          </button>
        </div>
        <p className="mp-ai-overlay-text">
          {candidate.first_name} is a {tierLabel.toLowerCase()} for this client with a compatibility score of{' '}
          {Math.round(candidate.compatibility_score)}%.
          {candidate.education ? ` Education: ${candidate.education}.` : ''}
          {candidate.want_kids !== undefined ? ` Wants kids: ${candidate.want_kids ? 'Yes' : 'No'}.` : ''}
          {candidate.languages?.length ? ` Languages: ${candidate.languages.join(', ')}.` : ''}
          {candidate.family_values ? ` Family values: ${candidate.family_values}.` : ''}
        </p>
      </div>
    </div>
  )
}

/* ── Page ──────────────────────────────────────────────────── */
export default function MatchingPage() {
  const { id }   = useParams()  // customerId
  const navigate = useNavigate()
  const { matchmaker, logout } = useAuth()

  const [matches,       setMatches]       = useState([])
  const [customerName,  setCustomerName]  = useState('')
  const [customerPhoto, setCustomerPhoto] = useState('')
  const [totalMatches,  setTotalMatches]  = useState(0)
  const [excludedCount, setExcludedCount] = useState(0)
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState('')
  const [search,        setSearch]        = useState('')
  const [sentCandidate, setSentCandidate] = useState(null)
  const { showNotification } = useNotification()

  const handleSendSuccess = useCallback((candidate) => {
    setSentCandidate(candidate)
    showNotification('✓ Match Sent Successfully', '/success_action.wav')
  }, [showNotification])

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await matchesApi.getMatches(id)
      setMatches(res.data)
      setCustomerName(res.customer_name || '')
      setTotalMatches(res.total_matches || 0)
      setExcludedCount(res.excluded_count || 0)
    } catch (err) {
      if (err.status === 401) { logout(); navigate('/login') }
      setError(err.message || 'Failed to load matches.')
    } finally {
      setLoading(false)
    }
  }, [id, logout, navigate])

  useEffect(() => { load() }, [load])

  const visible = matches.filter(c =>
    !search ||
    `${c.first_name} ${c.last_name}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="mp mp-shell">

      {/* Sidebar */}
      <aside className="mp-sidebar">
        <div className="mp-brand-name">The Date Crew</div>
        <div className="mp-brand-sub">Matchmaker Portal</div>
        <button className="mp-new-btn" id="mp-new-case-btn"><span className="ms">add</span>New Matchmaking Case</button>
        <nav className="mp-nav">
          {NAV.map(item => (
            <button key={item.label} className={`mp-nav-link ${item.active ? 'active' : ''}`}
              onClick={() => navigate(item.path)} id={`mp-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}>
              <span className="ms">{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>
        <div className="mp-sidebar-footer">
          <button className="mp-nav-link" id="mp-nav-support"><span className="ms">help</span>Support</button>
          <button className="mp-nav-link" id="mp-nav-signout" onClick={logout}><span className="ms">logout</span>Sign Out</button>
        </div>
      </aside>

      {/* Main */}
      <main className="mp-main">

        {/* Topbar */}
        <header className="mp-topbar">
          <div className="mp-search-wrap">
            <span className="ms mp-search-icon">search</span>
            <input id="mp-search" className="mp-search-input" type="text"
              placeholder="Search candidates..." value={search}
              onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="mp-topbar-right">
            <button className="mp-icon-btn" id="mp-notif-btn"><span className="ms">notifications</span></button>
            <button className="mp-icon-btn" id="mp-settings-btn"><span className="ms">settings</span></button>
            <div style={{ width:30,height:30,borderRadius:'50%',background:'#C8920A',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700 }}>
              {matchmaker?.name?.split(' ').map(w=>w[0]).join('').slice(0,2)||'MM'}
            </div>
          </div>
        </header>

        {/* Canvas */}
        <div className="mp-canvas">

          {/* Hero */}
          <section className="mp-hero">
            <div className="mp-hero-photo-wrap">
              <DefaultAvatar className="mp-hero-photo" />
            </div>
            <div className="mp-hero-info">
              <div className="mp-hero-eyebrow">✦ Active Discovery</div>
              <h1 className="mp-hero-title">
                Finding matches for {customerName || '…'}
              </h1>
              {loading ? (
                <p className="mp-hero-sub">Loading candidates…</p>
              ) : (
                <>
                  <p className="mp-hero-sub">
                    <strong>{totalMatches} candidates</strong> pre-filtered based on core preferences and psychological alignment.
                  </p>
                  <p className="mp-hero-note">
                    {excludedCount} candidates were automatically hidden because they were already sent or marked Interested.
                  </p>
                </>
              )}
            </div>
          </section>

          {/* Error */}
          {error && (
            <div style={{ padding:'12px 28px', color:'#C62828', fontSize: 13 }}>{error}</div>
          )}

          {/* Grid */}
          <div className="mp-grid-wrap">
            {loading ? (
              <div className="mp-grid" style={{ display:'flex',alignItems:'center',justifyContent:'center',height:200,gridColumn:'1/-1' }}>
                <span style={{ color:'#777',fontSize:14 }}>Running match engine…</span>
              </div>
            ) : (
              <div className="mp-grid">
                {visible.map(c => (
                  <MatchCard 
                    key={c.id} 
                    candidate={c} 
                    customerId={id} 
                    customerName={customerName}
                    onSendSuccess={handleSendSuccess}
                  />
                ))}
                {visible.length === 0 && (
                  <div style={{ gridColumn:'1/-1',padding:24,color:'#777',fontSize:13 }}>
                    No candidates found{search ? ` for "${search}"` : ''}.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <footer className="mp-footer">
            <div className="mp-legend">
              <span className="mp-legend-item"><span className="mp-legend-dot excellent"/>90%+ Excellent</span>
              <span className="mp-legend-item"><span className="mp-legend-dot good"/>70–89% Good</span>
              <span className="mp-legend-item"><span className="mp-legend-dot fair"/>&lt;70% Fair</span>
            </div>
            <span className="mp-footer-note">Sorted by Score (Descending) • Live Match Engine</span>
          </footer>

        </div>
      </main>

      {/* Page-level Success Modal */}
      {sentCandidate && (
        <div className="mp-modal-overlay">
          <div className="mp-modal">
            <button className="mp-modal-close" onClick={() => setSentCandidate(null)}>
              <span className="ms">close</span>
            </button>
            <div className="mp-modal-header">
              <span className="ms" style={{ color: '#4CAF50', fontSize: 32, marginBottom: 8 }}>check_circle</span>
              <h2 style={{ margin: 0, fontSize: 20 }}>Match Sent!</h2>
            </div>
            
            <div className="mp-modal-body">
              <p style={{ marginTop: 0, fontSize: 14 }}>You successfully recommended <strong>{sentCandidate.first_name} {sentCandidate.last_name}</strong> to <strong>{customerName || 'your client'}</strong>.</p>
              
              <div className="mp-mock-email">
                <div className="mp-mock-email-header">
                  <strong>Subject:</strong> We found a great match for you!
                </div>
                <div className="mp-mock-email-body">
                  Hi {customerName?.split(' ')[0] || 'there'},<br/><br/>
                  We've identified a highly compatible match for you.<br/>
                  Meet <strong>{sentCandidate.first_name}</strong>, a {sentCandidate.age}-year-old {sentCandidate.occupation || 'professional'} from {sentCandidate.city}.<br/><br/>
                  Based on our matchmaking algorithm, you have a <strong>{Math.round(sentCandidate.compatibility_score)}% compatibility score!</strong><br/><br/>
                  Let us know if you'd like to proceed with a meeting.<br/><br/>
                  Best,<br/>The Date Crew
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
