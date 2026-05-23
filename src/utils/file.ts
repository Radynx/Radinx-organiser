export const validateProfilePhoto = (file: File) => {
  const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp']
  const maxSize = 3 * 1024 * 1024

  if (!acceptedTypes.includes(file.type)) {
    throw new Error('Carica una foto JPG, PNG o WebP.')
  }

  if (file.size > maxSize) {
    throw new Error('La foto deve pesare meno di 3 MB.')
  }
}

const maxAvatarSide = 192
const maxStoredAvatarLength = 220_000

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.addEventListener('load', () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Impossibile leggere la foto selezionata.'))
      }
    })
    reader.addEventListener('error', () => reject(new Error('Impossibile leggere la foto selezionata.')))
    reader.readAsDataURL(file)
  })

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', () => reject(new Error('Immagine non valida o corrotta.')))
    image.src = src
  })

export const profilePhotoFileToDataUrl = async (file: File) => {
  validateProfilePhoto(file)

  const originalDataUrl = await readFileAsDataUrl(file)
  const image = await loadImage(originalDataUrl)
  const largestSide = Math.max(image.width, image.height)
  const scale = largestSide > maxAvatarSide ? maxAvatarSide / largestSide : 1
  const width = Math.max(1, Math.round(image.width * scale))
  const height = Math.max(1, Math.round(image.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Il browser non riesce a preparare la foto profilo.')
  }

  context.drawImage(image, 0, 0, width, height)
  const dataUrl = canvas.toDataURL('image/webp', 0.78)

  if (dataUrl.length > maxStoredAvatarLength) {
    throw new Error("La foto resta troppo pesante. Scegli un'immagine piu piccola.")
  }

  return dataUrl
}
