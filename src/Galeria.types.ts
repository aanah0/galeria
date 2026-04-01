import type { motion } from 'framer-motion'
import type { ComponentProps } from 'react'
import type { NativeSyntheticEvent } from 'react-native'
import { ViewStyle } from 'react-native'
import type { SFSymbol } from 'sf-symbols-typescript'

export type ChangeEventPayload = {
  value: string
}

type GaleriaIndexChangedPayload = {
  currentIndex: number
}

export type GaleriaIndexChangedEvent =
  NativeSyntheticEvent<GaleriaIndexChangedPayload>

export type GaleriaViewerOpenEvent =
  NativeSyntheticEvent<{ currentIndex: number }>

export type GaleriaViewerDismissEvent =
  NativeSyntheticEvent<{}>

export type GaleriaDismissAnimation = 'default' | 'slideToBottom'

export type GaleriaRef = {
  close: (animation?: GaleriaDismissAnimation) => void
}

export type GaleriaOverlayRenderProps = {
  currentIndex: number
  total: number
  urls: string[]
}

export type GaleriaOverlayProps = {
  children: (props: GaleriaOverlayRenderProps) => React.ReactNode
}

export interface GaleriaViewProps {
  index?: number
  id?: string
  children: React.ReactElement
  closeIconName?: SFSymbol
  __web?: ComponentProps<(typeof motion)['div']>
  style?: ViewStyle
  dynamicAspectRatio?: boolean
  edgeToEdge?: boolean
  onIndexChange?: (event: GaleriaIndexChangedEvent) => void
  hideBlurOverlay?: boolean
  hidePageIndicators?: boolean
  /**
   * Background color of the image viewer. Overrides the theme color.
   * Accepts any valid color string (e.g. '#FF0000', 'rgba(0,0,0,0.9)', 'red').
   */
  imageBackgroundColor?: string
  /**
   * Disable image caching in the viewer. When true, images are always fetched fresh.
   */
  disableCache?: boolean
  /**
   * Controls the options button (ellipsis) on the right side of the viewer header.
   * - `'share'`: Shows ellipsis button that opens the native share sheet with the active image.
   * - `(index: number) => void`: Shows ellipsis button that calls your function with the current image index.
   * - `null` or `undefined`: Hides the options button.
   */
  onOptionsPress?: 'share' | ((index: number) => void) | null
}
