import { useState } from 'react'
import './DashboardPage.css'

/* ── Status chip config ────────────────────────────────────────
   Each status maps to a CSS class for distinct colour coding.
   Add new statuses here — the CSS handles the rest.
   ─────────────────────────────────────────────────────────── */
const STATUS_CLASS = {
  'SEARCHING':      'searching',
  'INTERESTED':     'interested',
  'CALL SCHEDULED': 'call-scheduled',
  'UNDER REVIEW':   'under-review',
  'ACTIVE MATCH':   'active-match',
  'PAUSED':         'paused',
  'CLOSED':         'closed',
}

function StatusChip({ status }) {
  const cls = STATUS_CLASS[status] ?? 'paused'
  return <span className={`db-chip ${cls}`}>{status}</span>
}

/* ── Mock data (replace with API calls once backend ready) ───── */
const MOCK_CLIENTS = [
  { id: '#D8291', name: 'Sophia Chen',   initials: 'SC', age: 29, city: 'San Francisco', marital: 'Single',       occupation: 'Senior Product Designer',   status: 'SEARCHING',      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB0VZiuHnFbkZKackbbrV2H0xFIQVqrx5DNijFKDFq474JxzYxLoG0hm5OZGBdTK3QqJUDWnnAFz0uKgGd-tcKgY17he0NLJfGBCVgh86H_0a7SAw4gbxziyo124CXqTR-wXVDny40BxLEpOQ3-cy0XSIXQRV_Un7q7CSvTtm3x2jo2DPFoEXttYZLwtyHhEbckOObSFEb6ak6IyxxjU5J4uVhaZ6KtHSB8Ma-STNU1lUi1ltkBR8dhffqtVMz4TbR_SgZgja9N--w' },
  { id: '#D8295', name: 'Marcus Thorne', initials: 'MT', age: 42, city: 'London',        marital: 'Divorced',      occupation: 'Hedge Fund Manager',         status: 'CALL SCHEDULED', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDcgXb9e90OiMopI3tXYl4_kn47bKY9XPZusYvIEZdmohfkyKPXk4INJmXMNPp8I8TF_XaEjIoLaT_ALK-JTlFzGvFmsXesuG5QMxplHRY6JL1291AsPU-cud4QrnctEq3c4fbxQWw4Tb9gkica_5M5JVlnpqC6L2-309JyOZG2jL0B3mbGRo_bMGda4g4cRierOHmPiyDIr8XgGakV93p6NtIBca6aQ1STnlEpygyDl4IKvl4hZsTwn2kb6pj_p4BFigy1_fj0xpo' },
  { id: '#D8301', name: 'Aisha Malik',   initials: 'AM', age: 31, city: 'Dubai',         marital: 'Single',        occupation: 'Architecture Director',      status: 'INTERESTED',     img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDJ6xsDiPeelaKt12DOuiAjjnSlmleROTUHz_TYuBMExzhdPJGG0UEKgZgocmu2R1HgdAF9-kdHQc3IgWkInjPJLTZlzQhUIlRl77-R8AXmvwdiaGByFOHclFbCd1enDmoxE8kavJJ2Kc9prYgRi8Q8G5qiY529vGPn92_zLWv2ts0C_-B3eERkx_ptYMyhsEYor2L9JU_7rQSmxrZJJkTutDidM_EbJ3oZxYDGHHMVEY-S2G384Sc1RgaS01TmEyimvBiYwNeQJ3o' },
  { id: '#D8305', name: 'Rohan Nair',    initials: 'RN', age: 35, city: 'Mumbai',        marital: 'Never Married', occupation: 'Tech Entrepreneur',          status: 'SEARCHING',      img: null },
  { id: '#D8312', name: 'Elena Kovac',   initials: 'EK', age: 27, city: 'Berlin',        marital: 'Single',        occupation: 'Legal Consultant',           status: 'UNDER REVIEW',   img: null },
  { id: '#D8318', name: 'James Miller',  initials: 'JM', age: 45, city: 'New York',      marital: 'Widowed',       occupation: 'Surgeon',                    status: 'CALL SCHEDULED', img: null },
  { id: '#D8322', name: 'Sarah Lee',     initials: 'SL', age: 33, city: 'Singapore',     marital: 'Single',        occupation: 'Marketing Director',         status: 'SEARCHING',      img: null },
  { id: '#D8329', name: 'David Ross',    initials: 'DR', age: 39, city: 'Toronto',       marital: 'Divorced',      occupation: 'Executive Chef',             status: 'INTERESTED',     img: null },
  { id: '#D8334', name: 'Anita Nair',    initials: 'AN', age: 26, city: 'Delhi',         marital: 'Single',        occupation: 'Civil Engineer',             status: 'SEARCHING',      img: null },
  { id: '#D8341', name: 'Thomas Hunt',   initials: 'TH', age: 52, city: 'Sydney',        marital: 'Divorced',      occupation: 'Real Estate Developer',      status: 'ACTIVE MATCH',   img: null },
]

const NAV_ITEMS = [
  { icon: 'dashboard', label: 'Dashboard',     active: true  },
  { icon: 'group',     label: 'Customers',     active: false },
  { icon: 'search',    label: 'Global Search', active: false },
  { icon: 'event',     label: 'Calendar',      active: false },
]

/* ── Component ─────────────────────────────────────────────── */
export default function DashboardPage() {
  const [search, setSearch] = useState('')
  const [filterStage, setFilterStage] = useState('all')
  const [filterCity,  setFilterCity]  = useState('all')

  /* Filter clients client-side (will be replaced by API query later) */
  const visible = MOCK_CLIENTS.filter(c => {
    const q = search.toLowerCase()
    const matchQ = !q || c.name.toLowerCase().includes(q) || c.city.toLowerCase().includes(q)
    const matchStage = filterStage === 'all' || c.status === filterStage
    const matchCity  = filterCity  === 'all' || c.city  === filterCity
    return matchQ && matchStage && matchCity
  })

  return (
    <div className="db db-shell">

      {/* ── Sidebar ── */}
      <aside className="db-sidebar">
        <div className="db-brand">
          <div className="db-brand-name">The Date Crew</div>
          <div className="db-brand-sub">Matchmaker Portal</div>
        </div>

        <button id="db-new-case-btn" className="db-new-btn">
          <span className="ms">add</span>
          New Matchmaking Case
        </button>

        <nav className="db-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.label}
              className={`db-nav-link ${item.active ? 'active' : ''}`}
              id={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
            >
              <span className="ms">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="db-sidebar-footer">
          <button className="db-nav-link" id="nav-support">
            <span className="ms">help</span>
            Support
          </button>
          <button className="db-nav-link" id="nav-signout">
            <span className="ms">logout</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="db-main">

        {/* Topbar */}
        <header className="db-topbar">
          <div className="db-user">
            <div className="db-avatar">JP</div>
            <div>
              <div className="db-user-name">Julianne Pierre</div>
              <div className="db-user-role">Senior Matchmaker</div>
            </div>
          </div>

          <div className="db-search-wrap">
            <span className="ms db-search-icon">search</span>
            <input
              id="db-search"
              className="db-search-input"
              type="text"
              placeholder="Quick search dossier..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="db-topbar-icons">
            <button className="db-icon-btn" id="db-notif-btn" title="Notifications">
              <span className="ms">notifications</span>
            </button>
            <button className="db-icon-btn" id="db-settings-btn" title="Settings">
              <span className="ms">settings</span>
            </button>
          </div>
        </header>

        {/* Scrollable canvas */}
        <div className="db-canvas">

          {/* Stat cards */}
          <section className="db-stats" aria-label="Summary statistics">
            <div className="db-stat-card">
              <div className="db-stat-label">Active Customers</div>
              <div className="db-stat-value">124</div>
            </div>
            <div className="db-stat-card">
              <div className="db-stat-label">Currently Searching</div>
              <div className="db-stat-value">42</div>
            </div>
            <div className="db-stat-card">
              <div className="db-stat-label">Matches This Week</div>
              <div className="db-stat-value">
                18
                <span className="db-stat-trend">
                  <span className="ms">trending_up</span>
                  12%
                </span>
              </div>
            </div>
            <div className="db-stat-card">
              <div className="db-stat-label">Successful Matches</div>
              <div className="db-stat-value">306</div>
            </div>
          </section>

          {/* Priority client table */}
          <section className="db-section" aria-label="Priority Client Dossier">

            {/* Section header + filters */}
            <div className="db-section-header">
              <div className="db-section-title-wrap">
                <span className="ms">star</span>
                <h2 className="db-section-title">Priority Client Dossier</h2>
              </div>

              <div className="db-filters">
                <span className="db-filter-label">
                  <span className="ms">filter_alt</span>
                  Filters:
                </span>

                <select
                  id="filter-stage"
                  className="db-select"
                  value={filterStage}
                  onChange={e => setFilterStage(e.target.value)}
                >
                  <option value="all">Stage: All</option>
                  <option value="SEARCHING">Searching</option>
                  <option value="INTERESTED">Interested</option>
                  <option value="CALL SCHEDULED">Call Scheduled</option>
                  <option value="UNDER REVIEW">Under Review</option>
                  <option value="ACTIVE MATCH">Active Match</option>
                </select>

                <select id="filter-religion" className="db-select">
                  <option>Religion: Any</option>
                  <option>Hindu</option>
                  <option>Christian</option>
                  <option>Muslim</option>
                </select>

                <select
                  id="filter-city"
                  className="db-select"
                  value={filterCity}
                  onChange={e => setFilterCity(e.target.value)}
                >
                  <option value="all">City: All</option>
                  <option>San Francisco</option>
                  <option>London</option>
                  <option>Dubai</option>
                  <option>Mumbai</option>
                  <option>Berlin</option>
                  <option>New York</option>
                  <option>Singapore</option>
                  <option>Toronto</option>
                  <option>Delhi</option>
                  <option>Sydney</option>
                </select>

                <button className="db-more-filters-btn" id="db-more-filters">
                  <span className="ms">filter_list</span>
                  More Filters
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="db-table-wrap">
              <table className="db-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Age / Location</th>
                    <th>Marital Status</th>
                    <th>Occupation</th>
                    <th className="center">Status</th>
                    <th className="center">Dossier</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map(client => (
                    <tr key={client.id}>
                      {/* Client */}
                      <td>
                        <div className="db-client-cell">
                          {client.img
                            ? <img className="db-client-avatar" src={client.img} alt={client.name} />
                            : <div className="db-client-avatar-initials">{client.initials}</div>
                          }
                          <div>
                            <div className="db-client-name">{client.name}</div>
                            <div className="db-client-id">{client.id}</div>
                          </div>
                        </div>
                      </td>

                      {/* Age / Location */}
                      <td className="db-age-loc">
                        {client.age}<span className="sep">/</span>{client.city}
                      </td>

                      {/* Marital */}
                      <td>{client.marital}</td>

                      {/* Occupation */}
                      <td>{client.occupation}</td>

                      {/* Status chip */}
                      <td className="center">
                        <StatusChip status={client.status} />
                      </td>

                      {/* Dossier */}
                      <td className="center">
                        <button className="db-dossier-btn" id={`dossier-${client.id}`}>
                          <span className="ms">description</span>
                          View Notes
                        </button>
                      </td>

                      {/* More */}
                      <td className="right">
                        <button className="db-more-btn" id={`more-${client.id}`}>
                          <span className="ms">more_horiz</span>
                        </button>
                      </td>
                    </tr>
                  ))}

                  {visible.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--db-text-muted)' }}>
                        No clients match your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div className="db-table-footer">
              <span className="db-showing">
                Showing {visible.length} of 124 clients
              </span>
              <div className="db-pagination">
                <button className="db-page-btn" id="db-prev-page">
                  <span className="ms">chevron_left</span>
                </button>
                <button className="db-page-btn" id="db-next-page">
                  <span className="ms">chevron_right</span>
                </button>
              </div>
            </div>

          </section>
        </div>
      </main>
    </div>
  )
}
