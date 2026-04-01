import UIKit

public class SlideToBottomTransition: InteractiveTransition {
    public var overlayView: UIView?

    public override func setupTransition(context: any TransitionContext, animator: TransitionAnimator) {
        let container = context.container
        let foregroundView = context.foreground
        let backgroundView = context.background

        let overlayView = UIView()
        overlayView.backgroundColor = .black.withAlphaComponent(0.4)
        overlayView.frame = container.bounds
        foregroundView.frame = container.bounds

        if backgroundView.window == nil {
            container.addSubview(backgroundView)
        }
        backgroundView.addSubview(overlayView)
        backgroundView.addSubview(foregroundView)
        foregroundView.lockedSafeAreaInsets = container.safeAreaInsets

        animator[foregroundView, \.translationY].dismissedValue = container.bounds.height
        animator[overlayView, \.alpha].dismissedValue = 0

        self.overlayView = overlayView
    }

    public override func cleanupTransition(endPosition: TransitionEndPosition) {
        guard let context else { return }
        context.foreground.lockedSafeAreaInsets = nil
        context.foreground.isUserInteractionEnabled = true
        overlayView?.removeFromSuperview()
    }
}
