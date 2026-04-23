"use client";

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, useGLTF } from '@react-three/drei';

interface GarmentModelProps {
  url: string;
}

function GarmentModel({ url }: GarmentModelProps) {
  // Try loading GLB/GLTF. Note: error handling is omitted for simplicity
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

export default function RackScene({ garments = [] }: { garments: any[] }) {
  return (
    <div className="w-full h-[600px] bg-slate-50 rounded-xl overflow-hidden shadow-inner border border-slate-200">
      <Canvas camera={{ position: [0, 1.5, 3], fov: 50 }}>
        <Suspense fallback={null}>
          <Stage environment="city" intensity={0.6}>
            {garments.map((g, i) => (
              g.assetGlbUrl ? (
                <group key={g.id} position={[i * 1.5, 0, 0]}>
                  <GarmentModel url={g.assetGlbUrl} />
                </group>
              ) : null
            ))}
          </Stage>
        </Suspense>
        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
}
