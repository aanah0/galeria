import { requireNativeView } from 'expo'

import { useCallback, useContext, useState } from 'react'
import { Image, StyleSheet } from 'react-native'
import {
  controlEdgeToEdgeValues,
  isEdgeToEdge,
} from 'react-native-is-edge-to-edge'
import { GaleriaContext } from './context'
import {
  GaleriaIndexChangedEvent,
  GaleriaOverlayProps,
  GaleriaViewerDismissEvent,
  GaleriaViewerOpenEvent,
  GaleriaViewProps,
} from './Galeria.types'

const EDGE_TO_EDGE = isEdgeToEdge()

const NativeImage = requireNativeView<
  GaleriaViewProps & {
    edgeToEdge: boolean
    urls?: string[]
    theme: 'dark' | 'light'
    onIndexChange?: (event: GaleriaIndexChangedEvent) => void
    onViewerOpen?: (event: GaleriaViewerOpenEvent) => void
    onViewerDismiss?: (event: GaleriaViewerDismissEvent) => void
    imageBackgroundColor?: string
  }
>('Galeria')

const NativeOverlayView = requireNativeView<{
  visible: boolean
  children?: React.ReactNode
}>('GaleriaOverlay')

const noop = () => {}

const Galeria = Object.assign(
  function Galeria({
    children,
    urls,
    theme = 'dark',
    ids,
    imageBackgroundColor,
  }: {
    children: React.ReactNode
  } & Partial<Pick<GaleriaContext, 'theme' | 'ids' | 'urls' | 'imageBackgroundColor'>>) {
    const [viewerVisible, setViewerVisible] = useState(false)
    const [viewerCurrentIndex, setViewerCurrentIndex] = useState(0)

    const handleSetViewerVisible = useCallback((visible: boolean, currentIndex?: number) => {
      setViewerVisible(visible)
      if (currentIndex !== undefined) {
        setViewerCurrentIndex(currentIndex)
      }
    }, [])

    return (
      <GaleriaContext.Provider
        value={{
          hideBlurOverlay: false,
          hidePageIndicators: false,
          closeIconName: undefined,
          urls,
          theme,
          imageBackgroundColor,
          initialIndex: 0,
          open: false,
          src: '',
          setOpen: noop,
          ids,
          viewerVisible,
          viewerCurrentIndex,
          setViewerVisible: handleSetViewerVisible,
          setViewerCurrentIndex,
        }}
      >
        {children}
      </GaleriaContext.Provider>
    )
  },
  {
    Image({ edgeToEdge, onIndexChange: userOnIndexChange, ...restProps }: GaleriaViewProps) {
      const { theme, urls, imageBackgroundColor, setViewerVisible, setViewerCurrentIndex } =
        useContext(GaleriaContext)

      if (__DEV__) {
        controlEdgeToEdgeValues({ edgeToEdge })
      }

      const handleIndexChange = useCallback((event: GaleriaIndexChangedEvent) => {
        setViewerCurrentIndex(event.nativeEvent.currentIndex)
        userOnIndexChange?.(event)
      }, [userOnIndexChange, setViewerCurrentIndex])

      const handleViewerOpen = useCallback((event: GaleriaViewerOpenEvent) => {
        setViewerVisible(true, event.nativeEvent.currentIndex)
      }, [setViewerVisible])

      const handleViewerDismiss = useCallback((_event: GaleriaViewerDismissEvent) => {
        setViewerVisible(false)
      }, [setViewerVisible])

      return (
        <NativeImage
          onIndexChange={handleIndexChange}
          onViewerOpen={handleViewerOpen}
          onViewerDismiss={handleViewerDismiss}
          edgeToEdge={EDGE_TO_EDGE || (edgeToEdge ?? false)}
          theme={theme}
          imageBackgroundColor={restProps.imageBackgroundColor ?? imageBackgroundColor}
          urls={urls?.map((url) => {
            if (typeof url === 'string') {
              return url
            }

            return Image.resolveAssetSource(url).uri
          })}
          {...restProps}
        />
      )
    },
    Overlay({ children }: GaleriaOverlayProps) {
      const { viewerVisible, viewerCurrentIndex, urls } = useContext(GaleriaContext)

      const resolvedUrls = (urls ?? []).map((url) => {
        if (typeof url === 'string') return url
        return Image.resolveAssetSource(url).uri
      })

      return (
        <NativeOverlayView visible={viewerVisible} style={StyleSheet.absoluteFill} pointerEvents="box-none">
          {children({
            currentIndex: viewerCurrentIndex,
            total: resolvedUrls.length,
            urls: resolvedUrls,
          })}
        </NativeOverlayView>
      )
    },
    Popup: (() => null) as React.FC<{
      disableTransition?: 'web'
    }>,
  },
)

export default Galeria
