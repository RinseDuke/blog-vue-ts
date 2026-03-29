export interface CalendarDayCell {
  value: string
  day: number
  isCurrentMonth: boolean
  isToday: boolean
}

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

function createLocalDate(year: number, monthIndex: number, day: number) {
  return new Date(year, monthIndex, day, 12)
}

function isSameCalendarDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function parseDateValue(value: string) {
  const matched = DATE_PATTERN.exec(value)
  if (!matched) return null

  const year = Number(matched[1])
  const month = Number(matched[2])
  const day = Number(matched[3])

  const parsed = createLocalDate(year, month - 1, day)
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null
  }

  return parsed
}

export function formatDateValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatDateDisplay(value: string) {
  const parsed = parseDateValue(value)
  return parsed ? formatDateValue(parsed).replace(/-/g, '/') : ''
}

export function shiftCalendarMonth(source: Date, offset: number) {
  return createLocalDate(source.getFullYear(), source.getMonth() + offset, 1)
}

export function buildCalendarMonth(viewDate: Date): CalendarDayCell[] {
  const monthStart = createLocalDate(viewDate.getFullYear(), viewDate.getMonth(), 1)
  const mondayFirstOffset = (monthStart.getDay() + 6) % 7
  const gridStart = createLocalDate(
    monthStart.getFullYear(),
    monthStart.getMonth(),
    monthStart.getDate() - mondayFirstOffset
  )
  const today = createLocalDate(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())

  return Array.from({ length: 42 }, (_, index) => {
    const cellDate = createLocalDate(
      gridStart.getFullYear(),
      gridStart.getMonth(),
      gridStart.getDate() + index
    )

    return {
      value: formatDateValue(cellDate),
      day: cellDate.getDate(),
      isCurrentMonth: cellDate.getMonth() === viewDate.getMonth(),
      isToday: isSameCalendarDay(cellDate, today),
    }
  })
}
