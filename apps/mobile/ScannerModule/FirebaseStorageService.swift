import Foundation
// Requires Firebase Storage Swift Package
import FirebaseStorage
import FirebaseCore

class FirebaseStorageService {
    static let shared = FirebaseStorageService()
    
    private let storage: Storage
    
    private init() {
        // Ensure FirebaseApp.configure() is called in your App @main struct
        self.storage = Storage.storage()
    }
    
    func uploadGarmentScan(fileURL: URL, garmentId: String) async throws -> String {
        let storageRef = storage.reference()
        let fileRef = storageRef.child("scans/\(garmentId).usdz")
        
        let metadata = StorageMetadata()
        metadata.contentType = "model/vnd.usdz+zip"
        
        return try await withCheckedThrowingContinuation { continuation in
            fileRef.putFile(from: fileURL, metadata: metadata) { metadata, error in
                if let error = error {
                    continuation.resume(throwing: error)
                    return
                }
                
                // Get the download URL after successful upload
                fileRef.downloadURL { url, error in
                    if let error = error {
                        continuation.resume(throwing: error)
                        return
                    }
                    
                    if let downloadURL = url?.absoluteString {
                        continuation.resume(returning: downloadURL)
                    } else {
                        continuation.resume(throwing: NSError(domain: "FirebaseStorageError", code: 0, userInfo: [NSLocalizedDescriptionKey: "Failed to retrieve download URL"]))
                    }
                }
            }
        }
    }
}
