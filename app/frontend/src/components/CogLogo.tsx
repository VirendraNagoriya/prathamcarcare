import { Image } from 'react-native'
import logo1 from '../assets/logo3.png'

const LOGO_ASPECT = 1276 / 4096

export function CogLogo({ size = 90 }: { size?: number }) {
  return (
    <Image
      source={{ uri: logo1 }}
      style={{ width: size, height: Math.round(size * LOGO_ASPECT), resizeMode: 'contain' }}
    />
  )
}