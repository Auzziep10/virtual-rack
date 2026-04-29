import ExpoModulesCore
import SwiftUI
import UIKit

// Observable object to pass props into SwiftUI
class GlassProps: ObservableObject {
  @Published var cornerRadius: Double = 0.0
  @Published var tint: String = "light"
  @Published var interactive: Bool = false
}

// The SwiftUI View that utilizes the true Liquid Glass API
@available(iOS 15.0, *)
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
@available(iOS 15.0, *)
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

  public required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    self.backgroundColor = .clear
    self.isOpaque = false
    self.clipsToBounds = true
    
    setupView()
  }

  private func setupView() {
    if #available(iOS 15.0, *) {
      let swiftUIView = SwiftUILiquidGlassView(props: glassProps)
      let host = UIHostingController(rootView: swiftUIView)
      host.view.backgroundColor = .clear
      host.view.isOpaque = false
      
      self.addSubview(host.view)
      self.hostingController = host
    }
  }

  public func updateFallbackView() {
    // No longer needed as SwiftUI handles reactive state dynamically
  }

  public override func layoutSubviews() {
    super.layoutSubviews()
    
    if let hostView = hostingController?.view {
      hostView.frame = self.bounds
      self.sendSubviewToBack(hostView)
    }
  }
}
