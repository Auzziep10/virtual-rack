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

async function getUser() {
  try {
    return await prisma.user.findFirst();
  } catch (error) {
    console.error("Failed to fetch user:", error);
    return null;
  }
}

export default async function VirtualRackPage() {
  const garments = await getGarments();
  const user = await getUser();
  const userId = user?.id || 'user-123';

  // If no garments exist yet, fallback to a placeholder list for the UI layout
  const displayGarments = garments.length > 0 ? garments : [
    { id: 'placeholder-1', name: 'Velvet Gala Gown', occasionTags: ['Gala'], assetGlbUrl: null },
    { id: 'placeholder-2', name: 'Silk Resort Shirt', occasionTags: ['Beach', 'Resort'], assetGlbUrl: null },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 p-8 font-sans selection:bg-neutral-200">
      <header className="max-w-6xl mx-auto mb-12 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-light tracking-tight">The Virtual Rack</h1>
          <p className="text-neutral-500 mt-2 text-sm uppercase tracking-widest">Curated Occasion Wardrobe</p>
        </div>
        <nav className="flex gap-6 text-sm text-neutral-500">
          <a href="#" className="hover:text-neutral-900 transition-colors">Catalog</a>
          <a href="#" className="hover:text-neutral-900 transition-colors">My Fits</a>
          <a href="#" className="text-neutral-900 border-b border-neutral-900 pb-1">Rack</a>
        </nav>
      </header>

      <ClientStage displayGarments={displayGarments} userId={userId} />
    </div>
  );
}
