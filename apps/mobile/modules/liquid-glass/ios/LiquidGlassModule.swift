import ExpoModulesCore

public class LiquidGlassModule: Module {
  public func definition() -> ModuleDefinition {
    Name("LiquidGlass")

    View(LiquidGlassNativeView.self) {
      Prop("cornerRadius") { (view: LiquidGlassNativeView, cornerRadius: Double?) in
        view.glassProps.cornerRadius = cornerRadius ?? 0.0
      }
      
      Prop("tint") { (view: LiquidGlassNativeView, tint: String?) in
        view.glassProps.tint = tint ?? "light"
      }
      
      Prop("interactive") { (view: LiquidGlassNativeView, interactive: Bool?) in
        view.glassProps.interactive = interactive ?? false
      }
    }
  }
}
