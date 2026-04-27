import ExpoModulesCore

@available(iOS 17.0, *)
public class RoomScannerModule: Module {
  public func definition() -> ModuleDefinition {
    Name("RoomScanner")

    View(RoomScannerView.self) {
      Events("onModelReady", "onError")

      AsyncFunction("startSession") { (view: RoomScannerView) in
        if #available(iOS 16.0, *) {
          view.startSession()
        }
      }

      AsyncFunction("stopSession") { (view: RoomScannerView) in
        if #available(iOS 16.0, *) {
          view.stopSession()
        }
      }
    }

    View(EnvironmentScannerView.self) {
      Events("onModelReady", "onError", "onProgress")

      AsyncFunction("startSession") { (view: EnvironmentScannerView) in
          view.startSession()
      }

      AsyncFunction("startCapturing") { (view: EnvironmentScannerView) in
          view.startCapturing()
      }

      AsyncFunction("stopSession") { (view: EnvironmentScannerView) in
          view.stopSession()
      }
    }
  }
}
