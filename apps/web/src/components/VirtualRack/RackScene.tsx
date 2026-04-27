"use client";
// @ts-nocheck

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, useGLTF } from '@react-three/drei';

interface GarmentModelProps {
  url: string;
}

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <mesh>
          <boxGeometry args={[0.5, 1.5, 0.5]} />
          <meshStandardMaterial color="red" wireframe />
        </mesh>
      );
    }
    return this.props.children;
  }
}

function GarmentModel({ url }: GarmentModelProps) {
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
                  <ErrorBoundary>
                    <GarmentModel url={g.assetGlbUrl} />
                  </ErrorBoundary>
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
