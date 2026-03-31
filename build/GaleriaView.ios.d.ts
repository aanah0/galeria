import type { SFSymbol } from 'sf-symbols-typescript';
import { GaleriaOverlayProps, GaleriaRef, GaleriaViewProps } from './Galeria.types';
declare const Galeria: import("react").ForwardRefExoticComponent<{
    children: React.ReactNode;
} & Partial<Pick<{
    initialIndex: number;
    open: boolean;
    urls: undefined | (string | import("react-native").ImageSourcePropType)[];
    closeIconName: undefined | SFSymbol;
    ids: string[] | undefined;
    setOpen: (info: {
        open: true;
        src: string;
        initialIndex: number;
        id?: string;
    } | {
        open: false;
    }) => void;
    theme: "dark" | "light";
    src: string;
    hideBlurOverlay: boolean;
    hidePageIndicators: boolean;
    imageBackgroundColor: string | undefined;
    showOverlayAfterOpen: boolean;
    showPageIndicator: boolean;
    viewerVisible: boolean;
    viewerCurrentIndex: number;
    setViewerVisible: (_visible: boolean, _currentIndex?: number) => void;
    setViewerCurrentIndex: (_index: number) => void;
}, "theme" | "ids" | "urls" | "imageBackgroundColor" | "showOverlayAfterOpen" | "showPageIndicator" | "closeIconName" | "hideBlurOverlay" | "hidePageIndicators">> & import("react").RefAttributes<GaleriaRef>> & {
    Image({ onIndexChange: userOnIndexChange, ...restProps }: GaleriaViewProps): import("react").JSX.Element;
    Overlay({ children }: GaleriaOverlayProps): import("react").JSX.Element;
    Popup: React.FC<{
        disableTransition?: "web";
    }>;
};
export default Galeria;
//# sourceMappingURL=GaleriaView.ios.d.ts.map