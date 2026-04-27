import ExpoModulesCore
import QuickLook

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

    AsyncFunction("previewModel") { (url: String) in
      DispatchQueue.main.async {
        if let fileUrl = URL(string: url) {
          let previewController = QLPreviewController()
          let dataSource = QuickLookDataSource(url: fileUrl)
          previewController.dataSource = dataSource
          
          objc_setAssociatedObject(previewController, "dataSource", dataSource, .OBJC_ASSOCIATION_RETAIN)
          
          if let rootViewController = UIApplication.shared.keyWindow?.rootViewController {
            rootViewController.present(previewController, animated: true, completion: nil)
          }
        }
      }
    }
  }
}

class QuickLookDataSource: NSObject, QLPreviewControllerDataSource {
  let url: URL

  init(url: URL) {
    self.url = url
  }

  func numberOfPreviewItems(in controller: QLPreviewController) -> Int {
    return 1
  }

  func previewController(_ controller: QLPreviewController, previewItemAt index: Int) -> QLPreviewItem {
    return url as QLPreviewItem
  }
}
