import { GaleriaContext } from './context';
import { GaleriaOverlayProps, GaleriaViewProps } from './Galeria.types';
declare const Galeria: (({ children, closeIconName, urls, theme, ids, hideBlurOverlay, hidePageIndicators, imageBackgroundColor, }: {
    children: React.ReactNode;
} & Partial<Pick<GaleriaContext, "theme" | "ids" | "urls" | "closeIconName" | "hideBlurOverlay" | "hidePageIndicators" | "imageBackgroundColor">>) => import("react").JSX.Element) & {
    Image({ onIndexChange: userOnIndexChange, ...restProps }: GaleriaViewProps): import("react").JSX.Element;
    Overlay({ children }: GaleriaOverlayProps): import("react").JSX.Element;
    Popup: React.FC<{
        disableTransition?: "web";
    }>;
};
export default Galeria;
//# sourceMappingURL=GaleriaView.ios.d.ts.map