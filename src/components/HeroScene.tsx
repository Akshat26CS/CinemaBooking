"use client";

import { useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Float, MeshTransmissionMaterial, RoundedBox } from "@react-three/drei";
import * as THREE from "three";

function TicketModel() {
  const meshRef = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();

  useFrame((state) => {
    if (!meshRef.current) return;
    
    // Mouse parallax effect
    const x = (state.pointer.x * viewport.width) / 10;
    const y = (state.pointer.y * viewport.height) / 10;
    
    meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, x, 0.03);
    meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, y, 0.03);
    
    // Continuous slow spin on Y-axis combined with slight rotation based on mouse
    const time = state.clock.getElapsedTime();
    const targetRotationX = state.pointer.y * 0.2;
    const targetRotationY = (time * 0.2) + (state.pointer.x * 0.5);

    meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, targetRotationX, 0.05);
    meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, targetRotationY, 0.05);
  });

  return (
    <Float
      speed={1.5}
      rotationIntensity={0.3}
      floatIntensity={0.3}
    >
      <RoundedBox args={[2.5, 4, 0.1]} radius={0.1} smoothness={4} ref={meshRef}>
        <MeshTransmissionMaterial
          backside
          resolution={128} // Lowered resolution to save memory & GPU
          samples={2}
          thickness={0.5}
          chromaticAberration={0.25}
          anisotropy={0.2}
          distortion={0.15}
          distortionScale={0.3}
          temporalDistortion={0.05}
          iridescence={1}
          iridescenceIOR={1}
          iridescenceThicknessRange={[0, 1400]}
          clearcoat={1}
          roughness={0.15}
          color="#ffffff"
        />
      </RoundedBox>
    </Float>
  );
}

export default function HeroScene() {
  const [visible, setVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0 } // Any part visible -> mount
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 z-0 pointer-events-none">
      {visible && (
        <Canvas 
          camera={{ position: [0, 0, 8], fov: 45 }}
          dpr={[1, 1.25]} 
          gl={{ powerPreference: "high-performance", antialias: false, alpha: false }}
        >
          <color attach="background" args={["#0A0A0A"]} />
          <ambientLight intensity={0.2} />
          <spotLight position={[5, 5, 5]} angle={0.2} penumbra={1} intensity={60} color="#E11D48" />
          <spotLight position={[-5, -5, 5]} angle={0.2} penumbra={1} intensity={60} color="#4F46E5" />
          
          <Environment preset="city" resolution={256} />
          
          <TicketModel />
        </Canvas>
      )}
    </div>
  );
}
