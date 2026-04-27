'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
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
  const [gender, setGender] = useState('Men')
  
  const [progress, setProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  
  const [customers, setCustomers] = useState<any[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState('')
  const [decks, setDecks] = useState<any[]>([])
  const [selectedDeck, setSelectedDeck] = useState('')
  
  const [isImporting, setIsImporting] = useState(false)
  const [importMessage, setImportMessage] = useState<string | null>(null)

  useEffect(() => {
    fetch('https://wovn-garment-catalog.vercel.app/api/customers')
      .then(res => res.json())
      .then(data => {
        const sorted = data.sort((a: any, b: any) => {
          const nameA = a.company || a.name || '';
          const nameB = b.company || b.name || '';
          return nameA.localeCompare(nameB);
        });
        setCustomers(sorted)
      })
      .catch(err => console.error("Failed to fetch customers", err))
  }, [])

  useEffect(() => {
    if (!selectedCustomer) {
      setDecks([]);
      setSelectedDeck('');
      return;
    }
    fetch(`https://wovn-garment-catalog.vercel.app/api/customers/${selectedCustomer}/decks`)
      .then(res => res.json())
      .then(data => setDecks(data))
      .catch(err => console.error("Failed to fetch decks", err))
  }, [selectedCustomer])

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
            gender,
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

  const handleImport = async () => {
    if (!selectedDeck) return;
    setIsImporting(true);
    setImportMessage(null);
    try {
      const res = await fetch(`https://wovn-garment-catalog.vercel.app/api/decks/${selectedDeck}`);
      if (!res.ok) throw new Error('Failed to fetch deck details');
      const data = await res.json();
      
      if (!data.items || data.items.length === 0) {
        throw new Error('Deck is empty or not found');
      }

      let count = 0;
      for (const item of data.items) {
        let garmentType = 'top';
        const itemType = (item.type || '').toLowerCase();
        if (itemType.includes('bottom') || itemType.includes('pants')) garmentType = 'bottom';
        else if (itemType.includes('dress')) garmentType = 'dress';

        let garmentOccasion = 'Casual';
        const itemCat = (item.category || '').toLowerCase();
        if (itemCat.includes('executive') || itemCat.includes('corporate')) garmentOccasion = 'Corporate';
        else if (itemCat.includes('athleisure') || itemCat.includes('active')) garmentOccasion = 'Gym';

        let garmentGender = item.gender || 'Men';
        if (garmentGender === 'Male') garmentGender = 'Men';
        if (garmentGender === 'Female') garmentGender = 'Women';
        if (garmentGender !== 'Men' && garmentGender !== 'Women' && garmentGender !== 'Unisex') {
          garmentGender = 'Men';
        }

        await addDoc(collection(db, 'garments'), {
          name: item.garment_name || 'Imported Garment',
          type: garmentType,
          occasion: garmentOccasion,
          gender: garmentGender,
          color: '#ffffff',
          image: item.mock_image || item.original_image || '',
          createdAt: new Date().toISOString()
        });
        count++;
      }
      setImportMessage(`Successfully imported ${count} garments!`);
      setSelectedDeck('');
    } catch (error: any) {
      console.error(error);
      setImportMessage(`Error: ${error.message}`);
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 p-8 flex flex-col items-center font-sans text-neutral-50 gap-8 py-16">
      <div className="w-full max-w-lg flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight text-white">Portal Dashboard</h1>
        <Link href="/admin/garments" className="text-sm text-neutral-400 hover:text-white hover:underline underline-offset-4 transition-all">
          View All Garments →
        </Link>
      </div>
      
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

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="gender" className="text-neutral-300">Gender</Label>
              <select 
                id="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="flex h-10 w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
              >
                <option value="Men">Men</option>
                <option value="Women">Women</option>
                <option value="Unisex">Unisex</option>
              </select>
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

      <Card className="w-full max-w-lg bg-neutral-900 border-neutral-800 shadow-2xl text-white">
        <CardHeader>
          <CardTitle className="text-xl tracking-wide">Import WOVN Deck</CardTitle>
          <CardDescription className="text-neutral-400">
            Select a customer and deck from the WOVN Garment Catalog to import all mockups automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <Label htmlFor="customer" className="text-neutral-300">Select Customer</Label>
            <select 
              id="customer"
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="flex h-10 w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
            >
              <option value="">-- Choose Customer --</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.company || c.name}</option>)}
            </select>
          </div>

          {selectedCustomer && (
            <div className="flex flex-col gap-3">
              <Label htmlFor="deck" className="text-neutral-300">Select Deck</Label>
              <select 
                id="deck"
                value={selectedDeck}
                onChange={(e) => setSelectedDeck(e.target.value)}
                className="flex h-10 w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
              >
                <option value="">-- Choose Deck --</option>
                {decks.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          )}

          {importMessage && (
            <div className={`p-4 border rounded-md ${importMessage.startsWith('Error') ? 'bg-red-950 border-red-800 text-red-400' : 'bg-green-950 border-green-800 text-green-400'}`}>
              <p className="text-sm font-medium">{importMessage}</p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleImport} 
            disabled={!selectedDeck || isImporting}
            className="w-full bg-white text-black hover:bg-neutral-200 disabled:opacity-50"
          >
            {isImporting ? 'Importing Garments...' : 'Import Deck Garments'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
