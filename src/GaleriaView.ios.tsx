import { requireNativeModule, requireNativeView } from 'expo'

import { forwardRef, useCallback, useContext, useImperativeHandle, useMemo, useState } from 'react'
import { Image, StyleSheet } from 'react-native'
import type { SFSymbol } from 'sf-symbols-typescript'
import { GaleriaContext } from './context'
import {
  GaleriaIndexChangedEvent,
  GaleriaOverlayProps,
  GaleriaRef,
  GaleriaViewerDismissEvent,
  GaleriaViewerOpenEvent,
  GaleriaViewProps,
} from './Galeria.types'

const GaleriaModule = requireNativeModule('Galeria')

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
  showAfterOpen?: boolean
  children?: React.ReactNode
  style?: any
  pointerEvents?: string
}>('GaleriaOverlay')

const noop = () => {}

const GaleriaInner = forwardRef<GaleriaRef, {
  children: React.ReactNode
} & Partial<
  Pick<GaleriaContext, 'theme' | 'ids' | 'urls' | 'closeIconName' | 'hideBlurOverlay' | 'hidePageIndicators' | 'imageBackgroundColor' | 'showOverlayAfterOpen' | 'showPageIndicator' | 'disableCache'>
>>(function Galeria({
    children,
    closeIconName,
    urls,
    theme = 'dark',
    ids,
    hideBlurOverlay = false,
    hidePageIndicators = false,
    imageBackgroundColor,
    showOverlayAfterOpen = false,
    showPageIndicator = true,
    disableCache = false,
  }, ref) {
    const [viewerVisible, setViewerVisible] = useState(false)
    const [viewerCurrentIndex, setViewerCurrentIndex] = useState(0)

    const handleSetViewerVisible = useCallback((visible: boolean, currentIndex?: number) => {
      setViewerVisible(visible)
      if (currentIndex !== undefined) {
        setViewerCurrentIndex(currentIndex)
      }
    }, [])

    useImperativeHandle(ref, () => ({
      close: (animation) => {
        handleSetViewerVisible(false)
        GaleriaModule.close(animation ?? 'default')
      },
    }), [handleSetViewerVisible])

    const contextValue = useMemo(() => ({
      closeIconName,
      urls,
      theme,
      initialIndex: 0,
      open: false as const,
      src: '',
      setOpen: noop,
      ids,
      hideBlurOverlay,
      hidePageIndicators,
      imageBackgroundColor,
      showOverlayAfterOpen,
      showPageIndicator,
      disableCache,
      viewerVisible,
      viewerCurrentIndex,
      setViewerVisible: handleSetViewerVisible,
      setViewerCurrentIndex,
    }), [
      closeIconName, urls, theme, ids,
      hideBlurOverlay, hidePageIndicators, imageBackgroundColor,
      showOverlayAfterOpen, showPageIndicator, disableCache,
      viewerVisible, viewerCurrentIndex,
      handleSetViewerVisible, setViewerCurrentIndex,
    ])

    return (
      <GaleriaContext.Provider value={contextValue}>
        {children}
      </GaleriaContext.Provider>
    )
  })

const Galeria = Object.assign(
  GaleriaInner,
  {
    Image({ onIndexChange: userOnIndexChange, ...restProps }: GaleriaViewProps) {
      const {
        theme, urls, initialIndex, closeIconName,
        hideBlurOverlay, hidePageIndicators, imageBackgroundColor,
        showPageIndicator, disableCache,
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
          hidePageIndicators={restProps.hidePageIndicators ?? (!(showPageIndicator ?? true) || hidePageIndicators)}
          imageBackgroundColor={restProps.imageBackgroundColor ?? imageBackgroundColor}
          disableCache={restProps.disableCache ?? disableCache}
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
      const { viewerVisible, viewerCurrentIndex, urls, showOverlayAfterOpen } = useContext(GaleriaContext)

      const resolvedUrls = (urls ?? []).map((url) => {
        if (typeof url === 'string') return url
        return Image.resolveAssetSource(url).uri
      })

      return (
        <NativeOverlayView visible={viewerVisible} showAfterOpen={showOverlayAfterOpen} style={StyleSheet.absoluteFill} pointerEvents="box-none">
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
