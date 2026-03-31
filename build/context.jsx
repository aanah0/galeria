import { createContext } from 'react';
export const GaleriaContext = createContext({
    initialIndex: 0,
    open: false,
    urls: [],
    closeIconName: undefined,
    /**
     * @deprecated
     */
    ids: undefined,
    setOpen: (info) => { },
    theme: 'dark',
    src: '',
    hideBlurOverlay: false,
    hidePageIndicators: false,
    imageBackgroundColor: undefined,
    showOverlayAfterOpen: false,
    showPageIndicator: true,
    viewerVisible: false,
    viewerCurrentIndex: 0,
    setViewerVisible: (_visible, _currentIndex) => { },
    setViewerCurrentIndex: (_index) => { },
});
//# sourceMappingURL=context.jsx.map