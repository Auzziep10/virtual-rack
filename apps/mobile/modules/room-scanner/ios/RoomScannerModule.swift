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

    AsyncFunction("previewModel") { (urlString: String, promise: Promise) in
      guard let url = URL(string: urlString) else {
        promise.reject("INVALID_URL", "The provided URL is invalid")
        return
      }
      
      // If it's a remote URL, download it first
      if url.scheme == "http" || url.scheme == "https" {
        let task = URLSession.shared.downloadTask(with: url) { localURL, response, error in
          if let error = error {
            promise.reject("DOWNLOAD_ERROR", "Failed to download model: \(error.localizedDescription)")
            return
          }
          guard let localURL = localURL else {
            promise.reject("DOWNLOAD_ERROR", "No local URL returned")
            return
          }
          
          // Determine extension from original URL or default to .usdz
          var ext = "usdz"
          if urlString.lowercased().contains(".obj") { ext = "obj" }
          
          let tempURL = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString + "." + ext)
          do {
            try FileManager.default.moveItem(at: localURL, to: tempURL)
            DispatchQueue.main.async {
              self.presentPreview(url: tempURL)
              promise.resolve(nil)
            }
          } catch {
            promise.reject("MOVE_ERROR", "Failed to move downloaded file: \(error.localizedDescription)")
          }
        }
        task.resume()
      } else {
        // It's already a local file
        DispatchQueue.main.async {
          self.presentPreview(url: url)
          promise.resolve(nil)
        }
      }
    }
  }

  private func presentPreview(url: URL) {
    let previewController = QLPreviewController()
    let dataSource = QuickLookDataSource(url: url)
    previewController.dataSource = dataSource
    
    objc_setAssociatedObject(previewController, "dataSource", dataSource, .OBJC_ASSOCIATION_RETAIN)
    
    if let rootViewController = UIApplication.shared.keyWindow?.rootViewController {
      rootViewController.present(previewController, animated: true, completion: nil)
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
