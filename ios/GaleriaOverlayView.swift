import ExpoModulesCore
import UIKit

class PassthroughContainerView: UIView {
    override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
        let hitView = super.hitTest(point, with: event)
        return hitView === self ? nil : hitView
    }
}

class GaleriaOverlayView: ExpoView {
    private let containerView = PassthroughContainerView()
    private var overlayWindow: PassthroughWindow?
    private var isContainerAdded = false
    private var overlayObserver: NSObjectProtocol?

    var visible: Bool = false {
        didSet {
            if visible {
                showOverlay()
            } else {
                hideOverlay()
            }
        }
    }

    private func ensureContainerAdded() {
        guard !isContainerAdded else { return }
        isContainerAdded = true
        containerView.backgroundColor = .clear
        containerView.isHidden = true
        addSubview(containerView)
    }

    private func showOverlay() {
        guard overlayWindow == nil else { return }

        guard let windowScene = UIApplication.shared.connectedScenes
            .compactMap({ $0 as? UIWindowScene })
            .first else { return }

        let window = PassthroughWindow(windowScene: windowScene)
        window.windowLevel = .normal + 1
        window.backgroundColor = .clear

        let vc = UIViewController()
        vc.view.backgroundColor = .clear
        window.rootViewController = vc

        containerView.removeFromSuperview()
        vc.view.addSubview(containerView)
        containerView.frame = vc.view.bounds
        containerView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        containerView.isHidden = false
        containerView.alpha = 0.0

        window.isHidden = false

        overlayWindow = window

        overlayObserver = NotificationCenter.default.addObserver(
            forName: .galeriaOverlayToggle,
            object: nil,
            queue: .main
        ) { [weak self] notification in
            guard let visible = notification.userInfo?["visible"] as? Bool else { return }
            UIView.animate(withDuration: 0.235) {
                self?.containerView.alpha = visible ? 1.0 : 0.0
            }
        }
    }

    private func hideOverlay() {
        guard let window = overlayWindow else { return }

        if let observer = overlayObserver {
            NotificationCenter.default.removeObserver(observer)
            overlayObserver = nil
        }

        containerView.isHidden = true
        containerView.removeFromSuperview()
        addSubview(containerView)
        containerView.frame = bounds

        window.isHidden = true
        window.rootViewController = nil
        overlayWindow = nil
    }

    override func mountChildComponentView(_ childComponentView: UIView, index: Int) {
        ensureContainerAdded()
        containerView.insertSubview(childComponentView, at: index)
    }

    override func unmountChildComponentView(_ childComponentView: UIView, index: Int) {
        childComponentView.removeFromSuperview()
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        if overlayWindow == nil {
            containerView.frame = bounds
        }
    }

    deinit {
        if let observer = overlayObserver {
            NotificationCenter.default.removeObserver(observer)
        }
        overlayWindow?.isHidden = true
        overlayWindow?.rootViewController = nil
        overlayWindow = nil
    }
}
