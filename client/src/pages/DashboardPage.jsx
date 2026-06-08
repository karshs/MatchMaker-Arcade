import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { customersApi, notesApi } from '../api'
import './DashboardPage.css'

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

/* ── Status chip config ────────────────────────────────────── */
const STATUS_CLASS = {
  'Searching':         'searching',
  'Profile Verified':  'verified',
  'Matches Shared':    'review',
  'Interested':        'interested',
  'Call Scheduled':    'call',
  'Meeting Scheduled': 'meeting',
  'Successful Match':  'match',
  'Paused':            'paused',
  'Inactive':          'closed',
}

function initials(first, last) {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase()
}

const NAV = [
  { icon: 'dashboard', label: 'Dashboard',     path: '/'          },
  { icon: 'group',     label: 'Customers',     path: '/customers' },
]

const JOURNEY_FILTERS = [
  'All', 'Searching', 'Interested', 'Call Scheduled',
  'Matches Shared', 'Successful Match', 'Paused', 'Inactive',
]

const LIMIT = 10 // rows per page

export default function DashboardPage() {
  const { matchmaker, logout } = useAuth()
  const navigate = useNavigate()

  /* ── Paginated table state ── */
  const [customers,  setCustomers]  = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 })
  const [page, setPage] = useState(1)

  /* ── Real stat counts (fetched once from all 100, no page limit) ── */
  const [stats, setStats] = useState({
    total:      0,
    searching:  0,
    successful: 0,
    active:     0,
  })

  /* ── Filters ── */
  const [search,         setSearch]         = useState('')
  const [statusFilter,   setStatusFilter]   = useState('')
  const [religionFilter, setReligionFilter] = useState('')
  const [cityFilter,     setCityFilter]     = useState('')

  /* ── Quick Notes State ── */
  const [quickNotesCustomer, setQuickNotesCustomer] = useState(null)
  const [quickNotes,         setQuickNotes]         = useState([])
  const [loadingNotes,       setLoadingNotes]       = useState(false)

  const handleQuickNotes = useCallback(async (ev, customer) => {
    ev.stopPropagation()
    setQuickNotesCustomer(customer)
    setLoadingNotes(true)
    setQuickNotes([])
    try {
      const res = await notesApi.list(customer.id)
      setQuickNotes(res.data.slice(0, 3)) // Take top 3
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingNotes(false)
    }
  }, [])

  /* ── Fetch paginated table rows ── */
  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await customersApi.list({
        search:         search        || undefined,
        journey_status: statusFilter  || undefined,
        religion:       religionFilter || undefined,
        city:           cityFilter    || undefined,
        page,
        limit: LIMIT,
        sort: 'last_updated',
      })
      setCustomers(res.data)
      setPagination(res.pagination)
    } catch (err) {
      if (err.status === 401) { logout(); navigate('/login') }
      setError(err.message || 'Failed to load customers.')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, religionFilter, cityFilter, page, logout, navigate])

  useEffect(() => { fetchCustomers() }, [fetchCustomers])

  /* ── Fetch global stats once (no filters, high limit) ── */
  useEffect(() => {
    async function fetchStats() {
      try {
        // Fetch counts per relevant status using the count from pagination.total
        const [allRes, searchingRes, successRes] = await Promise.all([
          customersApi.list({ limit: 1, page: 1 }),
          customersApi.list({ limit: 1, page: 1, journey_status: 'Searching' }),
          customersApi.list({ limit: 1, page: 1, journey_status: 'Successful Match' }),
        ])
        setStats({
          total:      allRes.pagination.total,
          searching:  searchingRes.pagination.total,
          successful: successRes.pagination.total,
          active:     allRes.pagination.total,
        })
      } catch {
        // stats are cosmetic — don't block the UI
      }
    }
    fetchStats()
  }, [])

  /* ── Derived page numbers for the paginator ── */
  const totalPages = pagination.totalPages || 1

  // Show at most 5 page buttons around the current page
  function getPageRange(current, total) {
    const delta = 2
    const range = []
    for (
      let i = Math.max(1, current - delta);
      i <= Math.min(total, current + delta);
      i++
    ) {
      range.push(i)
    }
    return range
  }

  const pageRange = getPageRange(page, totalPages)

  /* ── Reset to page 1 when filters change ── */
  function applyFilter(setter) {
    return (e) => {
      setter(e.target.value)
      setPage(1)
    }
  }

  return (
    <div className="db db-shell">

      {/* ── Sidebar ── */}
      <aside className="db-sidebar">
        <div className="db-brand-name">The Date Crew</div>
        <div className="db-brand-sub">Matchmaker Portal</div>

        <button className="db-new-btn" id="db-new-case">
          <span className="ms">add</span>New Matchmaking Case
        </button>

        <nav className="db-nav">
          {NAV.map(item => (
            <button
              key={item.label}
              className={`db-nav-link ${item.label === 'Dashboard' ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
              id={`db-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <span className="ms">{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>

        <div className="db-sidebar-footer">
          <button className="db-nav-link" id="db-nav-support">
            <span className="ms">help</span>Support
          </button>
          <button className="db-nav-link" id="db-nav-signout" onClick={logout}>
            <span className="ms">logout</span>Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="db-main">

        {/* Topbar */}
        <header className="db-topbar">
          <div className="db-topbar-user">
            <div className="db-topbar-avatar">
              {matchmaker?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'MM'}
            </div>
            <div>
              <div className="db-topbar-name">{matchmaker?.name || 'Matchmaker'}</div>
              <div className="db-topbar-role">Senior Matchmaker</div>
            </div>
          </div>

          <div className="db-topbar-search-wrap">
            <span className="ms db-topbar-search-icon">search</span>
            <input
              id="db-global-search"
              className="db-topbar-search"
              placeholder="Quick search dossier..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
            />
          </div>

          <div className="db-topbar-actions">
            <button className="db-icon-btn" id="db-notif"><span className="ms">notifications</span></button>
            <button className="db-icon-btn" id="db-settings"><span className="ms">settings</span></button>
          </div>
        </header>

        {/* Canvas */}
        <div className="db-canvas">

          {/* ── Stat cards (uses global stats, not page-local) ── */}
          <div className="db-stats">
            {[
              { label: 'ACTIVE CUSTOMERS',    value: stats.total,      icon: 'group' },
              { label: 'CURRENTLY SEARCHING', value: stats.searching,  icon: 'manage_search' },
              { label: 'SUCCESSFUL MATCHES',  value: stats.successful, icon: 'favorite' },
              { label: 'SHOWING PAGE',
                value: `${page} / ${totalPages}`,
                icon: 'pages',
                small: true },
            ].map(s => (
              <div key={s.label} className="db-stat-card">
                <div className="db-stat-label">{s.label}</div>
                <div className={`db-stat-value ${s.small ? 'db-stat-value--sm' : ''}`}>
                  {s.value}
                </div>
              </div>
            ))}
          </div>

          {/* ── Client table ── */}
          <div className="db-table-card">
            <div className="db-table-header">
              <div className="db-table-title">
                <span className="ms" style={{ color: '#C8920A' }}>star</span>
                Priority Client Dossier
                {pagination.total > 0 && (
                  <span className="db-table-count">{pagination.total} total</span>
                )}
              </div>

              {/* Filters */}
              <div className="db-filters">
                <span className="db-filter-label">
                  <span className="ms" style={{ fontSize: 15 }}>filter_alt</span>
                  FILTERS:
                </span>

                <select id="db-filter-status" className="db-filter-select"
                  value={statusFilter} onChange={applyFilter(setStatusFilter)}>
                  <option value="">Stage: All</option>
                  {JOURNEY_FILTERS.slice(1).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>

                <select id="db-filter-religion" className="db-filter-select"
                  value={religionFilter} onChange={applyFilter(setReligionFilter)}>
                  <option value="">Religion: Any</option>
                  {['Hindu', 'Muslim', 'Christian', 'Sikh', 'Jain', 'Buddhist', 'Other'].map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>

                <input id="db-filter-city" className="db-filter-select"
                  placeholder="City: All" value={cityFilter}
                  onChange={applyFilter(setCityFilter)}
                  style={{ cursor: 'text' }} />
              </div>
            </div>

            {/* Table body */}
            <div className="db-table-wrap">
              {error ? (
                <div style={{ padding: 24, color: '#C62828' }}>{error}</div>
              ) : loading ? (
                <div className="db-loading">
                  <span className="ms db-loading-icon">sync</span>
                  Loading clients…
                </div>
              ) : customers.length === 0 ? (
                <div className="db-loading">No clients match the current filters.</div>
              ) : (
                <table className="db-table">
                  <thead>
                    <tr>
                      <th>CLIENT</th>
                      <th>AGE / LOCATION</th>
                      <th>MARITAL STATUS</th>
                      <th>OCCUPATION</th>
                      <th>STATUS</th>
                      <th>DOSSIER</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map(c => (
                      <tr
                        key={c.id}
                        className="db-table-row"
                        onClick={() => navigate(`/customers/${c.id}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>
                          <div className="db-client-cell">
                            <DefaultAvatar className="db-avatar" />
                            <div>
                              <div className="db-client-name">
                                {c.first_name} {c.last_name}
                              </div>
                              <div className="db-client-id">
                                #{String(c.id).slice(0, 8)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="db-cell-muted">{c.age} / {c.city}</td>
                        <td className="db-cell-muted">{c.marital_status}</td>
                        <td className="db-cell-muted">{c.occupation}</td>
                        <td>
                          <span className={`db-status-chip ${STATUS_CLASS[c.journey_status] || 'paused'}`}>
                            <span className="db-status-dot" />
                            {c.journey_status?.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              className="db-quick-notes-btn"
                              onClick={ev => handleQuickNotes(ev, c)}
                              id={`db-quick-notes-${c.id}`}
                              title="Quick Notes"
                            >
                              <span className="ms" style={{ fontSize: 15 }}>speaker_notes</span>
                            </button>
                            <button
                              className="db-view-btn"
                              onClick={ev => { ev.stopPropagation(); navigate(`/customers/${c.id}`) }}
                              id={`db-view-${c.id}`}
                            >
                              <span className="ms" style={{ fontSize: 15 }}>description</span>
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* ── Pagination row ── */}
            <div className="db-pagination">
              <span className="db-page-info">
                Showing{' '}
                <strong>{(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, pagination.total)}</strong>
                {' '}of{' '}
                <strong>{pagination.total}</strong> clients
              </span>

              <div className="db-page-controls">
                {/* Prev */}
                <button
                  className="db-page-btn db-page-arrow"
                  id="db-prev-page"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  title="Previous page"
                >
                  <span className="ms">chevron_left</span>
                </button>

                {/* First page + ellipsis */}
                {pageRange[0] > 1 && (
                  <>
                    <button className="db-page-btn db-page-num" onClick={() => setPage(1)}>1</button>
                    {pageRange[0] > 2 && <span className="db-page-ellipsis">…</span>}
                  </>
                )}

                {/* Numbered pages */}
                {pageRange.map(n => (
                  <button
                    key={n}
                    className={`db-page-btn db-page-num ${n === page ? 'db-page-num--active' : ''}`}
                    id={`db-page-${n}`}
                    onClick={() => setPage(n)}
                    disabled={n === page}
                  >
                    {n}
                  </button>
                ))}

                {/* Last page + ellipsis */}
                {pageRange[pageRange.length - 1] < totalPages && (
                  <>
                    {pageRange[pageRange.length - 1] < totalPages - 1 && (
                      <span className="db-page-ellipsis">…</span>
                    )}
                    <button className="db-page-btn db-page-num" onClick={() => setPage(totalPages)}>
                      {totalPages}
                    </button>
                  </>
                )}

                {/* Next */}
                <button
                  className="db-page-btn db-page-arrow"
                  id="db-next-page"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  title="Next page"
                >
                  <span className="ms">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Quick Notes Modal ── */}
      {quickNotesCustomer && (
        <div className="db-modal-overlay">
          <div className="db-modal">
            <button className="db-modal-close" onClick={() => setQuickNotesCustomer(null)}>
              <span className="ms">close</span>
            </button>
            <div className="db-modal-header">
              <span className="ms" style={{ color: '#C8920A', fontSize: 32, marginBottom: 8 }}>speaker_notes</span>
              <h2 style={{ margin: 0, fontSize: 20 }}>Quick Notes</h2>
              <p style={{ margin: '4px 0 0 0', fontSize: 14, color: '#777' }}>
                {quickNotesCustomer.first_name} {quickNotesCustomer.last_name}
              </p>
            </div>
            
            <div className="db-modal-body">
              {loadingNotes ? (
                <div className="db-loading">
                  <span className="ms db-loading-icon">sync</span> Loading notes…
                </div>
              ) : quickNotes.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#777', padding: '24px 0' }}>
                  No notes found for this customer.
                </div>
              ) : (
                <div className="db-quick-notes-list">
                  {quickNotes.map(note => (
                    <div key={note.id} className="db-quick-note">
                      <div className="db-quick-note-head">
                        <span className="db-quick-note-type">{note.note_type}</span>
                        <span className="db-quick-note-date">{new Date(note.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="db-quick-note-content">{note.content}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="db-modal-footer">
              <button 
                className="db-modal-primary-btn" 
                onClick={() => navigate(`/customers/${quickNotesCustomer.id}`)}
              >
                Open Full Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
