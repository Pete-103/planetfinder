import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Text, useTexture, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import './ThreeDView.css';

const getImageSrc = (planet) => {
  const jpgPlanets = ['Venus', 'Mars', 'Jupiter', 'Saturn', 'Sun'];
  if (jpgPlanets.includes(planet)) {
    return `/planets/${planet}.jpg`;
  }
  return `/planets/${planet}.png`;
};

function ZoomHandler() {
  const camera = useThree((state) => state.camera);
  
  useEffect(() => {
    const handleWheel = (e) => {
      e.preventDefault();
      const newFov = Math.max(20, Math.min(100, camera.fov + e.deltaY * 0.05));
      camera.fov = newFov;
      camera.updateProjectionMatrix();
    };
    
    const canvas = camera.el || document.querySelector('canvas');
    if (canvas) {
      canvas.addEventListener('wheel', handleWheel, { passive: false });
      return () => canvas.removeEventListener('wheel', handleWheel);
    } else {
      window.addEventListener('wheel', handleWheel, { passive: false });
      return () => window.removeEventListener('wheel', handleWheel);
    }
  }, [camera]);
  
  return null;
}

function CameraController({ planetData, focusPlanets, controlsRef }) {
  const { camera } = useThree();
  
  useEffect(() => {
    // If no specific planets to focus on (e.g. initial load), do nothing!
    // The camera will naturally stay at its default position (West).
    if (!focusPlanets || focusPlanets.length === 0 || !planetData) return;
    
    let minAz = Infinity, maxAz = -Infinity;
    let minAlt = Infinity, maxAlt = -Infinity;
    let validPlanets = 0;
    
    focusPlanets.forEach(p => {
       const data = planetData[p];
       if (data && data.altitude !== undefined && data.altitude > -5) {
          minAz = Math.min(minAz, data.azimuth);
          maxAz = Math.max(maxAz, data.azimuth);
          minAlt = Math.min(minAlt, data.altitude);
          maxAlt = Math.max(maxAlt, data.altitude);
          validPlanets++;
       }
    });
    
    if (validPlanets === 0) return;
    
    let spreadAz = maxAz - minAz;
    let centerAz = (minAz + maxAz) / 2;
    if (spreadAz > 180) {
       let adjustedMin = Infinity, adjustedMax = -Infinity;
       focusPlanets.forEach(p => {
          const data = planetData[p];
          if (data && data.altitude !== undefined && data.altitude > -5) {
             let az = data.azimuth;
             if (az < 180) az += 360;
             adjustedMin = Math.min(adjustedMin, az);
             adjustedMax = Math.max(adjustedMax, az);
          }
       });
       spreadAz = adjustedMax - adjustedMin;
       centerAz = ((adjustedMin + adjustedMax) / 2) % 360;
    }
    
    const azRad = centerAz * (Math.PI / 180);
    const r = 0.086;
    const camX = -r * Math.sin(azRad);
    const camZ = r * Math.cos(azRad);
    
    camera.position.set(camX, -0.05, camZ);
    camera.lookAt(0, 0, 0);
    
    const spreadAlt = maxAlt - minAlt;
    const maxSpread = Math.max(spreadAz, spreadAlt);
    let newFov = maxSpread + 25; 
    camera.fov = Math.max(30, Math.min(100, newFov));
    camera.updateProjectionMatrix();

    if (controlsRef && controlsRef.current) {
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
    }
    
  }, [focusPlanets, planetData, camera, controlsRef]);
  
  return null;
}

function SkyPlanet({ name, altitude, azimuth, radius = 50, isDaytime }) {
  const textureUrl = getImageSrc(name);
  const texture = useTexture(textureUrl);
  const meshRef = useRef();
  
  const altRad = altitude * (Math.PI / 180);
  const azRad = azimuth * (Math.PI / 180);
  
  const y = radius * Math.sin(altRad);
  const r_xz = radius * Math.cos(altRad);
  const x = r_xz * Math.sin(azRad);
  const z = -r_xz * Math.cos(azRad);

  let scale = 1.0;
  if (name === 'Sun' || name === 'Moon') scale = 2.0;

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <group position={[x, y, z]}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[scale, 32, 32]} />
        {name === 'Sun' ? (
          <meshBasicMaterial map={texture} color="#fff" />
        ) : (
          <meshStandardMaterial map={texture} />
        )}
      </mesh>
      
      <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
        <Text
          position={[0, scale + 1.5, 0]}
          fontSize={1.5}
          color={isDaytime ? "#000000" : "#ffffff"}
          anchorX="center"
          anchorY="middle"
          outlineWidth={isDaytime ? 0 : 0.1}
          outlineColor="#000"
          fontWeight={isDaytime ? "bold" : "normal"}
        >
          {name}
        </Text>
      </Billboard>
    </group>
  );
}

function GroundAndCompass({ radius = 50 }) {
  return (
    <group>
      <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0, radius * 2, 64]} />
        <meshBasicMaterial color="#081018" />
      </mesh>
      
      <mesh position={[0, -5.1, 0]}>
        <cylinderGeometry args={[radius * 2, radius * 2, 10, 64]} />
        <meshBasicMaterial color="#050a0f" />
      </mesh>

      {/* Compass Markers */}
      <Billboard position={[0, 1, -radius + 2]}>
        <Text fontSize={3} color="#ef4444" outlineWidth={0.2} outlineColor="#000">N</Text>
      </Billboard>
      <Billboard position={[radius - 2, 1, 0]}>
        <Text fontSize={3} color="#88aadd" outlineWidth={0.2} outlineColor="#000">E</Text>
      </Billboard>
      <Billboard position={[0, 1, radius - 2]}>
        <Text fontSize={3} color="#88aadd" outlineWidth={0.2} outlineColor="#000">S</Text>
      </Billboard>
      <Billboard position={[-radius + 2, 1, 0]}>
        <Text fontSize={3} color="#88aadd" outlineWidth={0.2} outlineColor="#000">W</Text>
      </Billboard>
      
      <gridHelper args={[radius * 2, 20, '#ffffff', '#ffffff']} position={[0, 0, 0]} material-opacity={0.1} material-transparent />
    </group>
  );
}

const LocalSkyView = ({ planetData, focusPlanets }) => {
  const planetsList = Object.keys(planetData).filter(p => p !== 'Earth');
  const sunData = planetData['Sun'];
  const isDaytime = sunData && sunData.altitude > 0;
  const controlsRef = useRef();

  return (
    <div className="threed-view-container" style={{ borderRadius: '12px', overflow: 'hidden', height: '600px', border: '1px solid rgba(255,255,255,0.1)' }}>
      {/* 
        Position [0.086, -0.05, 0] means X is positive (East), looking at origin (0,0,0). 
        Looking from East to Origin points the camera exactly West.
      */}
      <Canvas camera={{ position: [0.086, -0.05, 0], fov: 60 }}>
        <color attach="background" args={[isDaytime ? '#4fa3d1' : '#020408']} />
        
        {!isDaytime && (
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        )}
        
        <ambientLight intensity={isDaytime ? 0.8 : 0.6} />
        {isDaytime ? (
          <directionalLight position={[0, 50, 0]} intensity={1.5} />
        ) : (
          <directionalLight position={[0, 50, 0]} intensity={1.0} />
        )}

        <OrbitControls 
          ref={controlsRef}
          target={[0, 0, 0]} 
          enableZoom={false} 
          enablePan={false}
          rotateSpeed={-0.5}
          enableDamping={true}
          dampingFactor={0.05}
          minPolarAngle={Math.PI / 2}
          maxPolarAngle={Math.PI}
        />
        
        <ZoomHandler />
        <CameraController planetData={planetData} focusPlanets={focusPlanets} controlsRef={controlsRef} />

        <GroundAndCompass radius={50} />

        {planetsList.map(planet => {
          const data = planetData[planet];
          if (!data || data.altitude === undefined) return null;
          if (data.altitude < -5) return null;

          return (
            <SkyPlanet 
              key={planet} 
              name={planet} 
              altitude={data.altitude} 
              azimuth={data.azimuth} 
              radius={50} 
              isDaytime={isDaytime}
            />
          );
        })}
      </Canvas>
      <div className="threed-overlay-text">
        <p>Use mouse to drag and look around. Scroll to zoom.</p>
      </div>
    </div>
  );
};

export default LocalSkyView;
