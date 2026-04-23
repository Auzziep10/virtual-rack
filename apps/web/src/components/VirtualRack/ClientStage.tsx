'use client'

import React, { useState } from 'react'
import RackScene from './RackScene'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { TryOnModal } from './TryOnModal'

export default function ClientStage({ displayGarments }: { displayGarments: any[] }) {
  // We can track the simulated drape URL to render in the scene instead of the raw garments
  const [simulatedUrl, setSimulatedUrl] = useState<string | null>(null)

  return (
    <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* 3D Staging Area */}
      <section className="lg:col-span-2">
        <Card className="bg-neutral-900 border-neutral-800 overflow-hidden shadow-2xl">
          <CardHeader>
            <CardTitle className="text-xl font-medium tracking-wide">3D Fitting Stage</CardTitle>
            <CardDescription className="text-neutral-500">
              {simulatedUrl ? 'Viewing Simulated Drape.' : 'Select a garment to try on.'}
            </CardDescription>
          </CardHeader>
          <div className="p-0">
            {simulatedUrl ? (
              <RackScene garments={[{ id: 'sim', assetGlbUrl: simulatedUrl }]} />
            ) : (
              <RackScene garments={displayGarments} />
            )}
          </div>
        </Card>
      </section>

      {/* Sidebar / Garment List */}
      <aside className="flex flex-col gap-6">
        <h2 className="text-lg font-medium tracking-wide border-b border-neutral-800 pb-4">Selected Items</h2>
        <div className="flex flex-col gap-4">
          {displayGarments.map((g) => (
            <Card key={g.id} className="bg-neutral-900 border-neutral-800 transition-all group">
              <CardHeader className="p-4">
                <CardTitle className="text-md font-medium text-neutral-200">
                  {g.name}
                </CardTitle>
                <CardDescription className="text-neutral-500 text-xs flex gap-2 mt-2">
                  {g.occasionTags.map((tag: string) => (
                    <span key={tag} className="px-2 py-1 bg-neutral-800 rounded-md text-[10px] uppercase tracking-wider">
                      {tag}
                    </span>
                  ))}
                </CardDescription>
                <TryOnModal 
                  garmentId={g.id} 
                  garmentName={g.name} 
                  onSimulationComplete={setSimulatedUrl} 
                />
              </CardHeader>
            </Card>
          ))}
        </div>
      </aside>
    </main>
  )
}
