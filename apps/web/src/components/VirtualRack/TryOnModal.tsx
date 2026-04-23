'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface TryOnModalProps {
  garmentId: string
  garmentName: string
  onSimulationComplete: (simulatedUrl: string) => void
}

export function TryOnModal({ garmentId, garmentName, onSimulationComplete }: TryOnModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSimulating, setIsSimulating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleTryOn = async () => {
    setIsSimulating(true)
    setError(null)

    try {
      // Assuming a mock logged-in user ID for the sake of the prototype
      const mockUserId = 'user-123'

      const response = await fetch('/api/vto/drape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: mockUserId,
          garmentId: garmentId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to trigger drape simulation')
      }

      // Pass the returned glb/usdz url up to the parent RackScene to render
      onSimulationComplete(data.resultUrl)
      setIsOpen(false)
    } catch (err: any) {
      console.error(err)
      setError(err.message)
    } finally {
      setIsSimulating(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-white text-black hover:bg-neutral-200 mt-4">
          Try On 3D
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-neutral-900 border-neutral-800 text-white shadow-2xl">
        <DialogHeader>
          <DialogTitle className="tracking-wide">Virtual Try-On</DialogTitle>
          <DialogDescription className="text-neutral-400">
            Initiate physics simulation mapping the {garmentName} to your SMPL-X body profile.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          <p className="text-sm text-neutral-300">
            This will dispatch the high-fidelity 3D garment mesh and your body parameters to our secure GPU workers.
          </p>

          {error && (
            <div className="p-3 bg-red-950 border border-red-800 rounded-md">
              <p className="text-red-400 text-sm font-medium">{error}</p>
            </div>
          )}

          <Button 
            onClick={handleTryOn} 
            disabled={isSimulating}
            className="w-full bg-white text-black hover:bg-neutral-200"
          >
            {isSimulating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Simulating Drape...
              </>
            ) : (
              'Run Drape Simulation'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
