import { useState, useEffect } from 'react'
import './MatchingPage.css'

/* ── Score tier helper ─────────────────────────────────────── */
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

/* ── Mock data (swap with GET /api/matches?clientId=:id) ─────
   Each candidate has: id, name, sub, score, traits,
   breakdown rows, aiInsight, photoUrl
   ─────────────────────────────────────────────────────────── */
const CLIENT = {
  name:     'Julianne V.',
  total:    124,
  hidden:   12,
  photoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA5p6mWSrv8Cma0UCFyHHMPe-Hgnlub79wNr-nJCZGZfTUAnHSJJWcgIuiYDLruNpEzg3JMHs5dfgcOulYUp6TGnlN0uYIMnNM3yaodNXJSqCvGO54gn_tROtC3SSYiXFiWF_4N7ilEK0OS9WlVfYZzluxq1wY1tDQ81dNvfwT-CXWCODNV9X-oBNNAOK1fINabVtkgiPh0QVhdAaVmE-x7731mah21ySAtZb_4aT_Dimc44lk_GiHttK93sqXiHE2BTpkcYWFh1oQ',
}

const CANDIDATES = [
  {
    id: 1,
    name:    'Marcus Thorne',
    sub:     '38 • San Francisco • Venture Architect',
    score:   94,
    traits:  [
      { label: 'Stable Income',   highlight: false },
      { label: 'Philanthropy',    highlight: false },
      { label: 'Verified Account',highlight: true  },
    ],
    breakdown: [
      { key: 'Children Pref.', val: 'Match',      warn: false },
      { key: 'Age Gap',        val: 'Optimal',    warn: false },
      { key: 'Height',         val: 'Ideal',      warn: false },
      { key: 'Income',         val: 'High Match', warn: false },
      { key: 'Family Values',  val: 'Identical',  warn: false },
      { key: 'Location',       val: 'Local',      warn: false },
      { key: 'Lifestyle',      val: 'Balanced',   warn: false },
    ],
    aiInsight: '"Marcus demonstrates a 98% value-alignment with Julianne\'s stated desire for long-term philanthropic partnership. Their shared interest in brutalist architecture and venture capital creates a unique intellectual common ground. Recommend emphasizing his recent sabbatical in Patagonia during the introduction."',
    photoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBRphnh3DoTE69F5x-nFWrx0vRjiRWT_ZTyF3muoaLhxlHc3606O6FdifXuF0vWERSw3DYt89LJyNuSw5RBRVvnSyCvPjG82xEU1SLwzRb748Lfdhza11PlgjXN3_5crNqP7kqlyby037hEaeB8FBXXJs-jPJHZmE26f-Lq9zNu5ndCKRQkDzysZsdBDGyLS4lB1IFQNf0BOUrvTlpaGRtW8oWVAJEdCP9choGD8OlbP2h6X8OdAPvRMWfHBtwUhBvaen9dGIKEDtg',
  },
  {
    id: 2,
    name:    'Soren Haug',
    sub:     '41 • London • Creative Director',
    score:   92,
    traits:  [
      { label: 'Art Collector', highlight: false },
      { label: 'Dog Owner',     highlight: false },
    ],
    breakdown: [
      { key: 'Children Pref.', val: 'Match',         warn: false },
      { key: 'Age Gap',        val: 'Good',           warn: false },
      { key: 'Height',         val: 'Ideal',          warn: false },
      { key: 'Income',         val: 'Match',          warn: false },
      { key: 'Family Values',  val: 'High',           warn: false },
      { key: 'Location',       val: 'International',  warn: false },
      { key: 'Lifestyle',      val: 'Artistic',       warn: false },
    ],
    aiInsight: '"Soren matches Julianne\'s aesthetic sensibilities perfectly. As a Creative Director, his lifestyle mirrors her interest in the contemporary art scene. Both have histories of residence in Oslo, providing a strong cultural anchor."',
    photoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBGA77G193osI_ZXLBGTmsf3LB7rWpZ_0loJXZ--ndnKqHUIBmYeEtY42Qql0jvviN9PSWt7y5USsofDV7IhPPyLi04mlSDMFjmEsIzeiyYA60rW82K6ZsTEviKADYY3Dh0BQZXU94a4mzH4BaO_hRbQ7CGMDhLhTVnnz_RqhaQUbN1JPELtBvFlcgsNUfdiKafc0O0zhC5Q4zzfBBoNLfTtE0-m_fYACihA9ha72vyWHybjZTDptU8QtV-BXN4N7LVOV6r1Gqv388',
  },
  {
    id: 3,
    name:    'Elias Vance',
    sub:     '39 • Austin • Fintech Founder',
    score:   78,
    traits:  [
      { label: 'Fintech Leader', highlight: false },
      { label: 'Serial Founder', highlight: false },
    ],
    breakdown: [
      { key: 'Children Pref.', val: 'Match',        warn: false },
      { key: 'Age Gap',        val: 'Good',          warn: false },
      { key: 'Height',         val: 'Ideal',         warn: false },
      { key: 'Income',         val: 'High',          warn: false },
      { key: 'Family Values',  val: 'Moderate',      warn: false },
      { key: 'Location',       val: 'Moderate Gap',  warn: true  },
      { key: 'Lifestyle',      val: 'Balanced',      warn: false },
    ],
    aiInsight: '"Elias represents a \'growth match\'. While currently based in Austin, his expansion plans for 2024 include a London office, potentially resolving the geographical mismatch. Intellectually, they are extremely well aligned."',
    photoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCGpbTnmgfGXzJK7yTPJu-Qs-lBK5pjaWoulk9ebquNBJkEC48KdiooWGWp6yK-ck17qI7ogJgVcWzkRDCj1tQZZuAINc85OJhGlAgOtjsH988RPEEFWgMbN0ZC9vzFXW2jQwPVldOjPyMn7015oBMZVTLPjpY_WydfTw3hutUx8uHz4vOy1tTQ9XzpJN766MPYU0O1yHdPXxyJcnTK1tufGqWCYHjTj-7CICyrnglQLv9j-l2uDGalaB32mEmUV5lNHRQ9kIKYXtA',
  },
  {
    id: 4,
    name:    'Aiden Marlowe',
    sub:     '36 • New York • Investment Banker',
    score:   85,
    traits:  [
      { label: 'World Traveler', highlight: false },
      { label: 'Culinary Arts',  highlight: true  },
    ],
    breakdown: [
      { key: 'Children Pref.', val: 'Match',   warn: false },
      { key: 'Age Gap',        val: 'Optimal', warn: false },
      { key: 'Height',         val: 'Ideal',   warn: false },
      { key: 'Income',         val: 'High',    warn: false },
      { key: 'Family Values',  val: 'Strong',  warn: false },
      { key: 'Location',       val: 'Close',   warn: false },
      { key: 'Lifestyle',      val: 'Active',  warn: false },
    ],
    aiInsight: '"Aiden\'s cosmopolitan lifestyle and appreciation for fine dining closely mirrors Julianne\'s known preferences. His NY base provides logistical ease for first meetings and his investment background aligns with her financial expectations."',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop&crop=face',
  },
]

const NAV = [
  { icon: 'dashboard', label: 'Dashboard',     active: false },
  { icon: 'group',     label: 'Customers',     active: true  },
  { icon: 'search',    label: 'Global Search', active: false },
  { icon: 'event',     label: 'Calendar',      active: false },
]

/* ── Match Card ────────────────────────────────────────────── */
function MatchCard({ candidate }) {
  const tier = getTier(candidate.score)
  const tierLabel = getTierLabel(candidate.score)

  const [showBreakdown, setShowBreakdown] = useState(false)
  const [showAI,        setShowAI]        = useState(false)
  const [sent,          setSent]          = useState(false)
  const [barWidth,      setBarWidth]      = useState(0)

  // Animate bar on mount
  useEffect(() => {
    const t = setTimeout(() => setBarWidth(candidate.score), 120)
    return () => clearTimeout(t)
  }, [candidate.score])

  function handleSend() {
    if (sent) return
    setSent(true)
    // TODO: POST /api/matches/send { candidateId, clientId }
  }

  return (
    <div className={`mp-card ${tier}`}>

      {/* Main content */}
      <div className="mp-card-main">
        {/* Photo */}
        <div className="mp-card-photo-wrap">
          <img className="mp-card-photo" src={candidate.photoUrl} alt={candidate.name} />
        </div>

        {/* Info */}
        <div className="mp-card-info">
          <div className="mp-card-top">
            <div>
              <div className="mp-candidate-name">{candidate.name}</div>
              <div className="mp-candidate-sub">{candidate.sub}</div>
            </div>
            <div className={`mp-score-block ${tier}`}>
              <div className="mp-score-tier">{tierLabel}</div>
              <div className="mp-score-number">
                {candidate.score}<span className="mp-score-pct">%</span>
              </div>
            </div>
          </div>

          {/* Score bar */}
          <div className="mp-score-bar-track">
            <div
              className="mp-score-bar-fill"
              style={{ width: `${barWidth}%` }}
            />
          </div>

          {/* Trait chips */}
          <div className="mp-traits">
            {candidate.traits.map(t => (
              <span
                key={t.label}
                className={`mp-trait ${t.highlight ? 'highlight' : 'default'}`}
              >
                {t.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Compatibility breakdown (collapsible) */}
      <div className={`mp-breakdown ${showBreakdown ? 'mp-breakdown-open' : ''}`}>
        <div
          className="mp-breakdown-summary"
          onClick={() => setShowBreakdown(p => !p)}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && setShowBreakdown(p => !p)}
        >
          <span>Compatibility Breakdown</span>
          <span className="ms">expand_more</span>
        </div>
        <div className="mp-breakdown-body">
          {candidate.breakdown.map((row, i) => (
            <div key={i} className="mp-breakdown-row">
              <span className="mp-breakdown-key">{row.key}</span>
              <span className={`mp-breakdown-val ${row.warn ? 'warn' : ''}`}>{row.val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="mp-actions">
        <button
          className="mp-ai-btn"
          id={`ai-btn-${candidate.id}`}
          onClick={() => setShowAI(true)}
        >
          <span className="ms">psychology</span>
          AI Insights
        </button>
        <button
          className={`mp-send-btn ${sent ? 'sent' : ''}`}
          id={`send-btn-${candidate.id}`}
          onClick={handleSend}
          disabled={sent}
        >
          <span className="ms">{sent ? 'check_circle' : 'send'}</span>
          {sent ? 'Sent to Client' : 'Send Match'}
        </button>
      </div>

      {/* AI Insights overlay */}
      <div className={`mp-ai-overlay ${showAI ? 'visible' : ''}`}>
        <div className="mp-ai-overlay-head">
          <div className="mp-ai-overlay-title">✦ Intelligence Report</div>
          <button
            className="mp-ai-close-btn"
            id={`ai-close-${candidate.id}`}
            onClick={() => setShowAI(false)}
          >
            <span className="ms">close</span>
          </button>
        </div>
        <p className="mp-ai-overlay-text">{candidate.aiInsight}</p>
      </div>

    </div>
  )
}

/* ── Page ──────────────────────────────────────────────────── */
export default function MatchingPage() {
  const [search, setSearch] = useState('')

  const visible = CANDIDATES.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="mp mp-shell">

      {/* Sidebar */}
      <aside className="mp-sidebar">
        <div className="mp-brand-name">The Date Crew</div>
        <div className="mp-brand-sub">Matchmaker Portal</div>

        <button className="mp-new-btn" id="mp-new-case-btn">
          <span className="ms">add</span>
          New Matchmaking Case
        </button>

        <nav className="mp-nav">
          {NAV.map(item => (
            <button
              key={item.label}
              className={`mp-nav-link ${item.active ? 'active' : ''}`}
              id={`mp-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <span className="ms">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mp-sidebar-footer">
          <button className="mp-nav-link" id="mp-nav-support">
            <span className="ms">help</span>Support
          </button>
          <button className="mp-nav-link" id="mp-nav-signout">
            <span className="ms">logout</span>Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="mp-main">

        {/* Topbar */}
        <header className="mp-topbar">
          <div className="mp-search-wrap">
            <span className="ms mp-search-icon">search</span>
            <input
              id="mp-search"
              className="mp-search-input"
              type="text"
              placeholder="Search matches..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="mp-topbar-right">
            <button className="mp-icon-btn" id="mp-notif-btn" title="Notifications">
              <span className="ms">notifications</span>
            </button>
            <button className="mp-icon-btn" id="mp-settings-btn" title="Settings">
              <span className="ms">settings</span>
            </button>
            <img
              className="mp-topbar-avatar"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBq8wpLjKXfJUrRvNcjwdY1kvqogj_rfcK8FHUn6GbBHFNogIXg2f5jlbQB-61iZVDRJd6HrQMgUhkuTXvJ2z7mp0rdyANjDghsKHOA4ky7PlF_G84GDajXpdz0qsLe3h6HEczwrh1etz0H-aqMKh3yigcb513DzY_QFIRkdl6nLnKumxNNXy3pUmUcrp5C5rS7wXhGPvxfnJlWTrNnys2X7Kx8qVeuKIsBdgdw0uMhzE7l6dK6rLj1aUuH43cg7bVxaxhPjs_DXV4"
              alt="Matchmaker avatar"
            />
          </div>
        </header>

        {/* Canvas */}
        <div className="mp-canvas">

          {/* Hero header */}
          <section className="mp-hero">
            <div className="mp-hero-photo-wrap">
              <img className="mp-hero-photo" src={CLIENT.photoUrl} alt={CLIENT.name} />
            </div>
            <div className="mp-hero-info">
              <div className="mp-hero-eyebrow">✦ Active Discovery</div>
              <h1 className="mp-hero-title">Finding matches for {CLIENT.name}</h1>
              <p className="mp-hero-sub">
                <strong>{CLIENT.total} candidates</strong> pre-filtered based on core preferences and psychological alignment.
              </p>
              <p className="mp-hero-note">
                {CLIENT.hidden} candidates were automatically hidden because they were already sent or marked Interested.
              </p>
            </div>
          </section>

          {/* Grid */}
          <div className="mp-grid-wrap">
            <div className="mp-grid">
              {visible.map(c => (
                <MatchCard key={c.id} candidate={c} />
              ))}
            </div>
          </div>

          {/* Footer legend */}
          <footer className="mp-footer">
            <div className="mp-legend">
              <span className="mp-legend-item">
                <span className="mp-legend-dot excellent" />
                90%+ Match
              </span>
              <span className="mp-legend-item">
                <span className="mp-legend-dot good" />
                70–89% Match
              </span>
              <span className="mp-legend-item">
                <span className="mp-legend-dot fair" />
                &lt;70% Match
              </span>
            </div>
            <span className="mp-footer-note">
              Viewing pre-filtered subset • Sorted by Score (Descending)
            </span>
          </footer>

        </div>
      </main>
    </div>
  )
}
