import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { customersApi } from '../api'
import './DashboardPage.css'

/* ── Status chip config ────────────────────────────────────── */
const STATUS_CLASS = {
  'Searching':         'searching',
  'Profile Verified':  'searching',
  'Matches Shared':    'review',
  'Interested':        'interested',
  'Call Scheduled':    'call',
  'Meeting Scheduled': 'call',
  'Successful Match':  'match',
  'Paused':            'paused',
  'Inactive':          'closed',
}

function initials(first, last) {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase()
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const d = Math.floor(diff / 86400000)
  if (d === 0) return 'Today'
  if (d === 1) return 'Yesterday'
  if (d < 7)  return `${d} days ago`
  if (d < 30) return `${Math.floor(d / 7)}w ago`
  return `${Math.floor(d / 30)}mo ago`
}

const NAV = [
  { icon: 'dashboard', label: 'Dashboard',     path: '/'          },
  { icon: 'group',     label: 'Customers',     path: '/customers' },
  { icon: 'search',    label: 'Global Search', path: '/'          },
  { icon: 'event',     label: 'Calendar',      path: '/'          },
]

const JOURNEY_FILTERS = [
  'All', 'Searching', 'Interested', 'Call Scheduled',
  'Matches Shared', 'Successful Match', 'Paused', 'Inactive',
]

export default function DashboardPage() {
  const { matchmaker, logout } = useAuth()
  const navigate = useNavigate()

  /* state */
  const [customers,  setCustomers]  = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 })

  /* filters */
  const [search,        setSearch]        = useState('')
  const [statusFilter,  setStatusFilter]  = useState('')
  const [religionFilter,setReligionFilter] = useState('')
  const [cityFilter,    setCityFilter]    = useState('')
  const [page,          setPage]          = useState(1)

  /* fetch */
  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await customersApi.list({
        search:         search   || undefined,
        journey_status: statusFilter  || undefined,
        religion:       religionFilter || undefined,
        city:           cityFilter || undefined,
        page,
        limit: 10,
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

  /* stats derived from current page */
  const total        = pagination.total
  const searching    = customers.filter(c => c.journey_status === 'Searching').length
  const matchesWeek  = customers.filter(c => c.journey_status === 'Successful Match').length
  const successful   = customers.filter(c =>
    ['Successful Match', 'Interested', 'Call Scheduled'].includes(c.journey_status)
  ).length

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
              {matchmaker?.name?.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() || 'MM'}
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

          {/* Stat cards */}
          <div className="db-stats">
            {[
              { label: 'ACTIVE CUSTOMERS',    value: total,      extra: null },
              { label: 'CURRENTLY SEARCHING', value: searching,  extra: null },
              { label: 'MATCHES THIS WEEK',   value: matchesWeek,extra: <span className="db-stat-trend">↑ 12%</span> },
              { label: 'SUCCESSFUL MATCHES',  value: successful, extra: null },
            ].map(s => (
              <div key={s.label} className="db-stat-card">
                <div className="db-stat-label">{s.label}</div>
                <div className="db-stat-value">{s.value}{s.extra}</div>
              </div>
            ))}
          </div>

          {/* Client table */}
          <div className="db-table-card">
            <div className="db-table-header">
              <div className="db-table-title">
                <span className="ms" style={{ color: '#C8920A' }}>star</span>
                Priority Client Dossier
              </div>

              {/* Filters */}
              <div className="db-filters">
                <span className="db-filter-label">
                  <span className="ms" style={{ fontSize: 15 }}>filter_alt</span>
                  FILTERS:
                </span>
                <select
                  id="db-filter-status"
                  className="db-filter-select"
                  value={statusFilter}
                  onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
                >
                  <option value="">Stage: All</option>
                  {JOURNEY_FILTERS.slice(1).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>

                <select
                  id="db-filter-religion"
                  className="db-filter-select"
                  value={religionFilter}
                  onChange={e => { setReligionFilter(e.target.value); setPage(1) }}
                >
                  <option value="">Religion: Any</option>
                  {['Hindu','Muslim','Christian','Sikh','Jain','Buddhist','Other'].map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>

                <input
                  id="db-filter-city"
                  className="db-filter-select"
                  placeholder="City: All"
                  value={cityFilter}
                  onChange={e => { setCityFilter(e.target.value); setPage(1) }}
                  style={{ cursor: 'text' }}
                />
              </div>
            </div>

            {/* Table */}
            <div className="db-table-wrap">
              {error ? (
                <div style={{ padding: 24, color: '#C62828' }}>{error}</div>
              ) : loading ? (
                <div className="db-loading">Loading clients…</div>
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
                            {c.photo_url ? (
                              <img className="db-avatar" src={c.photo_url} alt={c.first_name} />
                            ) : (
                              <div className="db-avatar db-avatar-initials">
                                {initials(c.first_name, c.last_name)}
                              </div>
                            )}
                            <div>
                              <div className="db-client-name">
                                {c.first_name} {c.last_name}
                              </div>
                              <div className="db-client-id">
                                #{String(c.id).padStart(4, '0')}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="db-cell-muted">
                          {c.age} / {c.city}
                        </td>
                        <td className="db-cell-muted">{c.marital_status}</td>
                        <td className="db-cell-muted">{c.occupation}</td>
                        <td>
                          <span className={`db-status-chip ${STATUS_CLASS[c.journey_status] || 'paused'}`}>
                            <span className="db-status-dot" />
                            {c.journey_status?.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <button
                            className="db-view-btn"
                            onClick={ev => { ev.stopPropagation(); navigate(`/customers/${c.id}`) }}
                            id={`db-view-${c.id}`}
                          >
                            <span className="ms" style={{ fontSize: 15 }}>description</span>
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            <div className="db-pagination">
              <span className="db-page-info">
                Showing {customers.length} of {pagination.total} clients
              </span>
              <div className="db-page-btns">
                <button
                  className="db-page-btn"
                  id="db-prev-page"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <span className="ms">chevron_left</span>
                </button>
                <button
                  className="db-page-btn"
                  id="db-next-page"
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                >
                  <span className="ms">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
