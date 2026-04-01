import { requireNativeModule, requireNativeView } from 'expo'

import { forwardRef, useCallback, useContext, useImperativeHandle, useMemo, useState } from 'react'
import { Image, NativeSyntheticEvent, StyleSheet } from 'react-native'
import {
  controlEdgeToEdgeValues,
  isEdgeToEdge,
} from 'react-native-is-edge-to-edge'
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

const EDGE_TO_EDGE = isEdgeToEdge()

type OptionsButtonPressEvent = NativeSyntheticEvent<{ index: number }>

const NativeImage = requireNativeView<
  Omit<GaleriaViewProps, 'onOptionsPress'> & {
    edgeToEdge: boolean
    urls?: string[]
    theme: 'dark' | 'light'
    optionsMode?: 'share' | 'custom'
    onIndexChange?: (event: GaleriaIndexChangedEvent) => void
    onViewerOpen?: (event: GaleriaViewerOpenEvent) => void
    onViewerDismiss?: (event: GaleriaViewerDismissEvent) => void
    onOptionsPress?: (event: OptionsButtonPressEvent) => void
    imageBackgroundColor?: string
  }
>('Galeria')

const NativeOverlayView = requireNativeView<{
  visible: boolean
  children?: React.ReactNode
  style?: any
  pointerEvents?: string
}>('GaleriaOverlay')

const noop = () => {}

const GaleriaInner = forwardRef<GaleriaRef, {
  children: React.ReactNode
} & Partial<Pick<GaleriaContext, 'theme' | 'ids' | 'urls' | 'imageBackgroundColor' | 'showOverlayAfterOpen' | 'showPageIndicator' | 'disableCache' | 'onOptionsPress'>>>(function Galeria({
    children,
    urls,
    theme = 'dark',
    ids,
    imageBackgroundColor,
    showOverlayAfterOpen = false,
    showPageIndicator = true,
    disableCache = false,
    onOptionsPress,
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
      hideBlurOverlay: false,
      hidePageIndicators: false,
      closeIconName: undefined,
      urls,
      theme,
      imageBackgroundColor,
      showOverlayAfterOpen,
      showPageIndicator,
      disableCache,
      onOptionsPress,
      initialIndex: 0,
      open: false as const,
      src: '',
      setOpen: noop,
      ids,
      viewerVisible,
      viewerCurrentIndex,
      setViewerVisible: handleSetViewerVisible,
      setViewerCurrentIndex,
    }), [
      urls, theme, imageBackgroundColor, showOverlayAfterOpen, showPageIndicator, disableCache, onOptionsPress, ids,
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
    Image({ edgeToEdge, onIndexChange: userOnIndexChange, onOptionsPress: imageOnOptionsPress, ...restProps }: GaleriaViewProps) {
      const { theme, urls, imageBackgroundColor, disableCache, onOptionsPress: contextOnOptionsPress, setViewerVisible, setViewerCurrentIndex } =
        useContext(GaleriaContext)

      const onOptionsPress = imageOnOptionsPress ?? contextOnOptionsPress

      const optionsMode = typeof onOptionsPress === 'function'
        ? 'custom' as const
        : onOptionsPress === 'share'
          ? 'share' as const
          : undefined

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

      const handleOptionsPress = useCallback((event: OptionsButtonPressEvent) => {
        if (typeof onOptionsPress === 'function') {
          onOptionsPress(event.nativeEvent.index)
        }
      }, [onOptionsPress])

      return (
        <NativeImage
          onIndexChange={handleIndexChange}
          onViewerOpen={handleViewerOpen}
          onViewerDismiss={handleViewerDismiss}
          onOptionsPress={optionsMode === 'custom' ? handleOptionsPress : undefined}
          edgeToEdge={EDGE_TO_EDGE || (edgeToEdge ?? false)}
          theme={theme}
          optionsMode={optionsMode}
          imageBackgroundColor={restProps.imageBackgroundColor ?? imageBackgroundColor}
          disableCache={restProps.disableCache ?? disableCache}
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
