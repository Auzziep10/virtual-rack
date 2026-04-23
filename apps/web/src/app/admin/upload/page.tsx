'use client'

import React, { useState } from 'react'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { storage } from '@/lib/firebase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function AdminUploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [progress, setProgress] = useState(0)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = () => {
    if (!file) return

    setIsUploading(true)
    const storageRef = ref(storage, `garments/manual_uploads/${file.name}`)
    const uploadTask = uploadBytesResumable(storageRef, file)

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const currentProgress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        setProgress(currentProgress)
      },
      (error) => {
        console.error("Upload failed", error)
        setIsUploading(false)
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((url) => {
          setDownloadUrl(url)
          setIsUploading(false)
        })
      }
    )
  }

  return (
    <div className="min-h-screen bg-neutral-950 p-8 flex items-center justify-center font-sans text-neutral-50">
      <Card className="w-full max-w-lg bg-neutral-900 border-neutral-800 shadow-2xl text-white">
        <CardHeader>
          <CardTitle className="text-xl tracking-wide">Merchant Asset Upload</CardTitle>
          <CardDescription className="text-neutral-400">
            Manually upload .glb or .usdz 3D garment assets directly to your Firebase bucket.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <Label htmlFor="asset" className="text-neutral-300">3D Asset File</Label>
            <Input 
              id="asset" 
              type="file" 
              accept=".glb,.gltf,.usdz" 
              onChange={handleFileChange}
              className="bg-neutral-950 border-neutral-800 text-neutral-300 file:text-white file:bg-neutral-800 file:border-0 file:mr-4 file:py-2 file:px-4 file:rounded-md cursor-pointer"
            />
          </div>

          {progress > 0 && progress < 100 && (
            <div className="w-full bg-neutral-800 rounded-full h-2">
              <div 
                className="bg-white h-2 rounded-full transition-all duration-300" 
                style={{ width: `${progress}%` }} 
              />
            </div>
          )}

          {downloadUrl && (
            <div className="p-4 bg-green-950 border border-green-800 rounded-md">
              <p className="text-green-400 text-sm font-medium">Upload Complete!</p>
              <p className="text-xs text-neutral-400 truncate mt-1">{downloadUrl}</p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleUpload} 
            disabled={!file || isUploading}
            className="w-full bg-white text-black hover:bg-neutral-200 disabled:opacity-50"
          >
            {isUploading ? 'Uploading...' : 'Upload to Firebase'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
