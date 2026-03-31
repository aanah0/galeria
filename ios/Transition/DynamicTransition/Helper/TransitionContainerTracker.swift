import UIKit

class TransitionContainerTracker {
    static let shared = TransitionContainerTracker()

    class ContainerContext {
        var presentedCount: Int = 0
        var transitionCount: Int = 0
    }
    private let containers = NSMapTable<UIView, ContainerContext>(
        keyOptions: .weakMemory,
        valueOptions: .strongMemory
    )

    func transitionStart(from: UIView, to: UIView) {
        if self[from].presentedCount == 0, self[from].transitionCount == 0 {
            self[from].presentedCount = 1 // source should be already presented
        }
        self[from].transitionCount += 1
        self[to].transitionCount += 1
    }

    func transitionEnd(from: UIView, to: UIView, completed: Bool) {
        self[from].transitionCount -= 1
        self[to].transitionCount -= 1
        self[from].presentedCount -= completed ? 1 : 0
        self[to].presentedCount += completed ? 1 : 0
        cleanupContainers()
    }

    private func cleanupContainers() {
        var toBeRemoved: [UIView] = []
        var toKeepContainers = Set(allViews())

        for view in allViews() {
            guard let context = containers.object(forKey: view) else { continue }
            //            print("\(type(of: view)): \(context.transitionCount) \(context.presentedCount)")
            if context.transitionCount <= 0 && context.presentedCount <= 0 {
                toBeRemoved.append(view)
                toKeepContainers.remove(view)
            }
        }

        for toBeRemove in toBeRemoved {
            for childToKeep in toBeRemove.subviews.filter({ toKeepContainers.contains($0) }) {
                toBeRemove.superview?.insertSubview(childToKeep, aboveSubview: toBeRemove)
            }
            toBeRemove.removeFromSuperview()
            containers.removeObject(forKey: toBeRemove)
        }
    }

    private subscript(view: UIView) -> ContainerContext {
        get {
            if let context = containers.object(forKey: view) {
                return context
            }

            let context = ContainerContext()
            containers.setObject(context, forKey: view)
            return context
        }
        set {
            containers.setObject(newValue, forKey: view)
        }
    }

    private func allViews() -> [UIView] {
        let enumerator = containers.keyEnumerator()
        var views: [UIView] = []

        while let view = enumerator.nextObject() as? UIView {
            views.append(view)
        }

        return views
    }
}
