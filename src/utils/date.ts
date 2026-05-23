import {
  addDays,
  differenceInMinutes,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isValid,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { it } from 'date-fns/locale'

export const todayISODate = () => format(new Date(), 'yyyy-MM-dd')

const safeParseISO = (value: string) => {
  const parsed = parseISO(value)
  return isValid(parsed) ? parsed : null
}

export const formatDate = (isoDate: string) => {
  const parsed = safeParseISO(isoDate)
  return parsed ? format(parsed, 'd MMMM yyyy', { locale: it }) : 'Data non valida'
}

export const formatShortDate = (isoDate: string) => {
  const parsed = safeParseISO(isoDate)
  return parsed ? format(parsed, 'dd/MM/yyyy', { locale: it }) : 'Data non valida'
}

export const formatDateTime = (isoDateTime: string) => {
  const parsed = safeParseISO(isoDateTime)
  return parsed ? format(parsed, 'dd/MM/yyyy HH:mm', { locale: it }) : 'Data non valida'
}

export const formatTime = (isoDateTime: string) => {
  const parsed = safeParseISO(isoDateTime)
  return parsed ? format(parsed, 'HH:mm', { locale: it }) : '--:--'
}

export const elapsedLabel = (startISO: string, endISO: string) => {
  const start = safeParseISO(startISO)
  const end = safeParseISO(endISO)
  if (!start || !end) return 'Non disponibile'
  const minutes = Math.max(0, differenceInMinutes(end, start))
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

export const isISODateInSameDay = (isoDate: string, date: Date) => {
  const parsed = safeParseISO(isoDate)
  return parsed ? isSameDay(parsed, date) : false
}

export const isISODateInSameMonth = (isoDate: string, date: Date) => {
  const parsed = safeParseISO(isoDate)
  return parsed ? isSameMonth(parsed, date) : false
}

export const combineDateAndTime = (date: string, time: string) => `${date}T${time}:00`
