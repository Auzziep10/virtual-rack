import ExpoModulesCore
import RoomPlan
import UIKit

@available(iOS 16.0, *)
class BodyScannerRoomView: ExpoView, RoomCaptureViewDelegate, RoomCaptureSessionDelegate {
  private var roomCaptureView: RoomCaptureView!
  private var finalResult: CapturedRoom?
  
  let onModelReady = EventDispatcher()
  let onError = EventDispatcher()

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    clipsToBounds = true
    
    setupRoomCaptureView()
  }

  private func setupRoomCaptureView() {
    roomCaptureView = RoomCaptureView(frame: bounds)
    roomCaptureView.captureSession.delegate = self
    roomCaptureView.delegate = self
    
    insertSubview(roomCaptureView, at: 0)
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    roomCaptureView.frame = bounds
  }

  public func startSession() {
    var configuration = RoomCaptureSession.Configuration()
    if #available(iOS 17.0, *) {
      // In iOS 17 we can capture materials
      // configuration.isPhotographySupported = true 
    }
    roomCaptureView.captureSession.run(configuration: configuration)
  }

  public func stopSession() {
    roomCaptureView.captureSession.stop()
  }
  
  // MARK: - RoomCaptureViewDelegate
  func captureView(shouldPresent roomDataForProcessing: CapturedRoomData, error: Error?) -> Bool {
    return true
  }

  func captureView(didPresent processedResult: CapturedRoom, error: Error?) {
    if let error = error {
      onError(["message": error.localizedDescription])
      return
    }
    
    self.finalResult = processedResult
    
    // Export the result to USDZ
    do {
      let documentDir = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
      let fileName = "RoomScan_\(UUID().uuidString).usdz"
      let destinationUrl = documentDir.appendingPathComponent(fileName)
      
      try processedResult.export(to: destinationUrl)
      
      onModelReady([
        "uri": destinationUrl.absoluteString,
        "path": destinationUrl.path
      ])
    } catch {
      onError(["message": "Failed to export scan: \(error.localizedDescription)"])
    }
  }
}
