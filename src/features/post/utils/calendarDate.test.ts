import {
  buildCalendarMonth,
  formatDateDisplay,
  formatDateValue,
  parseDateValue,
  shiftCalendarMonth,
} from '@/features/post/utils/calendarDate'

describe('calendar date utils', () => {
  it('parses and formats strict yyyy-mm-dd values', () => {
    const parsed = parseDateValue('2026-03-29')

    expect(parsed).not.toBeNull()
    expect(formatDateValue(parsed!)).toBe('2026-03-29')
    expect(formatDateDisplay('2026-03-29')).toBe('2026/03/29')
  })

  it('rejects invalid calendar dates instead of auto-correcting them', () => {
    expect(parseDateValue('2026-02-29')).toBeNull()
    expect(parseDateValue('2026-13-01')).toBeNull()
    expect(parseDateValue('2026/03/29')).toBeNull()
  })

  it('builds a monday-first 6-row month grid for the custom picker', () => {
    const cells = buildCalendarMonth(new Date(2026, 2, 15))

    expect(cells).toHaveLength(42)
    expect(cells[0]).toMatchObject({ value: '2026-02-23', day: 23, isCurrentMonth: false })
    expect(cells[6]).toMatchObject({ value: '2026-03-01', day: 1, isCurrentMonth: true })
    expect(cells[41]).toMatchObject({ value: '2026-04-05', day: 5, isCurrentMonth: false })
  })

  it('moves across months without mutating the original date', () => {
    const source = new Date(2026, 2, 29)
    const previous = shiftCalendarMonth(source, -1)
    const next = shiftCalendarMonth(source, 1)

    expect(formatDateValue(source)).toBe('2026-03-29')
    expect(formatDateValue(previous)).toBe('2026-02-01')
    expect(formatDateValue(next)).toBe('2026-04-01')
  })
})
