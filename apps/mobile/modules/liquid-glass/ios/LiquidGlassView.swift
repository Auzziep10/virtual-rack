import ExpoModulesCore
import SwiftUI
import UIKit

// Observable object to pass props into SwiftUI
class GlassProps: ObservableObject {
  @Published var cornerRadius: Double = 0.0
  @Published var tint: String = "light"
  @Published var interactive: Bool = false
}

// The SwiftUI View that utilizes the new Liquid Glass API
@available(iOS 20.0, *)
struct SwiftUILiquidGlassView: View {
  @ObservedObject var props: GlassProps
  
  var body: some View {
    Color.clear
      .glassEffect(
        props.tint == "dark" ? .regular.tint(.black) : (props.tint == "orange" ? .regular.tint(.orange) : .regular),
        in: .rect(cornerRadius: props.cornerRadius)
      )
      .modifier(InteractiveGlassModifier(interactive: props.interactive))
      .edgesIgnoringSafeArea(.all)
  }
}

// Helper to apply the interactive modifier conditionally
@available(iOS 20.0, *)
struct InteractiveGlassModifier: ViewModifier {
  var interactive: Bool
  func body(content: Content) -> some View {
    if interactive {
      content.glassEffect(.regular.interactive())
    } else {
      content
    }
  }
}

public class LiquidGlassNativeView: ExpoView {
  let glassProps = GlassProps()
  var hostingController: UIViewController?
  var fallbackView: UIVisualEffectView?

  public required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    self.backgroundColor = .clear
    self.clipsToBounds = true
    
    setupView()
  }

  private func setupView() {
    if #available(iOS 20.0, *) {
      // Use the new SwiftUI Liquid Glass API
      let swiftUIView = SwiftUILiquidGlassView(props: glassProps)
      let host = UIHostingController(rootView: swiftUIView)
      host.view.backgroundColor = .clear
      
      self.addSubview(host.view)
      self.hostingController = host
    } else {
      // Fallback for iOS 19 and below
      let blurEffect = UIBlurEffect(style: .systemThinMaterial)
      let visualEffectView = UIVisualEffectView(effect: blurEffect)
      visualEffectView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
      
      self.addSubview(visualEffectView)
      self.fallbackView = visualEffectView
    }
  }

  public func updateFallbackView() {
    guard let fallback = fallbackView else { return }
    let blurStyle: UIBlurEffect.Style = glassProps.tint == "dark" ? .systemThinMaterialDark : (glassProps.tint == "light" ? .systemThinMaterialLight : .systemThinMaterial)
    fallback.effect = UIBlurEffect(style: blurStyle)
  }

  public override func layoutSubviews() {
    super.layoutSubviews()
    
    if let hostView = hostingController?.view {
      hostView.frame = self.bounds
      self.sendSubviewToBack(hostView)
    }
    
    if let fallback = fallbackView {
      fallback.frame = self.bounds
      fallback.layer.cornerRadius = CGFloat(glassProps.cornerRadius)
      fallback.clipsToBounds = true
      
      self.sendSubviewToBack(fallback)
    }
  }
}
