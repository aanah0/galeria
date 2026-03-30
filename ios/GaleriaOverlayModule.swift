import ExpoModulesCore

public class GaleriaOverlayModule: Module {
    public func definition() -> ModuleDefinition {
        Name("GaleriaOverlay")

        View(GaleriaOverlayView.self) {
            Prop("visible") { (view, visible: Bool?) in
                view.visible = visible ?? false
            }
        }
    }
}
