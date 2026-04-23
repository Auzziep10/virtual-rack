import SwiftUI
import RealityKit

@available(iOS 17.0, *)
struct ScannerView: View {
    @StateObject private var viewModel = ScannerViewModel()
    @State private var session: ObjectCaptureSession?
    
    var body: some View {
        ZStack {
            if let session = session {
                ObjectCaptureView(session: session)
                    .edgesIgnoringSafeArea(.all)
            }
            
            VStack {
                Spacer()
                
                statusOverlay
                
                controlButtons
            }
            .padding()
        }
        .onAppear {
            self.session = ObjectCaptureSession()
        }
    }
    
    private var statusOverlay: some View {
        Text(statusText)
            .padding()
            .background(Color.black.opacity(0.7))
            .foregroundColor(.white)
            .cornerRadius(10)
    }
    
    private var statusText: String {
        switch viewModel.state {
        case .ready: return "Ready to Scan"
        case .capturing: return "Capturing..."
        case .reconstructing: return "Reconstructing 3D Model..."
        case .uploading: return "Uploading to Firebase..."
        case .completed: return "Upload Complete!"
        case .error(let err): return "Error: \(err.localizedDescription)"
        }
    }
    
    private var controlButtons: some View {
        HStack {
            if viewModel.state == .ready {
                Button(action: {
                    var configuration = ObjectCaptureSession.Configuration()
                    // Enables bounding box interactions to specify the capture volume
                    configuration.isUserCompletedBoundingBoxEnabled = true
                    
                    session?.start(imagesDirectory: getDocumentsDirectory().appendingPathComponent("Scans"),
                                   configuration: configuration)
                    viewModel.startCapture()
                }) {
                    Text("Start Scan")
                        .padding()
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .clipShape(Capsule())
                }
            } else if viewModel.state == .capturing {
                Button(action: {
                    session?.finish()
                    viewModel.finishCapture()
                    // Reconstruct logic would trigger here
                }) {
                    Text("Finish Capture")
                        .padding()
                        .background(Color.red)
                        .foregroundColor(.white)
                        .clipShape(Capsule())
                }
            }
        }
    }
    
    private func getDocumentsDirectory() -> URL {
        FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
    }
}
