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

        window.isHidden = false

        overlayWindow = window
    }

    private func hideOverlay() {
        guard let window = overlayWindow else { return }

        containerView.removeFromSuperview()
        addSubview(containerView)
        containerView.frame = bounds

        window.isHidden = true
        window.rootViewController = nil
        overlayWindow = nil
    }

    #if !RCT_NEW_ARCH_ENABLED
    override func insertReactSubview(_ subview: UIView!, at atIndex: Int) {
        ensureContainerAdded()
        containerView.insertSubview(subview, at: atIndex)
    }

    override func removeReactSubview(_ subview: UIView!) {
        subview.removeFromSuperview()
    }
    #endif

    #if RCT_NEW_ARCH_ENABLED
    override func mountChildComponentView(_ childComponentView: UIView, index: Int) {
        ensureContainerAdded()
        containerView.insertSubview(childComponentView, at: index)
    }

    override func unmountChildComponentView(_ childComponentView: UIView, index: Int) {
        childComponentView.removeFromSuperview()
    }
    #endif

    override func layoutSubviews() {
        super.layoutSubviews()
        if overlayWindow == nil {
            containerView.frame = bounds
        }
    }

    deinit {
        overlayWindow?.isHidden = true
        overlayWindow?.rootViewController = nil
        overlayWindow = nil
    }
}
