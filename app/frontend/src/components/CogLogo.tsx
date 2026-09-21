import { Image } from 'react-native'
import logo from '../assets/logo.png'

export function CogLogo({ size = 90 }: { size?: number }) {
  return <Image source={{ uri: logo }} style={{ width: size, height: size, resizeMode: 'contain' }} />
}