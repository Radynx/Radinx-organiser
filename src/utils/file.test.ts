import { describe, expect, it } from 'vitest'
import { validateProfilePhoto } from '@/utils/file'

describe('validateProfilePhoto', () => {
  it('accetta immagini supportate sotto i 3 MB', () => {
    const file = new File(['avatar'], 'avatar.webp', { type: 'image/webp' })

    expect(() => validateProfilePhoto(file)).not.toThrow()
  })

  it('rifiuta formati non immagine', () => {
    const file = new File(['pdf'], 'file.pdf', { type: 'application/pdf' })

    expect(() => validateProfilePhoto(file)).toThrow('Carica una foto')
  })
})
