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

const OCCASIONS = ['Casual', 'Corporate', 'Wedding', 'Night Out', 'Gym', 'Mixer', 'Lounge', 'Swimwear'];
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
  
  const [deckItems, setDeckItems] = useState<any[]>([])
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())

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
      setDeckItems([]);
      setSelectedItems(new Set());
      return;
    }
    fetch(`https://wovn-garment-catalog.vercel.app/api/customers/${selectedCustomer}/decks`)
      .then(res => res.json())
      .then(data => setDecks(data))
      .catch(err => console.error("Failed to fetch decks", err))
  }, [selectedCustomer])

  useEffect(() => {
    if (!selectedDeck) {
      setDeckItems([]);
      setSelectedItems(new Set());
      return;
    }
    fetch(`https://wovn-garment-catalog.vercel.app/api/decks/${selectedDeck}`)
      .then(res => res.json())
      .then(data => {
        if (data.items && data.items.length > 0) {
          const itemsWithIds = data.items.map((i: any, idx: number) => ({...i, importId: i.id || String(idx)}));
          setDeckItems(itemsWithIds);
          setSelectedItems(new Set(itemsWithIds.map((i: any) => i.importId)));
        } else {
          setDeckItems([]);
          setSelectedItems(new Set());
        }
      })
      .catch(err => console.error("Failed to fetch deck items", err));
  }, [selectedDeck])

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
    if (!selectedDeck || selectedItems.size === 0) return;
    setIsImporting(true);
    setImportMessage(null);
    try {
      const itemsToImport = deckItems.filter(item => selectedItems.has(item.importId));
      if (itemsToImport.length === 0) {
        throw new Error('No items selected');
      }

      let count = 0;
      for (const item of itemsToImport) {
        let garmentType = 'top';
        const itemType = (item.type || '').toLowerCase();
        if (itemType.includes('bottom') || itemType.includes('pants')) garmentType = 'bottom';
        else if (itemType.includes('dress')) garmentType = 'dress';

        let garmentOccasion = 'Casual';
        const itemCat = (item.category || '').toLowerCase();
        if (itemCat.includes('executive') || itemCat.includes('corporate')) garmentOccasion = 'Corporate';
        else if (itemCat.includes('athleisure') || itemCat.includes('active')) garmentOccasion = 'Gym';
        else if (itemCat.includes('swim') || itemCat.includes('beach')) garmentOccasion = 'Swimwear';

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
      setSelectedItems(new Set());
    } catch (error: any) {
      console.error(error);
      setImportMessage(`Error: ${error.message}`);
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-8 flex flex-col items-center font-sans text-neutral-900 gap-8 py-16">
      <div className="w-full max-w-lg flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Portal Dashboard</h1>
        <Link href="/admin/garments" className="text-sm text-neutral-500 hover:text-neutral-900 hover:underline underline-offset-4 transition-all">
          View All Garments →
        </Link>
      </div>
      
      <Card className="w-full max-w-lg bg-white border-neutral-200 shadow-xl text-neutral-900">
        <CardHeader>
          <CardTitle className="text-xl tracking-wide">Garment Upload Portal</CardTitle>
          <CardDescription className="text-neutral-500">
            Upload mock garments and their metadata to the database.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <Label htmlFor="name" className="text-neutral-700 font-medium">Garment Name</Label>
            <Input 
              id="name" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Beige Sweater"
              className="bg-white border-neutral-300 text-neutral-900 focus-visible:ring-neutral-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="type" className="text-neutral-700 font-medium">Type</Label>
              <select 
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
              >
                {TYPES.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
              </select>
            </div>
            
            <div className="flex flex-col gap-3">
              <Label htmlFor="color" className="text-neutral-700 font-medium">Brand Color Hex</Label>
              <div className="flex items-center gap-2">
                <input 
                  type="color" 
                  value={colorHex}
                  onChange={(e) => setColorHex(e.target.value)}
                  className="h-10 w-10 bg-transparent rounded cursor-pointer border border-neutral-200"
                />
                <Input 
                  id="color" 
                  value={colorHex}
                  onChange={(e) => setColorHex(e.target.value)}
                  className="bg-white border-neutral-300 text-neutral-900 flex-1 focus-visible:ring-neutral-400"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="gender" className="text-neutral-700 font-medium">Gender</Label>
              <select 
                id="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
              >
                <option value="Men">Men</option>
                <option value="Women">Women</option>
                <option value="Unisex">Unisex</option>
              </select>
            </div>

            <div className="flex flex-col gap-3">
              <Label htmlFor="occasion" className="text-neutral-700 font-medium">Occasion Category</Label>
              <select 
                id="occasion"
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
                className="flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
              >
                {OCCASIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Label htmlFor="asset" className="text-neutral-700 font-medium">2D Image (PNG/JPG)</Label>
            <Input 
              id="asset" 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange}
              className="bg-white border-neutral-300 text-neutral-900 file:text-neutral-900 file:bg-neutral-100 file:border-0 file:mr-4 file:py-2 file:px-4 file:rounded-md cursor-pointer hover:file:bg-neutral-200"
            />
          </div>

          {progress > 0 && progress < 100 && (
            <div className="w-full bg-neutral-200 rounded-full h-2">
              <div 
                className="bg-neutral-900 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${progress}%` }} 
              />
            </div>
          )}

          {successMessage && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-700 text-sm font-medium">{successMessage}</p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleUpload} 
            disabled={!file || !name || isUploading}
            className="w-full bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            {isUploading ? 'Uploading...' : 'Save Garment'}
          </Button>
        </CardFooter>
      </Card>

      <Card className="w-full max-w-lg bg-white border-neutral-200 shadow-xl text-neutral-900">
        <CardHeader>
          <CardTitle className="text-xl tracking-wide">Import WOVN Deck</CardTitle>
          <CardDescription className="text-neutral-500">
            Select a customer and deck from the WOVN Garment Catalog to import all mockups automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <Label htmlFor="customer" className="text-neutral-700 font-medium">Select Customer</Label>
            <select 
              id="customer"
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
            >
              <option value="">-- Choose Customer --</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.company || c.name}</option>)}
            </select>
          </div>

          {selectedCustomer && (
            <div className="flex flex-col gap-3">
              <Label htmlFor="deck" className="text-neutral-700 font-medium">Select Deck</Label>
              <select 
                id="deck"
                value={selectedDeck}
                onChange={(e) => setSelectedDeck(e.target.value)}
                className="flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
              >
                <option value="">-- Choose Deck --</option>
                {decks.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          )}

          {deckItems.length > 0 ? (
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <Label className="text-neutral-700 font-medium">Select Items to Import</Label>
                <button 
                  onClick={() => {
                    if (selectedItems.size === deckItems.length) {
                      setSelectedItems(new Set());
                    } else {
                      setSelectedItems(new Set(deckItems.map(i => i.importId)));
                    }
                  }}
                  className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                >
                  {selectedItems.size === deckItems.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-80 overflow-y-auto p-3 border border-neutral-200 rounded-md bg-neutral-50/50">
                {deckItems.map(item => (
                  <div 
                    key={item.importId} 
                    className={`flex flex-col gap-2 p-2 rounded-lg border relative cursor-pointer transition-all ${selectedItems.has(item.importId) ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-300 shadow-sm' : 'bg-white border-neutral-200 hover:border-neutral-300 hover:shadow-sm'}`}
                    onClick={() => {
                      const newSet = new Set(selectedItems);
                      if (newSet.has(item.importId)) newSet.delete(item.importId);
                      else newSet.add(item.importId);
                      setSelectedItems(newSet);
                    }}
                  >
                    <input 
                      type="checkbox" 
                      checked={selectedItems.has(item.importId)}
                      readOnly
                      className="absolute top-3 right-3 z-10 w-4 h-4 cursor-pointer accent-blue-600 rounded"
                    />
                    <div className="aspect-square bg-neutral-100 rounded-md overflow-hidden pointer-events-none">
                      {(item.mock_image || item.original_image) ? (
                        <img src={item.mock_image || item.original_image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-neutral-400">No Image</div>
                      )}
                    </div>
                    <p className="text-xs font-medium text-neutral-900 truncate px-1" title={item.garment_name}>{item.garment_name || 'Unnamed Garment'}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : selectedDeck ? (
            <div className="p-6 border border-dashed border-neutral-300 rounded-md bg-neutral-50 text-neutral-500 text-center text-sm flex flex-col items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/-2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-folder-open text-neutral-400"><path d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2"/></svg>
              <p>This deck has no items.</p>
            </div>
          ) : null}

          {importMessage && (
            <div className={`p-4 border rounded-md ${importMessage.startsWith('Error') ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
              <p className="text-sm font-medium">{importMessage}</p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleImport} 
            disabled={!selectedDeck || selectedItems.size === 0 || isImporting}
            className="w-full bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            {isImporting ? 'Importing Garments...' : `Import ${selectedItems.size > 0 ? selectedItems.size : ''} Selected Garment${selectedItems.size === 1 ? '' : 's'}`}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
