import ExpoModulesCore

private func parseColor(_ string: String) -> UIColor? {
  let input = string.trimmingCharacters(in: .whitespacesAndNewlines)

  // Handle rgb()/rgba()
  if input.hasPrefix("rgb") {
    let components = input
      .replacingOccurrences(of: "rgba(", with: "")
      .replacingOccurrences(of: "rgb(", with: "")
      .replacingOccurrences(of: ")", with: "")
      .split(separator: ",")
      .compactMap { Double($0.trimmingCharacters(in: .whitespaces)) }

    guard components.count >= 3 else { return nil }
    let alpha = components.count > 3 ? CGFloat(components[3]) : 1.0
    return UIColor(
      red: CGFloat(components[0]) / 255.0,
      green: CGFloat(components[1]) / 255.0,
      blue: CGFloat(components[2]) / 255.0,
      alpha: alpha
    )
  }

  // Handle hex
  var hex = input.replacingOccurrences(of: "#", with: "")
  if hex.count == 3 { hex = hex.map { "\($0)\($0)" }.joined() }
  if hex.count == 6 { hex += "FF" }
  guard hex.count == 8 else { return nil }

  var rgba: UInt64 = 0
  guard Scanner(string: hex).scanHexInt64(&rgba) else { return nil }
  return UIColor(
    red: CGFloat((rgba >> 24) & 0xFF) / 255.0,
    green: CGFloat((rgba >> 16) & 0xFF) / 255.0,
    blue: CGFloat((rgba >> 8) & 0xFF) / 255.0,
    alpha: CGFloat(rgba & 0xFF) / 255.0
  )
}

public class GaleriaModule: Module {
  public func definition() -> ModuleDefinition {
    Name("Galeria")

    AsyncFunction("close") { (animation: String?) in
      DispatchQueue.main.async {
        dismissCurrentViewer(animation: animation ?? "default")
      }
    }

    View(GaleriaView.self) {
      Events("onIndexChange", "onViewerOpen", "onViewerDismiss")

      OnViewDidUpdateProps { (view) in
        view.setupImageView()
      }

      Prop("urls") { (view, urls: [String]?) in
        view.urls = urls
      }

      Prop("index") { (view, index: Int?) in
        view.initialIndex = index
      }

      Prop("theme") { (view, theme: Theme?) in
        view.theme = theme ?? .dark
      }
      Prop("closeIconName") { (view, closeIconName: String?) in
        view.closeIconName = closeIconName
      }
      Prop("rightNavItemIconName") { (view, rightNavItemIconName: String) in
        view.rightNavItemIconName = rightNavItemIconName
      }

      Prop("hideBlurOverlay") { (view, hideBlurOverlay: Bool?) in
        view.hideBlurOverlay = hideBlurOverlay ?? false
      }

      Prop("hidePageIndicators") { (view, hidePageIndicators: Bool?) in
        view.hidePageIndicators = hidePageIndicators ?? false
      }

      Prop("disableCache") { (view, disableCache: Bool?) in
        view.disableCache = disableCache ?? false
      }

      Prop("imageBackgroundColor") { (view, imageBackgroundColor: String?) in
        if let colorString = imageBackgroundColor {
          view.imageBackgroundColor = parseColor(colorString)
        } else {
          view.imageBackgroundColor = nil
        }
      }

    }
  }

  func onIndexChange(index: Int) {
    sendEvent("onIndexChange", ["currentIndex": index])
  }
}
