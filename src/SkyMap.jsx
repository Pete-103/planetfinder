import React, { useMemo } from 'react';
import './SkyMap.css';

const getPlanetColor = (planet) => {
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
  return colors[planet] || '#ffffff';
};

function SkyMap({ planetData, setHoveredPlanet }) {
  const layout = useMemo(() => {
    if (!planetData) return {};
    
    const planets = Object.keys(planetData).filter(p => p !== 'Earth' && planetData[p].mapX !== undefined);
    
    // Initialize nodes
    let nodes = planets.map(p => {
        const data = planetData[p];
        const x = (data.mapX * 50) + 50;
        const y = (-data.mapY * 50) + 50;
        return {
            id: p,
            x: x,
            y: y,
            // Start the label very close
            labelX: x + 4.0,
            labelY: y - 12.0,
        };
    });
    
    // Force-directed layout for labels to avoid overlap
    const iterations = 50;
    const targetDist = 24; // Desired distance from planet to label
    const repelRadius = 8; // Minimum distance between labels
    
    for (let i = 0; i < iterations; i++) {
        nodes.forEach(n => {
            // Spring force towards target distance from anchor
            const dx = n.x - n.labelX;
            const dy = n.y - n.labelY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 0) {
                const pull = (dist - targetDist) * 0.1;
                n.labelX += (dx / dist) * pull;
                n.labelY += (dy / dist) * pull;
            }

            // Repulsive force away from other labels
            nodes.forEach(n2 => {
                if (n !== n2) {
                    const dx2 = n.labelX - n2.labelX;
                    const dy2 = n.labelY - n2.labelY;
                    const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
                    if (dist2 > 0 && dist2 < repelRadius) {
                        const push = (repelRadius - dist2) * 0.2;
                        n.labelX += (dx2 / dist2) * push;
                        n.labelY += (dy2 / dist2) * push;
                    }
                }
            });
            
            // Keep within bounds
            n.labelX = Math.max(5, Math.min(95, n.labelX));
            n.labelY = Math.max(5, Math.min(95, n.labelY));
        });
    }
    
    const result = {};
    nodes.forEach(n => { result[n.id] = n; });
    return result;
  }, [planetData]);

  const isDaytime = planetData && planetData['Sun'] && planetData['Sun'].altitude > 0;

  if (!planetData || Object.keys(planetData).length === 0) return null;

  return (
    <div className="sky-map-container" onClick={() => setHoveredPlanet && setHoveredPlanet(null)}>
      <div className="sky-map">
        <div className="horizon-line horizontal"></div>
        <div className="horizon-line vertical"></div>
        <div className="sky-map-center">Earth</div>
        
        {/* SVG Layer for Leader Lines */}
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 5 }}>
            {Object.keys(layout).map(p => {
                const n = layout[p];
                return (
                    <line 
                        key={`line-${p}`} 
                        x1={`${n.x}%`} 
                        y1={`${n.y}%`} 
                        x2={`${n.labelX}%`} 
                        y2={`${n.labelY}%`} 
                        stroke="rgba(255, 255, 255, 0.4)" 
                        strokeWidth="1"
                        strokeDasharray="2,2"
                    />
                );
            })}
        </svg>

        {Object.keys(planetData).map(planet => {
          if (planet === 'Earth') return null;
          const data = planetData[planet];
          if (!data || data.mapX === undefined || data.mapY === undefined) return null;
          const pos = layout[planet];
          if (!pos) return null;

          return (
            <React.Fragment key={planet}>
                {/* The Planet Dot */}
                <div 
                  className="sky-map-planet"
                  style={{
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                    cursor: 'pointer'
                  }}
                  title={planet}
                  onMouseEnter={() => setHoveredPlanet && setHoveredPlanet(planet)}
                  onClick={(e) => { e.stopPropagation(); if (setHoveredPlanet) setHoveredPlanet(planet); }}
                >
                  <div 
                    className="sky-map-icon" 
                    style={{
                      background: `radial-gradient(circle at center, #ffffff 0%, ${getPlanetColor(planet)} 40%, transparent 80%)`,
                      transform: planet === 'Sun' ? 'scale(1.25)' : `scale(${Math.max(0.05, (Math.pow(10, -0.2 * (data.magnitude || 0)) * 1.5) / 4)})`,
                      display: (!isDaytime || planet === 'Sun' || planet === 'Moon') ? 'block' : 'none'
                    }}
                  ></div>
                </div>
                
                {/* The Planet Label */}
                <div
                  className="sky-map-planet-label-container"
                  style={{
                      position: 'absolute',
                      left: `${pos.labelX}%`,
                      top: `${pos.labelY}%`,
                      transform: 'translate(-50%, -50%)',
                      zIndex: 15,
                      pointerEvents: 'none'
                  }}
                >
                    <span className="sky-map-label">{planet}</span>
                </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

export default SkyMap;
