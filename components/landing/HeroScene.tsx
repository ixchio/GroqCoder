"use client";

import { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";

// Floating code block component
function CodeBlock({ position, rotation, scale, color }: { 
  position: [number, number, number]; 
  rotation: [number, number, number];
  scale: number;
  color: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3 + position[0]) * 0.1;
      meshRef.current.rotation.y += 0.002;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh ref={meshRef} position={position} rotation={rotation} scale={scale}>
        <boxGeometry args={[1, 0.6, 0.08]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.15}
          roughness={0.1}
          metalness={0.8}
        />
      </mesh>
      {/* Code lines on the block */}
      <mesh position={[position[0], position[1] + 0.15, position[2] + 0.05]} scale={scale}>
        <boxGeometry args={[0.7, 0.05, 0.01]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[position[0] - 0.1, position[1], position[2] + 0.05]} scale={scale}>
        <boxGeometry args={[0.5, 0.05, 0.01]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[position[0] + 0.05, position[1] - 0.15, position[2] + 0.05]} scale={scale}>
        <boxGeometry args={[0.6, 0.05, 0.01]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
      </mesh>
    </Float>
  );
}

// Particle system for neural network effect
function ParticleField() {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 300;

  const [positions, colors] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 15;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
      
      // Purple to cyan gradient
      const t = Math.random();
      colors[i * 3] = 0.5 + t * 0.5;     // R
      colors[i * 3 + 1] = 0.2 + t * 0.3;  // G
      colors[i * 3 + 2] = 1;              // B
    }
    
    return [positions, colors];
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.02;
      pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

// Central glowing orb representing AI
function AICore() {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
      meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
    if (glowRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      glowRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group>
      {/* Inner core */}
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[0.8, 2]} />
        <meshStandardMaterial
          color="#8b5cf6"
          emissive="#8b5cf6"
          emissiveIntensity={0.5}
          wireframe
        />
      </mesh>
      
      {/* Outer glow */}
      <mesh ref={glowRef} scale={1.3}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshStandardMaterial
          color="#a855f7"
          transparent
          opacity={0.1}
          side={THREE.BackSide}
        />
      </mesh>
      
      {/* Orbiting rings */}
      <Float speed={1.5} rotationIntensity={2}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.2, 0.02, 16, 100]} />
          <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={0.8} />
        </mesh>
      </Float>
      <Float speed={2} rotationIntensity={1.5}>
        <mesh rotation={[Math.PI / 3, Math.PI / 4, 0]}>
          <torusGeometry args={[1.5, 0.015, 16, 100]} />
          <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={0.5} />
        </mesh>
      </Float>
    </group>
  );
}

// Connection lines between elements
function ConnectionLines() {
  const linesRef = useRef<THREE.LineSegments>(null);

  const geometry = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const lineCount = 20;
    
    for (let i = 0; i < lineCount; i++) {
      const angle1 = (i / lineCount) * Math.PI * 2;
      const angle2 = ((i + 3) / lineCount) * Math.PI * 2;
      const radius = 2 + Math.random() * 2;
      
      points.push(
        new THREE.Vector3(Math.cos(angle1) * radius, (Math.random() - 0.5) * 3, Math.sin(angle1) * radius),
        new THREE.Vector3(Math.cos(angle2) * radius * 0.5, (Math.random() - 0.5) * 2, Math.sin(angle2) * radius * 0.5)
      );
    }
    
    return new THREE.BufferGeometry().setFromPoints(points);
  }, []);

  useFrame((state) => {
    if (linesRef.current) {
      linesRef.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });

  return (
    <lineSegments ref={linesRef} geometry={geometry}>
      <lineBasicMaterial color="#8b5cf6" transparent opacity={0.3} />
    </lineSegments>
  );
}

// Main scene composition
function Scene() {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={0.8} color="#a855f7" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#06b6d4" />
      <spotLight position={[0, 10, 0]} intensity={0.5} angle={0.3} penumbra={1} color="#fff" />

      {/* Main AI Core */}
      <AICore />

      {/* Floating code blocks */}
      <CodeBlock position={[-3, 1.5, -1]} rotation={[0.2, 0.3, 0]} scale={0.8} color="#8b5cf6" />
      <CodeBlock position={[3.5, 0.5, -2]} rotation={[-0.1, -0.2, 0.1]} scale={0.6} color="#06b6d4" />
      <CodeBlock position={[-2.5, -1.5, 0]} rotation={[0.1, 0.5, -0.1]} scale={0.7} color="#a855f7" />
      <CodeBlock position={[2, -1, 1]} rotation={[-0.2, 0.1, 0.05]} scale={0.5} color="#22d3ee" />
      <CodeBlock position={[0, 2.5, -3]} rotation={[0.3, -0.3, 0]} scale={0.9} color="#c084fc" />
      <CodeBlock position={[-4, 0, -2]} rotation={[0, 0.4, 0.1]} scale={0.55} color="#67e8f9" />

      {/* Particle field */}
      <ParticleField />

      {/* Connection lines */}
      <ConnectionLines />
    </>
  );
}

// Fallback component for loading
function Fallback() {
  return (
    <mesh>
      <sphereGeometry args={[0.5, 16, 16]} />
      <meshStandardMaterial color="#8b5cf6" wireframe />
    </mesh>
  );
}

// Main exported component
export function HeroScene() {
  return (
    <div className="absolute inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <Suspense fallback={<Fallback />}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
}

// Lightweight fallback for mobile/low-power devices
export function HeroSceneFallback() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      {/* Animated gradient orbs using CSS */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-gradient-to-r from-purple-500/20 to-cyan-500/20 blur-3xl animate-pulse" />
      <div className="absolute top-1/3 left-1/3 w-[200px] h-[200px] rounded-full bg-purple-600/10 blur-2xl animate-bounce" style={{ animationDuration: '3s' }} />
      <div className="absolute bottom-1/3 right-1/3 w-[250px] h-[250px] rounded-full bg-cyan-500/10 blur-2xl animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }} />
      
      {/* Floating squares representing code blocks */}
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute w-16 h-10 border border-white/10 rounded-lg bg-white/5 backdrop-blur-sm animate-float"
          style={{
            left: `${20 + (i % 3) * 30}%`,
            top: `${25 + Math.floor(i / 3) * 40}%`,
            animationDelay: `${i * 0.5}s`,
            animationDuration: `${3 + i * 0.5}s`,
          }}
        >
          <div className="w-3/4 h-1 bg-purple-400/40 rounded-full mt-2 ml-2" />
          <div className="w-1/2 h-1 bg-cyan-400/30 rounded-full mt-1 ml-2" />
          <div className="w-2/3 h-1 bg-purple-400/20 rounded-full mt-1 ml-2" />
        </div>
      ))}
    </div>
  );
}

export default HeroScene;
