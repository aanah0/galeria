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

    private var closeButton: UIButton!
    private var optionsButton: UIButton?
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
        closeButton.alpha = 0
        optionsButton?.alpha = 0
    }

    func didAppear(animated: Bool) {
        UIView.animate(withDuration: 0.25) {
            self.closeButton.alpha = 1.0
            self.optionsButton?.alpha = 1.0
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
            self.closeButton.alpha = 0
            self.optionsButton?.alpha = 0
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

    private func makeHeaderButton(systemName: String, action: Selector) -> UIButton {
        let iconColor = UIColor(red: 149.0/255.0, green: 149.0/255.0, blue: 149.0/255.0, alpha: 1.0)
        let bgColor = UIColor(red: 51.0/255.0, green: 51.0/255.0, blue: 51.0/255.0, alpha: 1.0)

        let button = UIButton(type: .system)
        let config = UIImage.SymbolConfiguration(pointSize: 16, weight: .thin)
        let icon = UIImage(systemName: systemName, withConfiguration: config)?.withTintColor(iconColor, renderingMode: .alwaysOriginal)
        button.setImage(icon, for: .normal)
        button.backgroundColor = bgColor
        button.layer.cornerRadius = 24
        button.clipsToBounds = true
        button.addTarget(self, action: action, for: .touchUpInside)
        button.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            button.widthAnchor.constraint(equalToConstant: 48),
            button.heightAnchor.constraint(equalToConstant: 48),
        ])
        return button
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

        closeButton = makeHeaderButton(systemName: "xmark", action: #selector(dismissViewer))
        addSubview(closeButton)
    }

    private func applyOptions() {
        options.forEach { option in
            switch option {
            case .theme(let newTheme):
                self.theme = newTheme
                backgroundView.backgroundColor = newTheme.color
            case .closeIcon(let icon):
                let iconColor = UIColor(red: 149.0/255.0, green: 149.0/255.0, blue: 149.0/255.0, alpha: 1.0)
                closeButton.setImage(icon.withTintColor(iconColor, renderingMode: .alwaysOriginal), for: .normal)
            case .optionsMode(let mode):
                self.currentOptionsMode = mode
                let optionsBtn = makeHeaderButton(systemName: "ellipsis", action: #selector(didTapOptionsButton))
                self.optionsButton = optionsBtn
                addSubview(optionsBtn)
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

        let statusBarTop = safeAreaInsets.top
        closeButton.frame = CGRect(x: 16, y: statusBarTop + 16, width: 48, height: 48)
        optionsButton?.frame = CGRect(x: bounds.width - 16 - 48, y: statusBarTop + 16, width: 48, height: 48)
    }

    @objc private func dismissViewer() {
        navigationView?.popView(animated: true)
    }

    @objc private func didSingleTap() {
        let currentAlpha = closeButton.alpha
        let newAlpha: CGFloat = currentAlpha > 0.5 ? 0.0 : 1.0
        UIView.animate(withDuration: 0.235) {
            self.closeButton.alpha = newAlpha
            self.optionsButton?.alpha = newAlpha
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
        guard let data = image.pngData() else { return }

        let tempDir = FileManager.default.temporaryDirectory
        let fileURL = tempDir.appendingPathComponent("Image.png")
        try? data.write(to: fileURL)

        presentShareSheet(items: [fileURL])
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
                popover.sourceView = optionsButton
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
        closeButton.alpha = 0
        optionsButton?.alpha = 0
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
