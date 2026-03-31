import { requireNativeView } from 'expo';
import { useCallback, useContext, useState } from 'react';
import { Image, StyleSheet } from 'react-native';
import { controlEdgeToEdgeValues, isEdgeToEdge, } from 'react-native-is-edge-to-edge';
import { GaleriaContext } from './context';
const EDGE_TO_EDGE = isEdgeToEdge();
const NativeImage = requireNativeView('Galeria');
const NativeOverlayView = requireNativeView('GaleriaOverlay');
const noop = () => { };
const Galeria = Object.assign(function Galeria({ children, urls, theme = 'dark', ids, imageBackgroundColor, }) {
    const [viewerVisible, setViewerVisible] = useState(false);
    const [viewerCurrentIndex, setViewerCurrentIndex] = useState(0);
    const handleSetViewerVisible = useCallback((visible, currentIndex) => {
        setViewerVisible(visible);
        if (currentIndex !== undefined) {
            setViewerCurrentIndex(currentIndex);
        }
    }, []);
    return (<GaleriaContext.Provider value={{
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
        }}>
        {children}
      </GaleriaContext.Provider>);
}, {
    Image({ edgeToEdge, onIndexChange: userOnIndexChange, ...restProps }) {
        const { theme, urls, imageBackgroundColor, setViewerVisible, setViewerCurrentIndex } = useContext(GaleriaContext);
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
        return (<NativeImage onIndexChange={handleIndexChange} onViewerOpen={handleViewerOpen} onViewerDismiss={handleViewerDismiss} edgeToEdge={EDGE_TO_EDGE || (edgeToEdge ?? false)} theme={theme} imageBackgroundColor={restProps.imageBackgroundColor ?? imageBackgroundColor} urls={urls?.map((url) => {
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