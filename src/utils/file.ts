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
