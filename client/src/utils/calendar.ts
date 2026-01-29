export interface CalendarDay {
  date: Date
  dateString: string
  isCurrentMonth: boolean
  isToday: boolean
  dayOfWeek: number
  events: any[]
}

export interface CalendarWeek {
  days: CalendarDay[]
}

export interface CalendarMonth {
  year: number
  month: number
  monthName: string
  weeks: CalendarWeek[]
}

export function getMonthName(month: number): string {
  const names = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  return names[month]
}

export function getDayName(day: number): string {
  const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return names[day]
}

export function generateCalendarMonth(
  year: number,
  month: number,
  events: any[]
): CalendarMonth {
  const firstDay = new Date(year, month, 1)
  const startDate = new Date(firstDay)
  startDate.setDate(startDate.getDate() - firstDay.getDay()) // Go to Sunday of first week

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const weeks: CalendarWeek[] = []
  let currentDate = new Date(startDate)

  // Generate 6 weeks (covers all possible month layouts)
  for (let week = 0; week < 6; week++) {
    const days: CalendarDay[] = []
    
    for (let day = 0; day < 7; day++) {
      const dateString = currentDate.toISOString().slice(0, 10)
      const isCurrentMonth = currentDate.getMonth() === month
      const isToday = currentDate.getTime() === today.getTime()

      // Find events that overlap with this day
      const dayEvents = events.filter((event) => {
        const eventStart = event.startDate.slice(0, 10)
        const eventEnd = event.endDate.slice(0, 10)
        return dateString >= eventStart && dateString <= eventEnd
      })

      days.push({
        date: new Date(currentDate),
        dateString,
        isCurrentMonth,
        isToday,
        dayOfWeek: currentDate.getDay(),
        events: dayEvents,
      })

      currentDate.setDate(currentDate.getDate() + 1)
    }

    weeks.push({ days })
  }

  return {
    year,
    month,
    monthName: getMonthName(month),
    weeks,
  }
}

export function getNextMonth(year: number, month: number): { year: number; month: number } {
  if (month === 11) {
    return { year: year + 1, month: 0 }
  }
  return { year, month: month + 1 }
}

export function getPrevMonth(year: number, month: number): { year: number; month: number } {
  if (month === 0) {
    return { year: year - 1, month: 11 }
  }
  return { year, month: month - 1 }
}
