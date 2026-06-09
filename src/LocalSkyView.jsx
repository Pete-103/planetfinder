import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Text, Billboard, Line } from '@react-three/drei';
import * as THREE from 'three';

function getPlanetTexture(planet) {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  
  const colors = {
    Mercury: '#cccccc',
    Venus: '#ffffe0',
    Mars: '#ff7733',
    Jupiter: '#ffddaa',
    Saturn: '#eedd99',
    Uranus: '#aaddff',
    Neptune: '#77aaff',
    Neptune: '#77aaff',
    Sun: '#fff5cc',
    Moon: '#dddddd'
  };

  const color = colors[planet] || '#ffffff';
  
  const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 32);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.3, color);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  
  ctx.clearRect(0, 0, 64, 64);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  
  return new THREE.CanvasTexture(canvas);
}

function ZoomHandler({ controlsRef }) {
  const camera = useThree((state) => state.camera);
  
  useEffect(() => {
    const updatePolar = (fov) => {
      if (controlsRef && controlsRef.current) {
        const halfFovRad = (fov / 2) * (Math.PI / 180);
        const targetPolar = Math.PI / 2 + halfFovRad;
        
        controlsRef.current.minPolarAngle = targetPolar;
        controlsRef.current.maxPolarAngle = targetPolar;
        controlsRef.current.update();
      }
    };
    
    updatePolar(camera.fov);

    let initialPinchDist = null;
    let initialFov = null;

    const handleWheel = (e) => {
      e.preventDefault();
      const newFov = Math.max(20, Math.min(100, camera.fov + e.deltaY * 0.05));
      camera.fov = newFov;
      camera.updateProjectionMatrix();
      updatePolar(newFov);
    };

    const handleTouchStart = (e) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        initialPinchDist = Math.sqrt(dx * dx + dy * dy);
        initialFov = camera.fov;
      }
    };

    const handleTouchMove = (e) => {
      if (e.touches.length === 2 && initialPinchDist) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        const scale = initialPinchDist / dist;
        const newFov = Math.max(20, Math.min(100, initialFov * scale));
        camera.fov = newFov;
        camera.updateProjectionMatrix();
        updatePolar(newFov);
      }
    };

    const handleTouchEnd = (e) => {
      if (e.touches.length < 2) {
        initialPinchDist = null;
      }
    };
    
    const canvas = camera.el || document.querySelector('canvas');
    const target = canvas || window;
    
    target.addEventListener('wheel', handleWheel, { passive: false });
    target.addEventListener('touchstart', handleTouchStart, { passive: false });
    target.addEventListener('touchmove', handleTouchMove, { passive: false });
    target.addEventListener('touchend', handleTouchEnd);
    target.addEventListener('touchcancel', handleTouchEnd);
    
    return () => {
      target.removeEventListener('wheel', handleWheel);
      target.removeEventListener('touchstart', handleTouchStart);
      target.removeEventListener('touchmove', handleTouchMove);
      target.removeEventListener('touchend', handleTouchEnd);
      target.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [camera]);
  
  return null;
}



function SkyPlanet({ name, altitude, azimuth, magnitude, radius = 50, isDaytime, labelOffset = { x: 3.2, y: 3.2, z: 0 } }) {
  const texture = React.useMemo(() => getPlanetTexture(name), [name]);
  
  const altRad = altitude * (Math.PI / 180);
  const azRad = azimuth * (Math.PI / 180);
  
  const y = radius * Math.sin(altRad);
  const r_xz = radius * Math.cos(altRad);
  const x = r_xz * Math.sin(azRad);
  const z = -r_xz * Math.cos(azRad);

  let spriteScale = 3.0 / 4;
  if (name === 'Sun') {
      spriteScale = 18.0 / 4;
  } else if (name === 'Moon') {
      spriteScale = 9.0 / 4;
  } else if (magnitude !== undefined) {
      const relativeRadius = Math.pow(10, -0.1 * magnitude);
      spriteScale = Math.max(0.05, (relativeRadius * 2.25) / 4);
  }

  const isVisible = (!isDaytime || name === 'Sun' || name === 'Moon') && altitude >= 0;

  return (
    <group position={[x, y, z]}>
      <sprite 
        scale={[spriteScale, spriteScale, 1]}
        visible={isVisible}
      >
        <spriteMaterial map={texture} color="#fff" transparent={true} depthWrite={false} />
      </sprite>
      
      <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
        <Line 
          points={[[0, 0, 0], [labelOffset.x - 0.2, labelOffset.y, labelOffset.z]]} 
          color={isDaytime ? "rgba(0,0,0,0.8)" : "rgba(255,255,255,0.8)"} 
          lineWidth={2} 
          depthTest={false}
          renderOrder={1}
        />
        <Text
          position={[labelOffset.x, labelOffset.y, labelOffset.z]}
          fontSize={1.2}
          color={isDaytime ? "#000000" : "#ffffff"}
          anchorX="left"
          anchorY="middle"
          outlineWidth={isDaytime ? 0 : 0.1}
          outlineColor="#000"
          fontWeight={isDaytime ? "bold" : "normal"}
          depthTest={false}
          renderOrder={1}
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
        <meshBasicMaterial color="#081018" transparent={true} opacity={0.6} />
      </mesh>
      
      <mesh position={[0, -5.1, 0]}>
        <cylinderGeometry args={[radius * 2, radius * 2, 10, 64]} />
        <meshBasicMaterial color="#050a0f" transparent={true} opacity={0.6} />
      </mesh>

      {/* Compass Markers */}
      <Billboard position={[0, 4, -radius + 2]}>
        <Text fontSize={3} color="#ef4444" outlineWidth={0.2} outlineColor="#000">N</Text>
      </Billboard>
      <Billboard position={[radius - 2, 4, 0]}>
        <Text fontSize={3} color="#88aadd" outlineWidth={0.2} outlineColor="#000">E</Text>
      </Billboard>
      <Billboard position={[0, 4, radius - 2]}>
        <Text fontSize={3} color="#88aadd" outlineWidth={0.2} outlineColor="#000">S</Text>
      </Billboard>
      <Billboard position={[-radius + 2, 4, 0]}>
        <Text fontSize={3} color="#88aadd" outlineWidth={0.2} outlineColor="#000">W</Text>
      </Billboard>
      
      <gridHelper args={[radius * 2, 20, '#ffffff', '#ffffff']} position={[0, 0, 0]} material-opacity={0.1} material-transparent />
    </group>
  );
}

const LocalSkyView = ({ planetData }) => {
  const planetsList = Object.keys(planetData).filter(p => p !== 'Earth');
  const sunData = planetData['Sun'];
  const sunAlt = sunData ? sunData.altitude : 0;
  const isDaytime = sunAlt > 0;
  const controlsRef = useRef();

  const labelOffsets = React.useMemo(() => {
     const offsets = {};
     if (!planetData) return offsets;
     const pList = Object.keys(planetData).filter(p => p !== 'Earth');
     
     // Base offsets (very close to planet)
     pList.forEach(p => offsets[p] = { x: 3.2, y: 3.2, z: 0 });
     
     const iterations = 50;
     // Rough conversion from degrees to local billboard units
     const degToUnits = 50 * (Math.PI / 180); 
     
     for(let i=0; i<iterations; i++) {
        pList.forEach(p1 => {
           if (!planetData[p1] || planetData[p1].altitude < -5) return;
           
           pList.forEach(p2 => {
               if (p1 === p2 || !planetData[p2] || planetData[p2].altitude < -5) return;
               
               let diffAz = ((planetData[p1].azimuth - planetData[p2].azimuth + 180) % 360 + 360) % 360 - 180;
               let diffAlt = planetData[p1].altitude - planetData[p2].altitude;
               
               // Calculate virtual positions of labels in local space
               const lx1 = diffAz * degToUnits + offsets[p1].x;
               const ly1 = diffAlt * degToUnits + offsets[p1].y;
               
               const lx2 = 0 + offsets[p2].x; // relative to p2
               const ly2 = 0 + offsets[p2].y;
               
               const dx = lx1 - lx2;
               const dy = ly1 - ly2;
               const dist = Math.sqrt(dx*dx + dy*dy);
               
               // Target minimum distance between labels in units (e.g., 2.5 units to avoid text overlap)
               const targetDist = 2.5; 
               
               if (dist > 0 && dist < targetDist) {
                   const push = (targetDist - dist) * 0.1; // mild spring force
                   offsets[p1].x += (dx / dist) * push;
                   offsets[p1].y += (dy / dist) * push;
               }
           });
           
           // Small attractive force to pull back to base offset if pushed too far
           offsets[p1].x += (3.2 - offsets[p1].x) * 0.05;
           offsets[p1].y += (3.2 - offsets[p1].y) * 0.05;
        });
     }
     return offsets;
  }, [planetData]);

  // Calculate gradual sky color and lighting
  const nightColor = new THREE.Color('#020408');
  const dayColor = new THREE.Color('#4fa3d1');
  
  let skyColorStr = '#020408';
  if (sunAlt > 2) {
    skyColorStr = dayColor.getStyle();
  } else if (sunAlt < -2) {
    skyColorStr = nightColor.getStyle();
  } else {
    const t = (sunAlt + 2) / 4;
    skyColorStr = nightColor.clone().lerp(dayColor, t).getStyle();
  }

  let dayFactor = 0;
  if (sunAlt > 2) dayFactor = 1;
  else if (sunAlt < -2) dayFactor = 0;
  else dayFactor = (sunAlt + 2) / 4;

  const ambientIntensity = 0.6 + dayFactor * 0.2;
  const dirIntensity = 1.0 + dayFactor * 0.5;

  return (
    <div className="threed-view-container" style={{ borderRadius: '12px', overflow: 'hidden', height: '600px', border: '1px solid rgba(255,255,255,0.1)' }}>
      {/* 
        Position [0.086, -0.05, 0] means X is positive (East), looking at origin (0,0,0). 
        Looking from East to Origin points the camera exactly West.
      */}
      <Canvas camera={{ position: [0.086, -0.05, 0], fov: 60 }}>
        <color attach="background" args={[skyColorStr]} />
        
        {sunAlt < 5 && (
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        )}
        
        <ambientLight intensity={ambientIntensity} />
        <directionalLight position={[0, 50, 0]} intensity={dirIntensity} />

        <OrbitControls 
          ref={controlsRef}
          target={[0, 0, 0]} 
          enableZoom={false} 
          enablePan={false}
          rotateSpeed={-0.5}
          enableDamping={true}
          dampingFactor={0.05}
          minPolarAngle={0}
          maxPolarAngle={Math.PI}
        />
        
        <ZoomHandler controlsRef={controlsRef} />

        <GroundAndCompass radius={50} />

        {planetsList.map(planet => {
          const data = planetData[planet];
          if (!data || data.altitude === undefined) return null;
          
          if (data.altitude < 0) return null;

          return (
            <SkyPlanet 
              key={planet} 
              name={planet} 
              altitude={data.altitude} 
              azimuth={data.azimuth} 
              magnitude={data.magnitude}
              radius={50} 
              isDaytime={isDaytime}
              labelOffset={labelOffsets[planet] || { x: 3.2, y: 3.2, z: 0 }}
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
