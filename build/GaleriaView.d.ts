import { GaleriaOverlayProps, GaleriaViewProps } from './Galeria.types';
import { GaleriaContext } from './context';
declare function Image({ __web, index, children, style, dynamicAspectRatio, }: GaleriaViewProps): import("react").JSX.Element;
declare function Root({ children, urls, theme, ids, imageBackgroundColor, }: {
    children: React.ReactNode;
} & Partial<Pick<GaleriaContext, 'theme' | 'ids' | 'urls' | 'imageBackgroundColor'>>): import("react").JSX.Element;
declare function Overlay({ children }: GaleriaOverlayProps): import("react").ReactPortal | null;
declare const Galeria: typeof Root & {
    Image: typeof Image;
    Overlay: typeof Overlay;
    Popup: React.FC<{
        disableTransition?: "web";
    }>;
};
export default Galeria;
//# sourceMappingURL=GaleriaView.d.ts.map