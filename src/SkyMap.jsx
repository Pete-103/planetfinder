import React from 'react';
import './SkyMap.css';

const getImageSrc = (planet) => {
  const jpgPlanets = ['Venus', 'Mars', 'Jupiter', 'Saturn', 'Sun'];
  if (jpgPlanets.includes(planet)) {
    return `/planets/${planet}.jpg`;
  }
  return `/planets/${planet}.png`;
};

function SkyMap({ planetData }) {
  if (!planetData || Object.keys(planetData).length === 0) return null;

  return (
    <div className="sky-map-container">
      <div className="sky-map">
        <div className="horizon-line horizontal"></div>
        <div className="horizon-line vertical"></div>
        <div className="sky-map-center">Earth</div>
        
        {Object.keys(planetData).map(planet => {
          if (planet === 'Earth') return null;
          const data = planetData[planet];
          if (!data || data.mapX === undefined || data.mapY === undefined) return null;
          
          // mapX and mapY are between -1 to 1.
          // In standard geometry, +Y is up, but in DOM top is 0 and bottom is 100%.
          // We map coordinates accordingly.
          const leftPos = (data.mapX * 50) + 50;
          const topPos = (-data.mapY * 50) + 50;

          return (
            <div 
              key={planet} 
              className="sky-map-planet"
              style={{
                left: `${leftPos}%`,
                top: `${topPos}%`
              }}
              title={planet}
            >
              <div 
                className="sky-map-icon" 
                style={{backgroundImage: `url(${getImageSrc(planet)})`}}
              ></div>
              <span className="sky-map-label">{planet}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SkyMap;
