import {
  addDays,
  differenceInMinutes,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { it } from 'date-fns/locale'

export const todayISODate = () => format(new Date(), 'yyyy-MM-dd')

export const formatDate = (isoDate: string) =>
  format(parseISO(isoDate), 'd MMMM yyyy', { locale: it })

export const formatShortDate = (isoDate: string) =>
  format(parseISO(isoDate), 'dd/MM/yyyy', { locale: it })

export const formatDateTime = (isoDateTime: string) =>
  format(parseISO(isoDateTime), 'dd/MM/yyyy HH:mm', { locale: it })

export const formatTime = (isoDateTime: string) =>
  format(parseISO(isoDateTime), 'HH:mm', { locale: it })

export const elapsedLabel = (startISO: string, endISO: string) => {
  const minutes = Math.max(0, differenceInMinutes(parseISO(endISO), parseISO(startISO)))
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours < 24) return rest > 0 ? `${hours}h ${rest}min` : `${hours}h`
  const days = Math.floor(hours / 24)
  const hourRest = hours % 24
  return hourRest > 0 ? `${days}g ${hourRest}h` : `${days}g`
}

export const getWeekDays = (date: Date) => {
  const start = startOfWeek(date, { weekStartsOn: 1 })
  return Array.from({ length: 7 }, (_, index) => addDays(start, index))
}

export const getMonthGridDays = (date: Date) => {
  const monthStart = startOfMonth(date)
  const monthEnd = endOfMonth(date)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days: Date[] = []
  let cursor = gridStart
  while (cursor <= gridEnd) {
    days.push(cursor)
    cursor = addDays(cursor, 1)
  }
  return days
}

export const toISODate = (date: Date) => format(date, 'yyyy-MM-dd')

export const isISODateInSameDay = (isoDate: string, date: Date) =>
  isSameDay(parseISO(isoDate), date)

export const isISODateInSameMonth = (isoDate: string, date: Date) =>
  isSameMonth(parseISO(isoDate), date)

export const combineDateAndTime = (date: string, time: string) => `${date}T${time}:00`
