import UIKit
#if canImport(SDWebImage)
import SDWebImage
#endif

class ImageViewerRootView: UIView, RootViewType {
    let transition = MatchTransition()

    weak var imageDatasource: ImageDataSource?
    let imageLoader: ImageLoader
    var initialIndex: Int = 0
    var theme: ImageViewerTheme = .dark
    var options: [ImageViewerOption] = []
    var onIndexChange: ((Int) -> Void)?
    var onOpen: ((Int) -> Void)?
    var onDismiss: (() -> Void)?
    var sourceImage: UIImage?
    var hideBlurOverlay: Bool = false
    var hidePageIndicators: Bool = false
    var imageBackgroundColor: UIColor?
    var disableCache: Bool = false
    var dismissTransitionOverride: Transition?

    private var pageViewController: UIPageViewController!
    private(set) lazy var backgroundView: UIView = {
        let view = UIView()
        view.backgroundColor = theme.color
        return view
    }()

    private(set) lazy var navBar: UINavigationBar = {
        let navBar = UINavigationBar(frame: .zero)
        navBar.isTranslucent = true
        navBar.setBackgroundImage(UIImage(), for: .default)
        navBar.shadowImage = UIImage()
        return navBar
    }()

    private lazy var navItem = UINavigationItem()
    private var currentOptionsMode: OptionsMode?

    private(set) var currentIndex: Int = 0
    private var initialViewController: ImageViewerController?
    private var hasCleanedUp = false

    var currentImageView: UIImageView? {
        if let vc = pageViewController?.viewControllers?.first as? ImageViewerController {
            return vc.imageView
        }
        if let vc = initialViewController {
            return vc.imageView
        }
        return nil
    }

    var currentScrollView: UIScrollView? {
        if let vc = pageViewController?.viewControllers?.first as? ImageViewerController {
            return vc.scrollView
        }
        return initialViewController?.scrollView
    }

    var preferredStatusBarStyle: UIStatusBarStyle {
        theme == .dark ? .lightContent : .default
    }

    var prefersStatusBarHidden: Bool { false }
    var prefersHomeIndicatorAutoHidden: Bool { false }

    func willAppear(animated: Bool) {
        navBar.alpha = 0
    }

    func didAppear(animated: Bool) {
        UIView.animate(withDuration: 0.25) {
            self.navBar.alpha = 1.0
        }
        NotificationCenter.default.post(
            name: .galeriaOverlayToggle,
            object: nil,
            userInfo: ["visible": true, "animated": true]
        )
        onOpen?(currentIndex)
    }

    func willDisappear(animated: Bool) {
        UIView.animate(withDuration: 0.25) {
            self.navBar.alpha = 0
        }
    }

    func didDisappear(animated: Bool) {
        onDismiss?()
        cleanup()
    }

    private func cleanup() {
        guard !hasCleanedUp else { return }
        hasCleanedUp = true

        pageViewController.viewControllers?.compactMap { $0 as? ImageViewerController }.forEach {
            $0.releaseResources()
        }
        pageViewController.children.compactMap { $0 as? ImageViewerController }.forEach {
            $0.releaseResources()
        }

        pageViewController.dataSource = nil
        pageViewController.delegate = nil
        initialViewController = nil
        imageDatasource = nil
        onDismiss = nil
        onIndexChange = nil
        onOpen = nil
        currentOptionsMode = nil
        sourceImage = nil
        transition.verticalDismissGestureRecognizer.view?.removeGestureRecognizer(transition.verticalDismissGestureRecognizer)

        #if canImport(SDWebImage)
        if disableCache {
            SDImageCache.shared.clearMemory()
        }
        #endif
    }

    init(
        imageDataSource: ImageDataSource?,
        imageLoader: ImageLoader,
        options: [ImageViewerOption] = [],
        initialIndex: Int = 0,
        sourceImage: UIImage? = nil
    ) {
        self.imageDatasource = imageDataSource
        self.imageLoader = imageLoader
        self.options = options
        self.initialIndex = initialIndex
        self.currentIndex = initialIndex
        self.sourceImage = sourceImage

        for option in options {
            if case .hidePageIndicators(let hide) = option {
                self.hidePageIndicators = hide
            }
            if case .disableCache(let disable) = option {
                self.disableCache = disable
            }
        }

        super.init(frame: .zero)
        setupViews()
        applyOptions()
        applyImageBackgroundColor()
        setupGestures()
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    deinit {
        cleanup()
    }

    private func setupViews() {
        addSubview(backgroundView)

        let pageOptions = [UIPageViewController.OptionsKey.interPageSpacing: 20]
        pageViewController = UIPageViewController(
            transitionStyle: .scroll,
            navigationOrientation: .horizontal,
            options: pageOptions
        )
        pageViewController.dataSource = self
        pageViewController.delegate = self
        pageViewController.view.backgroundColor = .clear

        addSubview(pageViewController.view)

        if let datasource = imageDatasource {
            let initialVC = ImageViewerController(
                index: initialIndex,
                imageItem: datasource.imageItem(at: initialIndex),
                imageLoader: imageLoader
            )
            self.initialViewController = initialVC
            initialVC.disableCache = disableCache

            if let sourceImage = self.sourceImage {
                initialVC.initialPlaceholder = sourceImage
            }

            initialVC.view.gestureRecognizers?.removeAll(where: { $0 is UIPanGestureRecognizer })
            pageViewController.setViewControllers([initialVC], direction: .forward, animated: false)

            initialVC.view.setNeedsLayout()
            initialVC.view.layoutIfNeeded()

            onIndexChange?(initialIndex)
        }

        let headerIconColor = UIColor(red: 149.0/255.0, green: 149.0/255.0, blue: 149.0/255.0, alpha: 1.0)
        let closeIcon = UIImage(systemName: "xmark")?.withTintColor(headerIconColor, renderingMode: .alwaysOriginal)
        let closeBarButton = UIBarButtonItem(
            image: closeIcon,
            style: .plain,
            target: self,
            action: #selector(dismissViewer)
        )
        closeBarButton.tintColor = headerIconColor
        navItem.leftBarButtonItem = closeBarButton
        navBar.items = [navItem]
        addSubview(navBar)
    }

    private func applyOptions() {
        let closeButton = navItem.leftBarButtonItem

        options.forEach { option in
            switch option {
            case .theme(let newTheme):
                self.theme = newTheme
                backgroundView.backgroundColor = newTheme.color
            case .closeIcon(let icon):
                closeButton?.image = icon
            case .optionsMode(let mode):
                self.currentOptionsMode = mode
                let headerIconColor = UIColor(red: 149.0/255.0, green: 149.0/255.0, blue: 149.0/255.0, alpha: 1.0)
                let ellipsisIcon = UIImage(systemName: "ellipsis")?.withTintColor(headerIconColor, renderingMode: .alwaysOriginal)
                let optionsButton = UIBarButtonItem(
                    image: ellipsisIcon,
                    style: .plain,
                    target: self,
                    action: #selector(didTapOptionsButton)
                )
                optionsButton.tintColor = headerIconColor
                navItem.rightBarButtonItem = optionsButton
            case .onIndexChange(let callback):
                self.onIndexChange = callback
            case .onOpen(let callback):
                self.onOpen = callback
            case .onDismiss(let callback):
                self.onDismiss = callback
            case .contentMode:
                break
            case .hideBlurOverlay(let hide):
                self.hideBlurOverlay = hide
            case .hidePageIndicators(let hide):
                self.hidePageIndicators = hide
            case .imageBackgroundColor(let color):
                self.imageBackgroundColor = color
            case .disableCache(let disable):
                self.disableCache = disable
            }
        }
    }

    private func applyImageBackgroundColor() {
        guard let color = imageBackgroundColor else { return }
        initialViewController?.imageBackgroundColor = color
    }

    private func setupGestures() {
        addGestureRecognizer(transition.verticalDismissGestureRecognizer)
        transition.verticalDismissGestureRecognizer.delegate = self

        let singleTapGesture = UITapGestureRecognizer(target: self, action: #selector(didSingleTap))
        singleTapGesture.numberOfTapsRequired = 1
        addGestureRecognizer(singleTapGesture)
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        backgroundView.frame = bounds
        pageViewController.view.frame = bounds

        pageViewController.view.setNeedsLayout()
        pageViewController.view.layoutIfNeeded()
        for child in pageViewController.children {
            child.view.setNeedsLayout()
            child.view.layoutIfNeeded()
        }

        let navBarHeight: CGFloat = 44
        let statusBarHeight = safeAreaInsets.top
        let horizontalPadding: CGFloat = 16
        navBar.frame = CGRect(
            x: horizontalPadding,
            y: statusBarHeight,
            width: bounds.width - (horizontalPadding * 2),
            height: navBarHeight
        )
    }

    @objc private func dismissViewer() {
        navigationView?.popView(animated: true)
    }

    @objc private func didSingleTap() {
        let currentAlpha = navBar.alpha
        let newAlpha: CGFloat = currentAlpha > 0.5 ? 0.0 : 1.0
        UIView.animate(withDuration: 0.235) {
            self.navBar.alpha = newAlpha
        }
        NotificationCenter.default.post(
            name: .galeriaOverlayToggle,
            object: nil,
            userInfo: ["visible": newAlpha > 0.5]
        )
    }

    @objc private func didTapOptionsButton() {
        guard let mode = currentOptionsMode else { return }
        switch mode {
        case .share:
            shareCurrentImage()
        case .custom(let onTap):
            onTap(currentIndex)
        }
    }

    private func shareCurrentImage() {
        guard let image = currentImageView?.image else { return }
        presentShareSheet(items: [image])
    }

    private func presentShareSheet(items: [Any]) {
        let activityVC = UIActivityViewController(activityItems: items, applicationActivities: nil)
        if let windowScene = window?.windowScene,
           let rootVC = windowScene.windows.first?.rootViewController {
            var topVC = rootVC
            while let presented = topVC.presentedViewController {
                topVC = presented
            }
            if let popover = activityVC.popoverPresentationController {
                popover.barButtonItem = navItem.rightBarButtonItem
            }
            topVC.present(activityVC, animated: true)
        }
    }
}

extension ImageViewerRootView: TransitionProvider {
    func transitionFor(presenting: Bool, otherView: UIView) -> Transition? {
        if !presenting, let override = dismissTransitionOverride {
            return override
        }
        return transition
    }
}

extension ImageViewerRootView: MatchTransitionDelegate {
    func matchedViewFor(transition: MatchTransition, otherView: UIView) -> UIView? {
        let imageView = currentImageView
        return imageView
    }

    func matchTransitionWillBegin(transition: MatchTransition) {
        navBar.alpha = 0
        transition.overlayView?.isHidden = hideBlurOverlay
    }
}

extension ImageViewerRootView: UIGestureRecognizerDelegate {
    override func gestureRecognizerShouldBegin(_ gestureRecognizer: UIGestureRecognizer) -> Bool {
        if let scrollView = currentScrollView {
            return scrollView.zoomScale <= scrollView.minimumZoomScale + 0.01
        }
        return true
    }

    func gestureRecognizer(
        _ gestureRecognizer: UIGestureRecognizer,
        shouldRecognizeSimultaneouslyWith otherGestureRecognizer: UIGestureRecognizer
    ) -> Bool {
        return false
    }
}

extension ImageViewerRootView: UIPageViewControllerDataSource {
    func pageViewController(
        _ pageViewController: UIPageViewController,
        viewControllerBefore viewController: UIViewController
    ) -> UIViewController? {
        guard let vc = viewController as? ImageViewerController,
              let datasource = imageDatasource,
              vc.index > 0 else {
            return nil
        }

        let newIndex = vc.index - 1
        let newVC = ImageViewerController(
            index: newIndex,
            imageItem: datasource.imageItem(at: newIndex),
            imageLoader: imageLoader
        )
        newVC.imageBackgroundColor = imageBackgroundColor
        newVC.disableCache = disableCache
        newVC.view.gestureRecognizers?.removeAll(where: { $0 is UIPanGestureRecognizer })
        return newVC
    }

    func pageViewController(
        _ pageViewController: UIPageViewController,
        viewControllerAfter viewController: UIViewController
    ) -> UIViewController? {
        guard let vc = viewController as? ImageViewerController,
              let datasource = imageDatasource,
              vc.index < datasource.numberOfImages() - 1 else {
            return nil
        }

        let newIndex = vc.index + 1
        let newVC = ImageViewerController(
            index: newIndex,
            imageItem: datasource.imageItem(at: newIndex),
            imageLoader: imageLoader
        )
        newVC.imageBackgroundColor = imageBackgroundColor
        newVC.disableCache = disableCache
        newVC.view.gestureRecognizers?.removeAll(where: { $0 is UIPanGestureRecognizer })
        return newVC
    }
    
    func presentationCount(for pageViewController: UIPageViewController) -> Int {
        guard !hidePageIndicators else { return 0 }
        let count = imageDatasource?.numberOfImages() ?? 0
        return count > 1 ? count : 0
    }
    
    func presentationIndex(for pageViewController: UIPageViewController) -> Int {
        return currentIndex
    }
}

extension Notification.Name {
    static let galeriaOverlayToggle = Notification.Name("galeriaOverlayToggle")
}

extension ImageViewerRootView: UIPageViewControllerDelegate {
    func pageViewController(
        _ pageViewController: UIPageViewController,
        didFinishAnimating finished: Bool,
        previousViewControllers: [UIViewController],
        transitionCompleted completed: Bool
    ) {
        if completed, let currentVC = pageViewController.viewControllers?.first as? ImageViewerController {
            currentIndex = currentVC.index
            onIndexChange?(currentIndex)
        }
    }
}
