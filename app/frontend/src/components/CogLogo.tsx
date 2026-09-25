import { Image } from 'react-native'
import logo1 from '../assets/logo3.png'

export function CogLogo({ size = 90 }: { size?: number }) {
  return (
    <Image
      source={{ uri: logo1 }}
      style={{ width: size, height: size, resizeMode: 'contain' }}
    />
  )
}