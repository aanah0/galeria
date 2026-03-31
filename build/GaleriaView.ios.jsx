import { requireNativeView } from 'expo';
import { useCallback, useContext, useMemo, useState } from 'react';
import { Image, StyleSheet } from 'react-native';
import { GaleriaContext } from './context';
const NativeImage = requireNativeView('Galeria');
const NativeOverlayView = requireNativeView('GaleriaOverlay');
const noop = () => { };
const Galeria = Object.assign(function Galeria({ children, closeIconName, urls, theme = 'dark', ids, hideBlurOverlay = false, hidePageIndicators = false, imageBackgroundColor, }) {
    const [viewerVisible, setViewerVisible] = useState(false);
    const [viewerCurrentIndex, setViewerCurrentIndex] = useState(0);
    const handleSetViewerVisible = useCallback((visible, currentIndex) => {
        setViewerVisible(visible);
        if (currentIndex !== undefined) {
            setViewerCurrentIndex(currentIndex);
        }
    }, []);
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
        viewerVisible,
        viewerCurrentIndex,
        setViewerVisible: handleSetViewerVisible,
        setViewerCurrentIndex,
    }), [
        closeIconName, urls, theme, ids,
        hideBlurOverlay, hidePageIndicators, imageBackgroundColor,
        viewerVisible, viewerCurrentIndex,
        handleSetViewerVisible, setViewerCurrentIndex,
    ]);
    return (<GaleriaContext.Provider value={contextValue}>
        {children}
      </GaleriaContext.Provider>);
}, {
    Image({ onIndexChange: userOnIndexChange, ...restProps }) {
        const { theme, urls, initialIndex, closeIconName, hideBlurOverlay, hidePageIndicators, imageBackgroundColor, setViewerVisible, setViewerCurrentIndex, } = useContext(GaleriaContext);
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
        return (<NativeImage onIndexChange={handleIndexChange} onViewerOpen={handleViewerOpen} onViewerDismiss={handleViewerDismiss} closeIconName={closeIconName} theme={theme} hideBlurOverlay={restProps.hideBlurOverlay ?? hideBlurOverlay} hidePageIndicators={restProps.hidePageIndicators ?? hidePageIndicators} imageBackgroundColor={restProps.imageBackgroundColor ?? imageBackgroundColor} urls={urls?.map((url) => {
                if (typeof url === 'string') {
                    return url;
                }
                return Image.resolveAssetSource(url).uri;
            })} index={initialIndex} {...restProps}/>);
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
//# sourceMappingURL=GaleriaView.ios.jsx.map