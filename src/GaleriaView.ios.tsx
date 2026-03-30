import { requireNativeView } from 'expo'

import { useCallback, useContext, useState } from 'react'
import { Image, StyleSheet } from 'react-native'
import type { SFSymbol } from 'sf-symbols-typescript'
import { GaleriaContext } from './context'
import {
  GaleriaIndexChangedEvent,
  GaleriaOverlayProps,
  GaleriaViewerDismissEvent,
  GaleriaViewerOpenEvent,
  GaleriaViewProps,
} from './Galeria.types'

const NativeImage = requireNativeView<
  GaleriaViewProps & {
    urls?: string[]
    closeIconName?: SFSymbol
    theme: 'dark' | 'light'
    onIndexChange?: (event: GaleriaIndexChangedEvent) => void
    onViewerOpen?: (event: GaleriaViewerOpenEvent) => void
    onViewerDismiss?: (event: GaleriaViewerDismissEvent) => void
    hideBlurOverlay?: boolean
    hidePageIndicators?: boolean
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
    closeIconName,
    urls,
    theme = 'dark',
    ids,
    hideBlurOverlay = false,
    hidePageIndicators = false,
    imageBackgroundColor,
  }: {
    children: React.ReactNode
  } & Partial<
    Pick<GaleriaContext, 'theme' | 'ids' | 'urls' | 'closeIconName' | 'hideBlurOverlay' | 'hidePageIndicators' | 'imageBackgroundColor'>
  >) {
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
          closeIconName,
          urls,
          theme,
          initialIndex: 0,
          open: false,
          src: '',
          setOpen: noop,
          ids,
          hideBlurOverlay,
          hidePageIndicators,
          imageBackgroundColor,
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
    Image({ onIndexChange: userOnIndexChange, ...restProps }: GaleriaViewProps) {
      const {
        theme, urls, initialIndex, closeIconName,
        hideBlurOverlay, hidePageIndicators, imageBackgroundColor,
        setViewerVisible, setViewerCurrentIndex,
      } = useContext(GaleriaContext)

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
          closeIconName={closeIconName}
          theme={theme}
          hideBlurOverlay={restProps.hideBlurOverlay ?? hideBlurOverlay}
          hidePageIndicators={restProps.hidePageIndicators ?? hidePageIndicators}
          imageBackgroundColor={restProps.imageBackgroundColor ?? imageBackgroundColor}
          urls={urls?.map((url) => {
            if (typeof url === 'string') {
              return url
            }

            return Image.resolveAssetSource(url).uri
          })}
          index={initialIndex}
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
