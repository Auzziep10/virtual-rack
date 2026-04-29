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
      .background(.ultraThinMaterial)
      .environment(\.colorScheme, props.tint == "dark" ? .dark : .light)
      .cornerRadius(CGFloat(props.cornerRadius))
      .edgesIgnoringSafeArea(.all)
  }
}

public class LiquidGlassNativeView: ExpoView {
  let glassProps = GlassProps()
  var hostingController: UIViewController?

  public required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    self.backgroundColor = .clear
    self.clipsToBounds = true
    
    setupView()
  }

  private func setupView() {
    if #available(iOS 15.0, *) {
      let swiftUIView = SwiftUILiquidGlassView(props: glassProps)
      let host = UIHostingController(rootView: swiftUIView)
      host.view.backgroundColor = .clear
      
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
