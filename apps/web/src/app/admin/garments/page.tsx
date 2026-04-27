'use client'

import React, { useState, useEffect } from 'react'
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { PencilIcon, TrashIcon } from 'lucide-react'

const OCCASIONS = ['Casual', 'Corporate', 'Wedding', 'Night Out', 'Gym', 'Mixer', 'Lounge'];
const TYPES = ['top', 'bottom', 'dress'];
const GENDERS = ['Male', 'Female'];

export default function AdminGarmentsPage() {
  const [garments, setGarments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [editGarment, setEditGarment] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)

  const fetchGarments = async () => {
    setLoading(true)
    try {
      const snapshot = await getDocs(collection(db, 'garments'))
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      // sort by newest
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      setGarments(list)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGarments()
  }, [])

  const handleSaveEdit = async () => {
    if (!editGarment) return
    setIsSaving(true)
    try {
      const docRef = doc(db, 'garments', editGarment.id)
      await updateDoc(docRef, {
        name: editGarment.name,
        type: editGarment.type,
        occasion: editGarment.occasion,
        gender: editGarment.gender
      })
      await fetchGarments()
      setEditGarment(null)
    } catch (err) {
      console.error('Failed to update garment', err)
      alert("Failed to update garment")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this garment?')) return
    try {
      await deleteDoc(doc(db, 'garments', id))
      await fetchGarments()
    } catch (err) {
      console.error('Delete failed', err)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 p-8 text-neutral-50 font-sans">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Garment Inventory</h1>
            <p className="text-neutral-400">Manage all uploaded and imported garments here.</p>
          </div>
          <Button onClick={fetchGarments} variant="outline" className="bg-neutral-900 text-white border-neutral-700 hover:bg-neutral-800">Refresh List</Button>
        </div>

        {loading ? (
          <div className="text-neutral-400">Loading garments...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {garments.map(g => (
              <Card key={g.id} className="bg-neutral-900 border-neutral-800 flex flex-col overflow-hidden group">
                <div className="aspect-square w-full bg-neutral-950 relative overflow-hidden">
                  {g.image ? (
                    <img src={g.image} alt={g.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-600">No Image</div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => setEditGarment({...g})}
                      className="p-1.5 bg-black/60 rounded text-white hover:bg-black/90 backdrop-blur-sm transition-colors"
                      title="Edit"
                    >
                      <PencilIcon size={14} />
                    </button>
                    <button 
                      onClick={() => handleDelete(g.id)}
                      className="p-1.5 bg-red-950/80 rounded text-red-400 hover:bg-red-900 hover:text-white backdrop-blur-sm transition-colors"
                      title="Delete"
                    >
                      <TrashIcon size={14} />
                    </button>
                  </div>
                </div>
                <CardContent className="p-4 flex flex-col gap-2 flex-1">
                  <h3 className="font-semibold text-white truncate" title={g.name}>{g.name}</h3>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 uppercase tracking-wider">{g.type}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-950/50 text-blue-300 uppercase tracking-wider border border-blue-900/50">{g.gender}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/50 text-emerald-300 uppercase tracking-wider border border-emerald-900/50">{g.occasion}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
            {garments.length === 0 && <p className="text-neutral-500 col-span-full">No garments found in database.</p>}
          </div>
        )}
      </div>

      <Dialog open={!!editGarment} onOpenChange={(open) => !open && setEditGarment(null)}>
        {editGarment && (
          <DialogContent className="bg-neutral-900 border-neutral-800 text-neutral-50 sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl">Edit Garment</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-name" className="text-neutral-300">Name</Label>
                <Input 
                  id="edit-name" 
                  value={editGarment.name}
                  onChange={(e) => setEditGarment({...editGarment, name: e.target.value})}
                  className="bg-neutral-950 border-neutral-800 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="edit-type" className="text-neutral-300">Type</Label>
                  <select 
                    id="edit-type"
                    value={editGarment.type}
                    onChange={(e) => setEditGarment({...editGarment, type: e.target.value})}
                    className="flex h-10 w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
                  >
                    {TYPES.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="edit-gender" className="text-neutral-300">Gender</Label>
                  <select 
                    id="edit-gender"
                    value={editGarment.gender}
                    onChange={(e) => setEditGarment({...editGarment, gender: e.target.value})}
                    className="flex h-10 w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
                  >
                    {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-occasion" className="text-neutral-300">Occasion Category</Label>
                <select 
                  id="edit-occasion"
                  value={editGarment.occasion}
                  onChange={(e) => setEditGarment({...editGarment, occasion: e.target.value})}
                  className="flex h-10 w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
                >
                  {OCCASIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" className="text-neutral-300 hover:text-white hover:bg-neutral-800" onClick={() => setEditGarment(null)}>Cancel</Button>
              <Button onClick={handleSaveEdit} disabled={isSaving} className="bg-white text-black hover:bg-neutral-200">{isSaving ? 'Saving...' : 'Save Changes'}</Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}
