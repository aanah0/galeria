import { GaleriaContext } from './context';
import { GaleriaOverlayProps, GaleriaViewProps } from './Galeria.types';
declare const Galeria: (({ children, urls, theme, ids, imageBackgroundColor, }: {
    children: React.ReactNode;
} & Partial<Pick<GaleriaContext, "theme" | "ids" | "urls" | "imageBackgroundColor">>) => import("react").JSX.Element) & {
    Image({ edgeToEdge, onIndexChange: userOnIndexChange, ...restProps }: GaleriaViewProps): import("react").JSX.Element;
    Overlay({ children }: GaleriaOverlayProps): import("react").JSX.Element;
    Popup: React.FC<{
        disableTransition?: "web";
    }>;
};
export default Galeria;
//# sourceMappingURL=GaleriaView.android.d.ts.map