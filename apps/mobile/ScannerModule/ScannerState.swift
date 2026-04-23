import Foundation
import RealityKit

enum ScannerState {
    case ready
    case capturing
    case reconstructing
    case uploading
    case completed(URL)
    case error(Error)
}

class ScannerViewModel: ObservableObject {
    @Published var state: ScannerState = .ready
    
    func startCapture() {
        state = .capturing
        // ObjectCapture logic
    }
    
    func finishCapture() {
        state = .reconstructing
        // PhotogrammetrySession logic
    }
    
    func uploadModel(fileURL: URL, garmentId: String) async {
        DispatchQueue.main.async {
            self.state = .uploading
        }
        
        do {
            let downloadURL = try await FirebaseStorageService.shared.uploadGarmentScan(fileURL: fileURL, garmentId: garmentId)
            
            // Here you would typically also update your PostgreSQL database 
            // via your API with the new downloadURL
            
            DispatchQueue.main.async {
                self.state = .completed(URL(string: downloadURL) ?? fileURL)
            }
        } catch {
            DispatchQueue.main.async {
                self.state = .error(error)
            }
        }
    }
}
