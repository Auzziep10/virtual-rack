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

const OCCASIONS = ['Casual', 'Corporate', 'Wedding', 'Night Out', 'Gym', 'Mixer', 'Lounge', 'Swimwear'];
const TYPES = ['top', 'bottom', 'dress'];
const GENDERS = ['Men', 'Women', 'Unisex'];

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

  const fixLegacyGenders = async () => {
    setIsSaving(true);
    let count = 0;
    try {
      for (const g of garments) {
        if (g.gender === 'Male' || g.gender === 'Female') {
          const newGender = g.gender === 'Male' ? 'Men' : 'Women';
          await updateDoc(doc(db, 'garments', g.id), { gender: newGender });
          count++;
        }
      }
      if (count > 0) {
        alert(`Fixed ${count} legacy garment genders!`);
        await fetchGarments();
      } else {
        alert("All garments are already up to date.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to fix legacy genders.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-8 text-neutral-900 font-sans">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 mb-2">Garment Inventory</h1>
            <p className="text-neutral-500">Manage all uploaded and imported garments here.</p>
          </div>
          <div className="flex gap-4">
            <Button onClick={fixLegacyGenders} disabled={isSaving} variant="outline" className="bg-white text-blue-600 border-blue-200 hover:bg-blue-50">
              Fix Legacy Genders
            </Button>
            <Button onClick={fetchGarments} variant="outline" className="bg-white text-neutral-900 border-neutral-300 hover:bg-neutral-100">Refresh List</Button>
          </div>
        </div>

        {loading ? (
          <div className="text-neutral-500">Loading garments...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {garments.map(g => (
              <Card key={g.id} className="bg-white border-neutral-200 flex flex-col overflow-hidden group shadow-sm hover:shadow-md transition-shadow">
                <div className="aspect-square w-full bg-neutral-100 relative overflow-hidden">
                  {g.image ? (
                    <img src={g.image} alt={g.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-400">No Image</div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => setEditGarment({...g})}
                      className="p-1.5 bg-white/80 rounded text-neutral-700 hover:bg-white hover:text-neutral-900 backdrop-blur-sm transition-colors border border-neutral-200/50 shadow-sm"
                      title="Edit"
                    >
                      <PencilIcon size={14} />
                    </button>
                    <button 
                      onClick={() => handleDelete(g.id)}
                      className="p-1.5 bg-white/80 rounded text-red-600 hover:bg-red-50 hover:text-red-700 backdrop-blur-sm transition-colors border border-red-100/50 shadow-sm"
                      title="Delete"
                    >
                      <TrashIcon size={14} />
                    </button>
                  </div>
                </div>
                <CardContent className="p-4 flex flex-col gap-2 flex-1">
                  <h3 className="font-semibold text-neutral-900 truncate" title={g.name}>{g.name}</h3>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 uppercase tracking-wider border border-neutral-200">{g.type}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 uppercase tracking-wider border border-blue-200">{g.gender}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 uppercase tracking-wider border border-emerald-200">{g.occasion}</span>
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
          <DialogContent className="bg-white border-neutral-200 text-neutral-900 sm:max-w-md shadow-lg">
            <DialogHeader>
              <DialogTitle className="text-xl">Edit Garment</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-name" className="text-neutral-700 font-medium">Name</Label>
                <Input 
                  id="edit-name" 
                  value={editGarment.name}
                  onChange={(e) => setEditGarment({...editGarment, name: e.target.value})}
                  className="bg-white border-neutral-300 text-neutral-900 focus-visible:ring-neutral-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="edit-type" className="text-neutral-700 font-medium">Type</Label>
                  <select 
                    id="edit-type"
                    value={editGarment.type}
                    onChange={(e) => setEditGarment({...editGarment, type: e.target.value})}
                    className="flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
                  >
                    {TYPES.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="edit-gender" className="text-neutral-700 font-medium">Gender</Label>
                  <select 
                    id="edit-gender"
                    value={editGarment.gender}
                    onChange={(e) => setEditGarment({...editGarment, gender: e.target.value})}
                    className="flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
                  >
                    {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-occasion" className="text-neutral-700 font-medium">Occasion Category</Label>
                <select 
                  id="edit-occasion"
                  value={editGarment.occasion}
                  onChange={(e) => setEditGarment({...editGarment, occasion: e.target.value})}
                  className="flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
                >
                  {OCCASIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" className="text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100" onClick={() => setEditGarment(null)}>Cancel</Button>
              <Button onClick={handleSaveEdit} disabled={isSaving} className="bg-neutral-900 text-white hover:bg-neutral-800">{isSaving ? 'Saving...' : 'Save Changes'}</Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}
