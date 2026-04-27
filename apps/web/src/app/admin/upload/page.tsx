'use client'

import React, { useState } from 'react'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { collection, addDoc } from 'firebase/firestore'
import { storage, db } from '@/lib/firebase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const OCCASIONS = ['Casual', 'Corporate', 'Wedding', 'Night Out', 'Gym', 'Mixer', 'Lounge'];
const TYPES = ['top', 'bottom', 'dress'];

export default function AdminUploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [type, setType] = useState('top')
  const [occasion, setOccasion] = useState('Casual')
  const [colorHex, setColorHex] = useState('#ffffff')
  
  const [progress, setProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file || !name) return

    setIsUploading(true)
    setSuccessMessage(null)
    const storageRef = ref(storage, `garments/images/${Date.now()}_${file.name}`)
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
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref)
          
          // Save metadata to Firestore
          await addDoc(collection(db, 'garments'), {
            name,
            type,
            occasion,
            color: colorHex,
            image: downloadUrl,
            createdAt: new Date().toISOString()
          })

          setSuccessMessage(`Successfully uploaded ${name}!`)
          setFile(null)
          setName('')
          setProgress(0)
        } catch (error) {
          console.error("Error saving to Firestore", error)
        } finally {
          setIsUploading(false)
        }
      }
    )
  }

  return (
    <div className="min-h-screen bg-neutral-950 p-8 flex items-center justify-center font-sans text-neutral-50">
      <Card className="w-full max-w-lg bg-neutral-900 border-neutral-800 shadow-2xl text-white">
        <CardHeader>
          <CardTitle className="text-xl tracking-wide">Garment Upload Portal</CardTitle>
          <CardDescription className="text-neutral-400">
            Upload mock garments and their metadata to the database.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <Label htmlFor="name" className="text-neutral-300">Garment Name</Label>
            <Input 
              id="name" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Beige Sweater"
              className="bg-neutral-950 border-neutral-800 text-neutral-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="type" className="text-neutral-300">Type</Label>
              <select 
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="flex h-10 w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
              >
                {TYPES.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
              </select>
            </div>
            
            <div className="flex flex-col gap-3">
              <Label htmlFor="color" className="text-neutral-300">Brand Color Hex</Label>
              <div className="flex items-center gap-2">
                <input 
                  type="color" 
                  value={colorHex}
                  onChange={(e) => setColorHex(e.target.value)}
                  className="h-10 w-10 bg-transparent rounded cursor-pointer"
                />
                <Input 
                  id="color" 
                  value={colorHex}
                  onChange={(e) => setColorHex(e.target.value)}
                  className="bg-neutral-950 border-neutral-800 text-neutral-300 flex-1"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Label htmlFor="occasion" className="text-neutral-300">Occasion Category</Label>
            <select 
              id="occasion"
              value={occasion}
              onChange={(e) => setOccasion(e.target.value)}
              className="flex h-10 w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
            >
              {OCCASIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-3">
            <Label htmlFor="asset" className="text-neutral-300">2D Image (PNG/JPG)</Label>
            <Input 
              id="asset" 
              type="file" 
              accept="image/*" 
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

          {successMessage && (
            <div className="p-4 bg-green-950 border border-green-800 rounded-md">
              <p className="text-green-400 text-sm font-medium">{successMessage}</p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleUpload} 
            disabled={!file || !name || isUploading}
            className="w-full bg-white text-black hover:bg-neutral-200 disabled:opacity-50"
          >
            {isUploading ? 'Uploading...' : 'Save Garment'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
