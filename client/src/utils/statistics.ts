import type { Employee, TimeOffEvent, Division } from '../types'

export interface EmployeeStats {
  employeeId: string
  employeeName: string
  divisionId?: string
  totalDays: number
  vacationDays: number
  sickDays: number
  unpaidDays: number
  otherDays: number
  eventCount: number
}

export interface DivisionStats {
  divisionId: string
  divisionName: string
  employeeCount: number
  totalDays: number
  averageDaysPerEmployee: number
}

export interface DayStats {
  date: string
  count: number
  events: TimeOffEvent[]
}

export interface TypeBreakdown {
  vacation: number
  sick: number
  unpaid: number
  other: number
}

export function calculateDaysBetween(start: string, end: string): number {
  const startDate = new Date(start)
  const endDate = new Date(end)
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 // Include both start and end
}

export function calculateEmployeeStats(
  employees: Employee[],
  events: TimeOffEvent[]
): EmployeeStats[] {
  const statsMap = new Map<string, EmployeeStats>()

  // Initialize all employees
  employees.forEach((emp) => {
    statsMap.set(emp.id, {
      employeeId: emp.id,
      employeeName: emp.fullName,
      divisionId: emp.divisionId,
      totalDays: 0,
      vacationDays: 0,
      sickDays: 0,
      unpaidDays: 0,
      otherDays: 0,
      eventCount: 0,
    })
  })

  // Aggregate events
  events.forEach((event) => {
    const stats = statsMap.get(event.employeeId)
    if (stats) {
      const days = calculateDaysBetween(event.startDate, event.endDate)
      stats.totalDays += days
      stats.eventCount += 1

      switch (event.type) {
        case 'VACATION':
          stats.vacationDays += days
          break
        case 'SICK':
          stats.sickDays += days
          break
        case 'UNPAID':
          stats.unpaidDays += days
          break
        case 'OTHER':
          stats.otherDays += days
          break
      }
    }
  })

  return Array.from(statsMap.values()).sort((a, b) => b.totalDays - a.totalDays)
}

export function calculateDivisionStats(
  divisions: Division[],
  employees: Employee[],
  employeeStats: EmployeeStats[]
): DivisionStats[] {
  const statsMap = new Map<string, DivisionStats>()

  divisions.forEach((div) => {
    const divEmployees = employees.filter((e) => e.divisionId === div.id)
    const divStats = employeeStats.filter((s) => s.divisionId === div.id)
    const totalDays = divStats.reduce((sum, s) => sum + s.totalDays, 0)

    statsMap.set(div.id, {
      divisionId: div.id,
      divisionName: div.name,
      employeeCount: divEmployees.length,
      totalDays,
      averageDaysPerEmployee:
        divEmployees.length > 0 ? totalDays / divEmployees.length : 0,
    })
  })

  return Array.from(statsMap.values()).sort(
    (a, b) => b.averageDaysPerEmployee - a.averageDaysPerEmployee
  )
}

export function calculateTypeBreakdown(events: TimeOffEvent[]): TypeBreakdown {
  const breakdown: TypeBreakdown = {
    vacation: 0,
    sick: 0,
    unpaid: 0,
    other: 0,
  }

  events.forEach((event) => {
    const days = calculateDaysBetween(event.startDate, event.endDate)
    switch (event.type) {
      case 'VACATION':
        breakdown.vacation += days
        break
      case 'SICK':
        breakdown.sick += days
        break
      case 'UNPAID':
        breakdown.unpaid += days
        break
      case 'OTHER':
        breakdown.other += days
        break
    }
  })

  return breakdown
}

export function findBusiestDays(events: TimeOffEvent[], limit = 10): DayStats[] {
  const dayMap = new Map<string, TimeOffEvent[]>()

  events.forEach((event) => {
    const start = new Date(event.startDate)
    const end = new Date(event.endDate)

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().slice(0, 10)
      if (!dayMap.has(dateKey)) {
        dayMap.set(dateKey, [])
      }
      dayMap.get(dateKey)!.push(event)
    }
  })

  const dayStats: DayStats[] = Array.from(dayMap.entries()).map(([date, events]) => ({
    date,
    count: events.length,
    events,
  }))

  return dayStats.sort((a, b) => b.count - a.count).slice(0, limit)
}

export function findCoverageGaps(
  events: TimeOffEvent[],
  employees: Employee[],
  threshold = 0.3
): DayStats[] {
  const dayMap = new Map<string, Set<string>>()

  events.forEach((event) => {
    const start = new Date(event.startDate)
    const end = new Date(event.endDate)

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().slice(0, 10)
      if (!dayMap.has(dateKey)) {
        dayMap.set(dateKey, new Set())
      }
      dayMap.get(dateKey)!.add(event.employeeId)
    }
  })

  const gaps: DayStats[] = []
  const totalEmployees = employees.length

  dayMap.forEach((employeeSet, date) => {
    const percentage = employeeSet.size / totalEmployees
    if (percentage >= threshold) {
      const dayEvents = events.filter((e) => {
        const start = e.startDate.slice(0, 10)
        const end = e.endDate.slice(0, 10)
        return date >= start && date <= end
      })
      gaps.push({
        date,
        count: employeeSet.size,
        events: dayEvents,
      })
    }
  })

  return gaps.sort((a, b) => b.count - a.count)
}

export function calculateMonthlyTrends(events: TimeOffEvent[]): Map<string, number> {
  const monthMap = new Map<string, number>()

  events.forEach((event) => {
    const days = calculateDaysBetween(event.startDate, event.endDate)
    const month = event.startDate.slice(0, 7) // YYYY-MM

    monthMap.set(month, (monthMap.get(month) || 0) + days)
  })

  return monthMap
}
