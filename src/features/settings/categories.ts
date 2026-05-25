import type { CalendarCategory, CalendarColors } from '@/types/domain'
import { sanitizeText } from '@/utils/sanitize'

const colorPattern = /^#[0-9a-fA-F]{6}$/
const categoryIdPattern = /^[a-z0-9][a-z0-9-]{0,79}$/

const baseCategoryDefinitions = [
  { id: 'personal', label: 'Personale', colorKey: 'personal' },
  { id: 'work', label: 'Lavoro', colorKey: 'work' },
  { id: 'important', label: 'Importante', colorKey: 'important' },
] as const

export const otherCategory: CalendarCategory = {
  id: 'other',
  label: 'Altro',
  color: '#64748b',
  system: true,
}

export const birthdaysCategory: CalendarCategory = {
  id: 'birthdays',
  label: 'Compleanni',
  color: '#f97316',
  system: true,
}

export const getDefaultCategories = (colors: CalendarColors): CalendarCategory[] => [
  ...baseCategoryDefinitions.map((category) => ({
    id: category.id,
    label: category.label,
    color: colors[category.colorKey],
    system: true,
  })),
  birthdaysCategory,
  otherCategory,
]

export const cleanCategoryLabel = (label: string) => sanitizeText(label, 40)

export const cleanCategoryColor = (color: string) => (colorPattern.test(color) ? color : '#64748b')

const toCategoryId = (label: string) =>
  cleanCategoryLabel(label)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)

export const createCategoryId = (label: string, existingIds: string[]) => {
  const baseId = toCategoryId(label) || 'categoria'
  let candidate = baseId
  let index = 2

  while (existingIds.includes(candidate)) {
    candidate = `${baseId}-${index}`
    index += 1
  }

  return candidate
}

export const normalizeCategories = (
  rawCategories: unknown,
  colors: CalendarColors,
): CalendarCategory[] => {
  const defaults = getDefaultCategories(colors)
  const defaultIds = new Set(defaults.map((category) => category.id))
  const byId = new Map(defaults.map((category) => [category.id, category]))

  if (Array.isArray(rawCategories)) {
    rawCategories.forEach((rawCategory) => {
      if (!rawCategory || typeof rawCategory !== 'object') return

      const candidate = rawCategory as Partial<CalendarCategory>
      const id = sanitizeText(candidate.id, 80)
      const label = cleanCategoryLabel(candidate.label ?? '')

      if (!categoryIdPattern.test(id) || !label) return

      const defaultCategory = byId.get(id)

      byId.set(id, {
        id,
        label,
        color: defaultCategory?.color ?? cleanCategoryColor(candidate.color ?? ''),
        system: defaultIds.has(id) ? true : Boolean(candidate.system),
      })
    })
  }

  return Array.from(byId.values()).slice(0, 24)
}

export const getCategoryLabel = (categoryId: string, categories: CalendarCategory[]) =>
  categories.find((category) => category.id === categoryId)?.label ?? 'Categoria rimossa'

export const getCategoryColor = (
  categoryId: string,
  categories: CalendarCategory[],
  colors: CalendarColors,
) =>
  categories.find((category) => category.id === categoryId)?.color ??
  getDefaultCategories(colors).find((category) => category.id === categoryId)?.color ??
  colors.personal
