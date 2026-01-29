import { useMemo } from 'react'
import type { Employee, TimeOffEvent } from '../types'
import {
  generateCalendarMonth,
  getDayName,
  getNextMonth,
  getPrevMonth,
} from '../utils/calendar'

interface CalendarGridProps {
  year: number
  month: number
  events: TimeOffEvent[]
  employees: Employee[]
  onMonthChange: (year: number, month: number) => void
  onEventClick?: (event: TimeOffEvent) => void
}

export default function CalendarGrid({
  year,
  month,
  events,
  employees,
  onMonthChange,
  onEventClick,
}: CalendarGridProps) {
  const calendar = useMemo(
    () => generateCalendarMonth(year, month, events),
    [year, month, events]
  )

  const employeeName = (id: string) =>
    employees.find((e) => e.id === id)?.fullName ?? id

  const handlePrevMonth = () => {
    const prev = getPrevMonth(year, month)
    onMonthChange(prev.year, prev.month)
  }

  const handleNextMonth = () => {
    const next = getNextMonth(year, month)
    onMonthChange(next.year, next.month)
  }

  const handleToday = () => {
    const now = new Date()
    onMonthChange(now.getFullYear(), now.getMonth())
  }

  return (
    <div className="calendar-grid-container">
      <div className="calendar-grid-header">
        <div className="calendar-nav">
          <button onClick={handlePrevMonth} className="calendar-nav-btn">
            ← Prev
          </button>
          <button onClick={handleToday} className="calendar-today-btn">
            Today
          </button>
          <button onClick={handleNextMonth} className="calendar-nav-btn">
            Next →
          </button>
        </div>
        <h2 className="calendar-title">
          {calendar.monthName} {calendar.year}
        </h2>
        <div className="calendar-legend">
          <div className="legend-item">
            <span className="legend-dot legend-vacation"></span>
            Vacation
          </div>
          <div className="legend-item">
            <span className="legend-dot legend-sick"></span>
            Sick
          </div>
          <div className="legend-item">
            <span className="legend-dot legend-unpaid"></span>
            Unpaid
          </div>
        </div>
      </div>

      <div className="calendar-grid">
        <div className="calendar-weekdays">
          {[0, 1, 2, 3, 4, 5, 6].map((day) => (
            <div key={day} className="calendar-weekday">
              {getDayName(day)}
            </div>
          ))}
        </div>

        <div className="calendar-days">
          {calendar.weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="calendar-week">
              {week.days.map((day, dayIdx) => (
                <div
                  key={dayIdx}
                  className={`calendar-day ${
                    !day.isCurrentMonth ? 'calendar-day-other-month' : ''
                  } ${day.isToday ? 'calendar-day-today' : ''} ${
                    day.events.length > 0 ? 'calendar-day-has-events' : ''
                  }`}
                >
                  <div className="calendar-day-number">{day.date.getDate()}</div>
                  <div className="calendar-day-events">
                    {day.events.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        className={`calendar-event calendar-event-${event.type.toLowerCase()}`}
                        onClick={() => onEventClick?.(event)}
                        title={`${employeeName(event.employeeId)} - ${event.type}`}
                      >
                        <span className="calendar-event-name">
                          {employeeName(event.employeeId)}
                        </span>
                      </div>
                    ))}
                    {day.events.length > 3 && (
                      <div className="calendar-event-more">
                        +{day.events.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="calendar-footer">
        <div className="calendar-stats">
          Total events this month: <strong>{events.length}</strong>
        </div>
      </div>
    </div>
  )
}
