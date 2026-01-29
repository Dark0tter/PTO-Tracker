import './App.css'
import { useEffect, useMemo, useState } from 'react'
import Dashboard from './components/Dashboard'
import CalendarGrid from './components/CalendarGrid'
import {
  calculateEmployeeStats,
  calculateDivisionStats,
  calculateTypeBreakdown,
  findBusiestDays,
  findCoverageGaps,
} from './utils/statistics'
import type { Employee, Division, TimeOffEvent, TimeOffType } from './types'

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:4000'
const DEFAULT_TENANT = import.meta.env.VITE_TENANT_ID ?? 'acme'

function App() {
  const [tenantId, setTenantId] = useState(DEFAULT_TENANT)
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
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'dashboard'>('list')
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear())
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth())

  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({
          tenant: tenantId,
          from: new Date().getFullYear() + '-01-01',
          to: new Date().getFullYear() + '-12-31',
        })

        const [divRes, empRes, evRes] = await Promise.all([
          fetch(`${API_BASE}/divisions?${params.toString()}`, {
            signal: controller.signal,
          }),
          fetch(`${API_BASE}/employees?${params.toString()}`, {
            signal: controller.signal,
          }),
          fetch(`${API_BASE}/timeoff?${params.toString()}`, {
            signal: controller.signal,
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
          <h1>Vacation Tracker</h1>
          <p>Multi-tenant PTO calendar powered by Viewpoint (or other systems).</p>
        </div>
        <div className="header-controls">
          <div className="view-toggle">list' ? 'active' : ''}
              onClick={() => setViewMode('list')}
            >
              📋 List
            </button>
            <button
              className={viewMode === 'grid' ? 'active' : ''}
              onClick={() => setViewMode('grid')}
            >
              📅 Calendar
            </button>
            <button
              className={viewMode === 'dashboard' ? 'active' : ''}
              onClick={() => setViewMode('dashboard')}
            >
              📊 Stats=> setViewMode('dashboard')}
            >
              📊 Dashboard
            </button>
          </div>
          <div className="tenant-input">
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
          viewMode === 'grid' ? (
        <div className="calendar-view">
          {loading && <div className="status">Loading…</div>}
          {error && <div className="status error">{error}</div>}
          {!loading && !error && (
            <CalendarGrid
              year={calendarYear}
              month={calendarMonth}
              events={events}
              employees={employees}
              onMonthChange={(year, month) => {
                setCalendarYear(year)
                setCalendarMonth(month)
              }}
            />
          )}
        </div>
      ) :     coverageGaps={coverageGaps}
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
           div className="calendar-header">
            <h2>
              Time off – {new Date().getFullYear()}
            </h2>
            {activeFilterCount > 0 && (
              <div className="active-filters">
                {searchQuery && <span className="filter-tag">Search: "{searchQuery}"</span>}
                {selectedDivision !== 'all' && (
                  <span className="filter-tag">Division: {divisionName(selectedDivision)}</span>
                )}
                {selectedType !== 'all' && (
                  <span className="filter-tag">Type: {selectedType}</span>
                )}
                {(dateFrom || dateTo) && (
                  <span className="filter-tag">
                    Date: {dateFrom || '...'} to {dateTo || '...'}
                  </span>
                )}
              </div>
            )}
          </div    <option key={d.id} value={d.id}>
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

          <h3>Employees</h3>
          <div className="employee-list">
            {employees.map((e) => (
              <div key={e.id} className="employee-row">
                <div className="employee-name">{e.fullName}</div>
                <div className="employee-division">
                  {divisionName(e.divisionId)}
                </div>
              </div>
            ))}
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
