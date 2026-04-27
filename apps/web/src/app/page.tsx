import React from 'react';
import ClientStage from '@/components/VirtualRack/ClientStage';

// Define the Garment type based on our Firebase schema
type Garment = {
  id: string;
  name: string;
  description: string | null;
  occasionTags: string[];
  assetGlbUrl: string | null;
  assetUsdzUrl: string | null;
};

export default function VirtualRackPage() {
  const userId = 'user-123';

  // We are using Firebase now instead of Prisma.
  // Display placeholders for the UI Layout.
  const displayGarments = [
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
