package nandorojo.modules.galeria

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class GaleriaOverlayModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("GaleriaOverlay")

        View(GaleriaOverlayView::class) {
            Prop("visible") { view: GaleriaOverlayView, visible: Boolean ->
                view.visible = visible
            }
        }
    }
}
