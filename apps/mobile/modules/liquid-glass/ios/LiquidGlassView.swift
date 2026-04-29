import ExpoModulesCore
import UIKit

public class LiquidGlassNativeView: ExpoView {
  var visualEffectView: UIVisualEffectView?
  
  var cornerRadius: Double = 0.0 {
    didSet {
      updateView()
    }
  }
  
  var tint: String = "light" {
    didSet {
      updateView()
    }
  }
  
  var interactive: Bool = false

  public required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    self.backgroundColor = .clear
    self.isOpaque = false
    self.clipsToBounds = true
    
    setupView()
  }

  private func setupView() {
    let effectView = UIVisualEffectView()
    effectView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    effectView.isOpaque = false
    
    self.addSubview(effectView)
    self.visualEffectView = effectView
    
    updateView()
  }
  
  private func updateView() {
    guard let effectView = visualEffectView else { return }
    
    let blurStyle: UIBlurEffect.Style
    if tint == "dark" {
      blurStyle = .systemUltraThinMaterialDark
    } else if tint == "orange" {
      blurStyle = .systemUltraThinMaterial
    } else {
      blurStyle = .systemUltraThinMaterialLight
    }
    
    effectView.effect = UIBlurEffect(style: blurStyle)
    effectView.layer.cornerRadius = CGFloat(cornerRadius)
    effectView.clipsToBounds = true
  }

  public override func layoutSubviews() {
    super.layoutSubviews()
    if let effectView = visualEffectView {
      effectView.frame = self.bounds
    }
  }

  public override func didAddSubview(_ subview: UIView) {
    super.didAddSubview(subview)
    if let effectView = visualEffectView, subview != effectView {
      self.sendSubviewToBack(effectView)
    }
  }
}
