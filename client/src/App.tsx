import './App.css'
import { useEffect, useMemo, useState } from 'react'
import Dashboard from './components/Dashboard'
import Login from './components/Login'
import {
  calculateEmployeeStats,
  calculateDivisionStats,
  calculateTypeBreakdown,
  findBusiestDays,
  findCoverageGaps,
} from './utils/statistics'
import type { Employee, Division, TimeOffEvent, TimeOffType } from './types'

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:4000'

interface User {
  id: string;
  username: string;
  tenantId: string;
  role: string;
}

function App() {
  const [authToken, setAuthToken] = useState<string | null>(() => {
    return localStorage.getItem('authToken');
  });
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('currentUser');
    return stored ? JSON.parse(stored) : null;
  });
  const [tenantId, setTenantId] = useState('')
  const [maxOverlap, setMaxOverlap] = useState(3)
  const [divisions, setDivisions] = useState<Division[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [events, setEvents] = useState<TimeOffEvent[]>([])
  const [selectedDivision, setSelectedDivision] = useState<string | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<TimeOffType | 'all'>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'calendar' | 'dashboard'>('calendar')

  const handleLogin = (token: string, user: User) => {
    setAuthToken(token);
    setCurrentUser(user);
    setTenantId(user.tenantId);
    localStorage.setItem('authToken', token);
    localStorage.setItem('currentUser', JSON.stringify(user));
  };

  const handleLogout = () => {
    setAuthToken(null);
    setCurrentUser(null);
    setTenantId('');
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
  };

  // If not authenticated, show login
  if (!authToken || !currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({
          from: new Date().getFullYear() + '-01-01',
          to: new Date().getFullYear() + '-12-31',
        })

        const headers = {
          'Authorization': `Bearer ${authToken}`,
        };

        const [divRes, empRes, evRes] = await Promise.all([
          fetch(`${API_BASE}/divisions?${params.toString()}`, {
            signal: controller.signal,
            headers,
          }),
          fetch(`${API_BASE}/employees?${params.toString()}`, {
            signal: controller.signal,
            headers,
          }),
          fetch(`${API_BASE}/events?${params.toString()}`, {
            signal: controller.signal,
            headers,
          }),
        ])

        if (!divRes.ok || !empRes.ok || !evRes.ok) {
          throw new Error('Failed to load one or more resources')
        }

        const [divJson, empJson, evJson] = await Promise.all([
          divRes.json(),
          empRes.json(),
          evRes.json(),
        ])

        setDivisions(divJson)
        setEmployees(empJson)
        setEvents(evJson)
      } catch (e: any) {
        if (e.name === 'AbortError') return
        setError(e?.message ?? 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    load()

    return () => controller.abort()
  }, [tenantId])

  const eventsByDay = useMemo(() => {
    const map = new Map<string, TimeOffEvent[]>()
    for (const ev of events) {
      const dateKey = ev.startDate.slice(0, 10)
      if (!map.has(dateKey)) map.set(dateKey, [])
      map.get(dateKey)!.push(ev)
    }
    return map
  }, [events])

  const filteredEventsByDay = useMemo(() => {
    const map = new Map<string, TimeOffEvent[]>()
    const query = searchQuery.toLowerCase()
    
    for (const [day, evs] of eventsByDay.entries()) {
      // Filter by date range
      if (dateFrom && day < dateFrom) continue
      if (dateTo && day > dateTo) continue
      
      const filtered = evs.filter((e) => {
        // Filter by division
        if (selectedDivision !== 'all' && e.divisionId !== selectedDivision) {
          return false
        }
        
        // Filter by type
        if (selectedType !== 'all' && e.type !== selectedType) {
          return false
        }
        
        // Filter by employee name
        if (query) {
          const empName = employeeName(e.employeeId).toLowerCase()
          if (!empName.includes(query)) {
            return false
          }
        }
        
        return true
      })
      
      if (filtered.length) map.set(day, filtered)
    }
    return map
  }, [eventsByDay, selectedDivision, selectedType, searchQuery, dateFrom, dateTo])

  const divisionName = (id?: string) =>
    divisions.find((d) => d.id === id)?.name ?? 'Unassigned'

  const employeeName = (id: string) =>
    employees.find((e) => e.id === id)?.fullName ?? id

  const filteredEmployees = useMemo(() => {
    if (!searchQuery) return employees
    const query = searchQuery.toLowerCase()
    return employees.filter((e) => e.fullName.toLowerCase().includes(query))
  }, [employees, searchQuery])

  const clearFilters = () => {
    setSelectedDivision('all')
    setSearchQuery('')
    setSelectedType('all')
    setDateFrom('')
    setDateTo('')
  }

  const activeFilterCount = 
    (selectedDivision !== 'all' ? 1 : 0) +
    (searchQuery ? 1 : 0) +
    (selectedType !== 'all' ? 1 : 0) +
    (dateFrom || dateTo ? 1 : 0)

  // Calculate statistics
  const employeeStats = useMemo(
    () => calculateEmployeeStats(employees, events),
    [employees, events]
  )

  const divisionStats = useMemo(
    () => calculateDivisionStats(divisions, employees, employeeStats),
    [divisions, employees, employeeStats]
  )

  const typeBreakdown = useMemo(
    () => calculateTypeBreakdown(events),
    [events]
  )

  const busiestDays = useMemo(
    () => findBusiestDays(events, 10),
    [events]
  )

  const coverageGaps = useMemo(
    () => findCoverageGaps(events, employees, 0.3),
    [events, employees]
  )

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>PTO Tracker</h1>
          <p>Multi-tenant PTO calendar - Logged in as <strong>{currentUser.username}</strong> ({currentUser.tenantId})</p>
        </div>
        <div className="header-controls">
          <div className="view-toggle">
            <button
              className={viewMode === 'calendar' ? 'active' : ''}
              onClick={() => setViewMode('calendar')}
            >
              📅 Calendar
            </button>
            <button
              className={viewMode === 'dashboard' ? 'active' : ''}
              onClick={() => setViewMode('dashboard')}
            >
              📊 Dashboard
            </button>
          </div>
          <div className="tenant-input">
            <label>
              Max Overlap
              <input
                type="number"
                min="1"
                max="20"
                value={maxOverlap}
                onChange={(e) => setMaxOverlap(Number(e.target.value))}
                style={{ width: '60px' }}
                title="Maximum people allowed off on the same day before highlighting"
              />
            </label>
          </div>
          <div className="tenant-input">
            <button onClick={handleLogout} className="logout-button" title="Sign out">
              Logout
            </button>
          </div>
          <div className="tenant-input" style={{ display: 'none' }}>
            <label>
              Tenant ID
              <input
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                placeholder="acme"
              />
            </label>
          </div>
        </div>
      </header>

      {viewMode === 'dashboard' ? (
        <div className="dashboard-view">
          {loading && <div className="status">Loading…</div>}
          {error && <div className="status error">{error}</div>}
          {!loading && !error && (
            <Dashboard
              employeeStats={employeeStats}
              divisionStats={divisionStats}
              busiestDays={busiestDays}
              coverageGaps={coverageGaps}
              typeBreakdown={typeBreakdown}
              totalEvents={events.length}
              dateFrom={dateFrom}
              dateTo={dateTo}
            />
          )}
        </div>
      ) : (
        <main className="app-main">
          <aside className="sidebar">
            <div className="sidebar-header">
            <h2>
              Filters
              {activeFilterCount > 0 && (
                <span className="filter-badge">{activeFilterCount}</span>
              )}
            </h2>
            {activeFilterCount > 0 && (
              <button className="clear-filters-btn" onClick={clearFilters}>
                Clear
              </button>
            )}
          </div>

          <div className="filter-section">
            <label>
              Search Employee
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name..."
                className="search-input"
              />
            </label>
          </div>

          <div className="filter-section">
            <label>
              Division
              <select
                value={selectedDivision}
                onChange={(e) =>
                  setSelectedDivision(
                    e.target.value === 'all' ? 'all' : e.target.value,
                  )
                }
              >
                <option value="all">All divisions</option>
                {divisions.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="filter-section">
            <label>
              Time Off Type
              <select
                value={selectedType}
                onChange={(e) =>
                  setSelectedType(
                    e.target.value as TimeOffType | 'all'
                  )
                }
              >
                <option value="all">All types</option>
                <option value="VACATION">Vacation</option>
                <option value="SICK">Sick Leave</option>
                <option value="UNPAID">Unpaid</option>
                <option value="OTHER">Other</option>
              </select>
            </label>
          </div>

          <div className="filter-section">
            <label>
              Date Range
              <div className="date-range">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  placeholder="From"
                />
                <span className="date-separator">to</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  placeholder="To"
                />
              </div>
            </label>
          </div>

          <h3>
            Employees
            {filteredEmployees.length !== employees.length && (
              <span className="count-badge">
                {filteredEmployees.length} / {employees.length}
              </span>
            )}
          </h3>
          <div className="employee-list">
            {filteredEmployees.length > 0 ? (
              filteredEmployees.map((e) => (
                <div key={e.id} className="employee-row">
                  <div className="employee-name">{e.fullName}</div>
                  <div className="employee-division">
                    {divisionName(e.divisionId)}
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-small">No employees match search</div>
            )}
          </div>
        </aside>

        <section className="calendar-section">
          {loading && <div className="status">Loading…</div>}
          {error && <div className="status error">{error}</div>}

          <h2>
            Time off – {new Date().getFullYear()}
            {selectedDivision !== 'all' && ` (${divisionName(selectedDivision)})`}
          </h2>

          <div className="calendar-list">
            {[...filteredEventsByDay.entries()]
              .sort(([a], [b]) => (a < b ? -1 : 1))
              .map(([day, evs]) => (
                <div key={day} className="day-row">
                  <div className="day-label">
                    {day}{' '}
                    <span className="day-count">
                      {evs.length} on leave
                    </span>
                  </div>
                  <div className="day-events">
                    {evs.map((ev) => (
                      <div
                        key={ev.id}
                        className={`event-pill event-${ev.type.toLowerCase()}`}
                      >
                        <span className="event-name">
                          {employeeName(ev.employeeId)}
                        </span>
                        <span className="event-meta">
                          {divisionName(ev.divisionId)} · {ev.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

            {!loading && filteredEventsByDay.size === 0 && (
              <div className="empty">
                No time off found for this tenant and filters.
              </div>
            )}
          </div>
        </section>
        </main>
      )}
    </div>
  )
}

export default App
