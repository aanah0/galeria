import { requireNativeModule, requireNativeView } from 'expo';
import { forwardRef, useCallback, useContext, useImperativeHandle, useMemo, useState } from 'react';
import { Image, StyleSheet } from 'react-native';
import { GaleriaContext } from './context';
const GaleriaModule = requireNativeModule('Galeria');
const NativeImage = requireNativeView('Galeria');
const NativeOverlayView = requireNativeView('GaleriaOverlay');
const noop = () => { };
const GaleriaInner = forwardRef(function Galeria({ children, closeIconName, urls, theme = 'dark', ids, hideBlurOverlay = false, hidePageIndicators = false, imageBackgroundColor, showOverlayAfterOpen = false, showPageIndicator = true, disableCache = false, onOptionsPress, }, ref) {
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
        showOverlayAfterOpen,
        showPageIndicator,
        disableCache,
        onOptionsPress,
        viewerVisible,
        viewerCurrentIndex,
        setViewerVisible: handleSetViewerVisible,
        setViewerCurrentIndex,
    }), [
        closeIconName, urls, theme, ids,
        hideBlurOverlay, hidePageIndicators, imageBackgroundColor,
        showOverlayAfterOpen, showPageIndicator, disableCache,
        onOptionsPress,
        viewerVisible, viewerCurrentIndex,
        handleSetViewerVisible, setViewerCurrentIndex,
    ]);
    return (<GaleriaContext.Provider value={contextValue}>
        {children}
      </GaleriaContext.Provider>);
});
const Galeria = Object.assign(GaleriaInner, {
    Image({ onIndexChange: userOnIndexChange, onOptionsPress: imageOnOptionsPress, ...restProps }) {
        const { theme, urls, initialIndex, closeIconName, hideBlurOverlay, hidePageIndicators, imageBackgroundColor, showPageIndicator, disableCache, onOptionsPress: contextOnOptionsPress, setViewerVisible, setViewerCurrentIndex, } = useContext(GaleriaContext);
        const onOptionsPress = imageOnOptionsPress ?? contextOnOptionsPress;
        const optionsMode = typeof onOptionsPress === 'function'
            ? 'custom'
            : onOptionsPress === 'share'
                ? 'share'
                : undefined;
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
        const handleOptionsPress = useCallback((event) => {
            if (typeof onOptionsPress === 'function') {
                onOptionsPress(event.nativeEvent.index);
            }
        }, [onOptionsPress]);
        return (<NativeImage onIndexChange={handleIndexChange} onViewerOpen={handleViewerOpen} onViewerDismiss={handleViewerDismiss} onPressRightNavItemIcon={optionsMode === 'custom' ? handleOptionsPress : undefined} closeIconName={closeIconName} theme={theme} optionsMode={optionsMode} hideBlurOverlay={restProps.hideBlurOverlay ?? hideBlurOverlay} hidePageIndicators={restProps.hidePageIndicators ?? (!(showPageIndicator ?? true) || hidePageIndicators)} imageBackgroundColor={restProps.imageBackgroundColor ?? imageBackgroundColor} disableCache={restProps.disableCache ?? disableCache} urls={urls?.map((url) => {
                if (typeof url === 'string') {
                    return url;
                }
                return Image.resolveAssetSource(url).uri;
            })} index={initialIndex} {...restProps}/>);
    },
    Overlay({ children }) {
        const { viewerVisible, viewerCurrentIndex, urls, showOverlayAfterOpen } = useContext(GaleriaContext);
        const resolvedUrls = (urls ?? []).map((url) => {
            if (typeof url === 'string')
                return url;
            return Image.resolveAssetSource(url).uri;
        });
        return (<NativeOverlayView visible={viewerVisible} showAfterOpen={showOverlayAfterOpen} style={StyleSheet.absoluteFill} pointerEvents="box-none">
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
//# sourceMappingURL=GaleriaView.ios.jsx.map