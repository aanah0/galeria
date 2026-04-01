import { requireNativeModule, requireNativeView } from 'expo';
import { forwardRef, useCallback, useContext, useImperativeHandle, useMemo, useState } from 'react';
import { Image, StyleSheet } from 'react-native';
import { controlEdgeToEdgeValues, isEdgeToEdge, } from 'react-native-is-edge-to-edge';
import { GaleriaContext } from './context';
const GaleriaModule = requireNativeModule('Galeria');
const EDGE_TO_EDGE = isEdgeToEdge();
const NativeImage = requireNativeView('Galeria');
const NativeOverlayView = requireNativeView('GaleriaOverlay');
const noop = () => { };
const GaleriaInner = forwardRef(function Galeria({ children, urls, theme = 'dark', ids, imageBackgroundColor, showOverlayAfterOpen = false, showPageIndicator = true, disableCache = false, }, ref) {
    const [viewerVisible, setViewerVisible] = useState(false);
    const [viewerCurrentIndex, setViewerCurrentIndex] = useState(0);
    const handleSetViewerVisible = useCallback((visible, currentIndex) => {
        setViewerVisible(visible);
        if (currentIndex !== undefined) {
            setViewerCurrentIndex(currentIndex);
        }
    }, []);
    useImperativeHandle(ref, () => ({
        close: (animation) => {
            handleSetViewerVisible(false);
            GaleriaModule.close(animation ?? 'default');
        },
    }), [handleSetViewerVisible]);
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
        initialIndex: 0,
        open: false,
        src: '',
        setOpen: noop,
        ids,
        viewerVisible,
        viewerCurrentIndex,
        setViewerVisible: handleSetViewerVisible,
        setViewerCurrentIndex,
    }), [
        urls, theme, imageBackgroundColor, showOverlayAfterOpen, showPageIndicator, disableCache, ids,
        viewerVisible, viewerCurrentIndex,
        handleSetViewerVisible, setViewerCurrentIndex,
    ]);
    return (<GaleriaContext.Provider value={contextValue}>
        {children}
      </GaleriaContext.Provider>);
});
const Galeria = Object.assign(GaleriaInner, {
    Image({ edgeToEdge, onIndexChange: userOnIndexChange, ...restProps }) {
        const { theme, urls, imageBackgroundColor, disableCache, setViewerVisible, setViewerCurrentIndex } = useContext(GaleriaContext);
        if (__DEV__) {
            controlEdgeToEdgeValues({ edgeToEdge });
        }
        const handleIndexChange = useCallback((event) => {
            setViewerCurrentIndex(event.nativeEvent.currentIndex);
            userOnIndexChange?.(event);
        }, [userOnIndexChange, setViewerCurrentIndex]);
        const handleViewerOpen = useCallback((event) => {
            setViewerVisible(true, event.nativeEvent.currentIndex);
        }, [setViewerVisible]);
        const handleViewerDismiss = useCallback((_event) => {
            setViewerVisible(false);
        }, [setViewerVisible]);
        return (<NativeImage onIndexChange={handleIndexChange} onViewerOpen={handleViewerOpen} onViewerDismiss={handleViewerDismiss} edgeToEdge={EDGE_TO_EDGE || (edgeToEdge ?? false)} theme={theme} imageBackgroundColor={restProps.imageBackgroundColor ?? imageBackgroundColor} disableCache={restProps.disableCache ?? disableCache} urls={urls?.map((url) => {
                if (typeof url === 'string') {
                    return url;
                }
                return Image.resolveAssetSource(url).uri;
            })} {...restProps}/>);
    },
    Overlay({ children }) {
        const { viewerVisible, viewerCurrentIndex, urls } = useContext(GaleriaContext);
        const resolvedUrls = (urls ?? []).map((url) => {
            if (typeof url === 'string')
                return url;
            return Image.resolveAssetSource(url).uri;
        });
        return (<NativeOverlayView visible={viewerVisible} style={StyleSheet.absoluteFill} pointerEvents="box-none">
          {children({
                currentIndex: viewerCurrentIndex,
                total: resolvedUrls.length,
                urls: resolvedUrls,
            })}
        </NativeOverlayView>);
    },
    Popup: (() => null),
});
export default Galeria;
//# sourceMappingURL=GaleriaView.android.jsx.map