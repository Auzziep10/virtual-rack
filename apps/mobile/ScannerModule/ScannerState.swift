import Foundation
import RealityKit

enum ScannerState: Equatable {
    case ready
    case capturing
    case reconstructing(Double)
    case uploading
    case completed(URL)
    case error(String)
}

class ScannerViewModel: ObservableObject {
    @Published var state: ScannerState = .ready
    private var photogrammetrySession: PhotogrammetrySession?
    
    func startCapture() {
        state = .capturing
    }
    
    func finishCapture(imagesDirectory: URL) {
        state = .reconstructing(0.0)
        
        Task {
            await processReconstruction(imagesDirectory: imagesDirectory)
        }
    }
    
    private func processReconstruction(imagesDirectory: URL) async {
        do {
            let session = try PhotogrammetrySession(input: imagesDirectory)
            self.photogrammetrySession = session
            
            let outputURL = FileManager.default.temporaryDirectory
                .appendingPathComponent(UUID().uuidString)
                .appendingPathExtension("usdz")
            
            let request = PhotogrammetrySession.Request.modelFile(url: outputURL, detail: .reduced)
            try session.process(requests: [request])
            
            for try await output in session.outputs {
                switch output {
                case .processingComplete:
                    print("Processing Complete")
                case .requestProgress(_, let fractionComplete):
                    DispatchQueue.main.async {
                        self.state = .reconstructing(fractionComplete)
                    }
                case .requestComplete(_, _):
                    // Photogrammetry is done, now upload the model to Firebase
                    let garmentId = UUID().uuidString
                    await self.uploadModel(fileURL: outputURL, garmentId: garmentId)
                case .requestError(_, let error):
                    DispatchQueue.main.async { self.state = .error(error.localizedDescription) }
                default:
                    break
                }
            }
        } catch {
            DispatchQueue.main.async { self.state = .error(error.localizedDescription) }
        }
    }
    
    func uploadModel(fileURL: URL, garmentId: String) async {
        DispatchQueue.main.async {
            self.state = .uploading
        }
        
        do {
            let downloadURL = try await FirebaseStorageService.shared.uploadGarmentScan(fileURL: fileURL, garmentId: garmentId)
            
            // Note: Add logic here later to ping the Next.js API to create the Garment entry in Supabase!
            
            DispatchQueue.main.async {
                self.state = .completed(URL(string: downloadURL) ?? fileURL)
            }
        } catch {
            DispatchQueue.main.async {
                self.state = .error(error.localizedDescription)
            }
        }
    }
}
