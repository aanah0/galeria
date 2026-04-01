import UIKit

public enum OptionsMode {
    case share
    case custom(onTap: (Int) -> Void)
}

public enum ImageViewerOption {
    case theme(ImageViewerTheme)
    case contentMode(UIView.ContentMode)
    case closeIcon(UIImage)
    case optionsMode(OptionsMode)
    case onIndexChange((_ index: Int) -> Void)
    case onOpen((_ index: Int) -> Void)
    case onDismiss(() -> Void)
    case hideBlurOverlay(Bool)
    case hidePageIndicators(Bool)
    case imageBackgroundColor(UIColor)
    case disableCache(Bool)
}
