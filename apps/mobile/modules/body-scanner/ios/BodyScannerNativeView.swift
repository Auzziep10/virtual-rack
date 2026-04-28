import ExpoModulesCore
import RealityKit
import SwiftUI
import os

@available(iOS 18.0, *)
class BodyScannerNativeView: ExpoView {
    let onModelReady = EventDispatcher()
    let onError = EventDispatcher()
    let onProgress = EventDispatcher()

    private var hostingController: UIHostingController<AnyView>?
    private var session: ObjectCaptureSession?
    private var scanDir: URL?
    private var progressTask: Task<Void, Never>?

    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)
        clipsToBounds = true
    }

    public func startSession() {
        DispatchQueue.main.async {
            guard ObjectCaptureSession.isSupported else {
                self.onError(["message": "Object Capture is not supported on this device. Requires LiDAR."])
                return
            }

            let newSession = ObjectCaptureSession()
            let configuration = ObjectCaptureSession.Configuration()
            
            let dir = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
            try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
            self.scanDir = dir
            self.session = newSession
            
            newSession.start(imagesDirectory: dir, configuration: configuration)
            
            Task {
                for await state in newSession.stateUpdates {
                    if case .completed = state {
                        self.processPhotogrammetry()
                    } else if case .failed(let error) = state {
                        self.onError(["message": "Capture failed: \(error.localizedDescription)"])
                    }
                }
            }

            let objectCaptureView = ObjectCaptureView(session: newSession)
                .hideObjectReticle()
            
            let hc = UIHostingController(rootView: AnyView(objectCaptureView))
            hc.view.frame = self.bounds
            hc.view.backgroundColor = .clear
            self.insertSubview(hc.view, at: 0)
            self.hostingController = hc
        }
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        hostingController?.view.frame = bounds
    }

    public func startCapturing() {
        DispatchQueue.main.async {
            guard let session = self.session else { return }
            session.startCapturing()
        }
    }

    public func stopSession() {
        DispatchQueue.main.async {
            guard let session = self.session else { return }
            
            self.hostingController?.view.removeFromSuperview()
            self.hostingController = nil
            
            session.finish()
        }
    }

    private func processPhotogrammetry() {
        guard let dir = scanDir else { return }
        
        let documentDir = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
        let usdzFileURL = documentDir.appendingPathComponent("BodyScan_\(UUID().uuidString).usdz")
        
        do {
            let request = PhotogrammetrySession.Request.modelFile(url: usdzFileURL)
            var config = PhotogrammetrySession.Configuration()
            config.isObjectMaskingEnabled = false
            let pSession = try PhotogrammetrySession(input: dir, configuration: config)
            
            Task {
                do {
                    for try await output in pSession.outputs {
                        switch output {
                        case .processingComplete:
                            DispatchQueue.main.async {
                                self.hostingController?.view.removeFromSuperview()
                                self.hostingController = nil
                                self.onModelReady([
                                    "uri": usdzFileURL.absoluteString,
                                    "path": usdzFileURL.path
                                ])
                            }
                        case .requestError(_, let error):
                            DispatchQueue.main.async {
                                self.onError(["message": "Photogrammetry failed: \(error.localizedDescription)"])
                            }
                        case .requestProgress(_, let fractionComplete):
                            DispatchQueue.main.async {
                                self.onProgress(["progress": fractionComplete])
                            }
                        case .processingCancelled:
                            DispatchQueue.main.async {
                                self.onError(["message": "Processing was cancelled."])
                            }
                        default:
                            break
                        }
                    }
                } catch {
                    DispatchQueue.main.async {
                        self.onError(["message": "Photogrammetry output error: \(error.localizedDescription)"])
                    }
                }
            }
            try pSession.process(requests: [request])
        } catch {
            DispatchQueue.main.async {
                self.onError(["message": "Photogrammetry error: \(error.localizedDescription)"])
            }
        }
    }
}
