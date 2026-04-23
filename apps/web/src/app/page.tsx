import React from 'react';
import ClientStage from '@/components/VirtualRack/ClientStage';
import { prisma } from '@/lib/prisma';

// Define the Garment type based on our Prisma schema
type Garment = {
  id: string;
  name: string;
  description: string | null;
  occasionTags: string[];
  assetGlbUrl: string | null;
  assetUsdzUrl: string | null;
};

// Fetch real garments from the PostgreSQL database
async function getGarments(): Promise<Garment[]> {
  try {
    const garments = await prisma.garment.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
    });
    return garments;
  } catch (error) {
    console.error("Failed to fetch garments:", error);
    return [];
  }
}

export default async function VirtualRackPage() {
  const garments = await getGarments();

  // If no garments exist yet, fallback to a placeholder list for the UI layout
  const displayGarments = garments.length > 0 ? garments : [
    { id: 'placeholder-1', name: 'Velvet Gala Gown', occasionTags: ['Gala'], assetGlbUrl: null },
    { id: 'placeholder-2', name: 'Silk Resort Shirt', occasionTags: ['Beach', 'Resort'], assetGlbUrl: null },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 p-8 font-sans selection:bg-neutral-800">
      <header className="max-w-6xl mx-auto mb-12 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-light tracking-tight">The Virtual Rack</h1>
          <p className="text-neutral-400 mt-2 text-sm uppercase tracking-widest">Curated Occasion Wardrobe</p>
        </div>
        <nav className="flex gap-6 text-sm text-neutral-400">
          <a href="#" className="hover:text-white transition-colors">Catalog</a>
          <a href="#" className="hover:text-white transition-colors">My Fits</a>
          <a href="#" className="text-white border-b border-white pb-1">Rack</a>
        </nav>
      </header>

      <ClientStage displayGarments={displayGarments} />
    </div>
  );
}
