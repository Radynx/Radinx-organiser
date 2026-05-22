const stripControlCharacters = (value: string) =>
  Array.from(value)
    .filter((character) => {
      const code = character.charCodeAt(0)
      return code > 31 && (code < 127 || code > 159)
    })
    .join('')

export const sanitizeText = (value: unknown, maxLength = 500) =>
  stripControlCharacters(String(value ?? '')).trim().slice(0, maxLength)

export const normalizeOptionalText = (value: unknown, maxLength = 1000) => {
  const clean = sanitizeText(value, maxLength)
  return clean.length > 0 ? clean : undefined
}

export const normalizeEmail = (value: unknown) =>
  sanitizeText(value, 254).toLowerCase()
