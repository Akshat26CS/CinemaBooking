"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Center, Environment } from "@react-three/drei";
import * as THREE from "three";

const baseGeometry = new THREE.BoxGeometry(0.9, 0.5, 1);
const backGeometry = new THREE.BoxGeometry(0.9, 1, 0.2);

// Standard inactive seat materials (reused for performance)
const standardSeatMat = new THREE.MeshStandardMaterial({
  color: "#0F172A",
  emissive: "#1e293b",
  emissiveIntensity: 0.2,
  roughness: 0.2,
  metalness: 0.8
});
const standardBackMat = new THREE.MeshStandardMaterial({
  color: "#0F172A",
  emissive: "#1e293b",
  emissiveIntensity: 0.16, // slightly dimmer
  roughness: 0.2,
  metalness: 0.8
});

// A grid of minimalist 3D seats
function IsometricSeats() {
  const groupRef = useRef<THREE.Group>(null);

  // Generate seat grid: 10 rows, 14 columns
  const seats = useMemo(() => {
    const arr = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 12; c++) {
        // Skip some middle seats to create an aisle
        if (c === 5 || c === 6) continue;

        // Base color
        let emissiveColor = "#1e293b"; // brand-bg-alt slightly brightened
        let emissiveIntensity = 0.2;
        
        // Make some seats selected/glowing
        const isSelectedCrimson = (r === 4 && (c === 4 || c === 5));
        const isSelectedIndigo = (r === 5 && c === 8);
        
        if (isSelectedCrimson) {
          emissiveColor = "#E11D48";
          emissiveIntensity = 2;
        } else if (isSelectedIndigo) {
          emissiveColor = "#4F46E5";
          emissiveIntensity = 2;
        }

        arr.push({
          id: `seat-${r}-${c}`,
          position: [c * 1.1 - 7, 0, r * 1.5 - 5] as [number, number, number],
          color: emissiveColor,
          intensity: emissiveIntensity,
        });
      }
    }
    return arr;
  }, []);

  useFrame(() => {
    // Passive spin removed for performance
  });

  return (
    <group ref={groupRef} rotation={[0, Math.PI / 4, 0]}>
      {seats.map((seat) => {
        const isStandard = seat.color === "#1e293b";
        
        return (
          <group key={seat.id} position={seat.position}>
            {/* Seat base */}
            <mesh position={[0, 0.25, 0]} geometry={baseGeometry} material={isStandard ? standardSeatMat : undefined}>
              {!isStandard && (
                <meshStandardMaterial 
                  color="#0F172A"
                  emissive={seat.color}
                  emissiveIntensity={seat.intensity}
                  roughness={0.2}
                  metalness={0.8}
                />
              )}
            </mesh>
            {/* Seat back */}
            <mesh position={[0, 0.75, -0.4]} geometry={backGeometry} material={isStandard ? standardBackMat : undefined}>
              {!isStandard && (
                <meshStandardMaterial 
                  color="#0F172A"
                  emissive={seat.color}
                  emissiveIntensity={seat.intensity * 0.8} 
                  roughness={0.2}
                  metalness={0.8}
                />
              )}
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

export default function SeatScene({ rotationRef }: { rotationRef: React.MutableRefObject<number> }) {
  const containerRef = useRef<THREE.Group>(null);
  
  useFrame(() => {
    if (containerRef.current) {
      // Lerp the container to the target rotation driven by scroll
      containerRef.current.rotation.y = THREE.MathUtils.lerp(
        containerRef.current.rotation.y, 
        rotationRef.current, 
        0.1
      );
    }
  });

  return (
    <group ref={containerRef}>
      <Center>
        <IsometricSeats />
      </Center>
    </group>
  );
}
