import { useState } from 'react'
import { Image } from 'react-native'
import hdLogo from '../assets/pratham_car_care_HD.png'
import vectorLogo from '../assets/pratham_car_care_vector.svg'
import fallbackLogo from '../assets/logo.png'

// Try the HD raster first, then the vector, then the legacy logo.
const sources = [hdLogo, vectorLogo, fallbackLogo]

export function CogLogo({ size = 90 }: { size?: number }) {
  const [idx, setIdx] = useState(0)
  const src = sources[Math.min(idx, sources.length - 1)]

  return (
    <Image
      source={{ uri: src }}
      style={{ width: size, height: size, resizeMode: 'contain' }}
      onError={() => setIdx((i) => Math.min(i + 1, sources.length - 1))}
    />
  )
}