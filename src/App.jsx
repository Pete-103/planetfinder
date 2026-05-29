import React, { useState, useEffect } from 'react';
import { calculatePlanetPositions, PLANET_DATA } from './planetMath';
import SkyMap from './SkyMap';
import './index.css';

const getImageSrc = (planet) => {
  const jpgPlanets = ['Venus', 'Mars', 'Jupiter', 'Saturn', 'Sun'];
  if (jpgPlanets.includes(planet)) {
    return `/planets/${planet}.jpg`;
  }
  return `/planets/${planet}.png`;
};

function App() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16));
  const [planetData, setPlanetData] = useState({});

  useEffect(() => {
    // Parse the local datetime string into a JS Date object
    const selectedDate = new Date(date);
    if (!isNaN(selectedDate)) {
      const data = calculatePlanetPositions(selectedDate);
      setPlanetData(data);
    }
  }, [date]);

  const handleDateChange = (e) => {
    setDate(e.target.value);
  };

  const formatRA = (raHours) => {
    const hours = Math.floor(raHours);
    const minutes = Math.floor((raHours - hours) * 60);
    const seconds = Math.floor(((raHours - hours) * 60 - minutes) * 60);
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const formatDecl = (declDeg) => {
    const sign = declDeg < 0 ? '-' : '+';
    const deg = Math.abs(Math.floor(declDeg));
    const minutes = Math.abs(Math.floor((declDeg % 1) * 60));
    return `${sign}${deg}° ${minutes}'`;
  };

  const planetsList = Object.keys(PLANET_DATA);

  return (
    <div className="app-container">
      <header>
        <h1>PlanetFinder Dashboard</h1>
        <p>Explore Keplerian Planetary Positions in Real-Time</p>
      </header>

      <div className="controls">
        <label htmlFor="datetime" className="stat-label">Select Date & Time:</label>
        <input 
          type="datetime-local" 
          id="datetime"
          className="date-picker"
          value={date}
          onChange={handleDateChange}
        />
      </div>

      <SkyMap planetData={planetData} />

      <div className="planets-grid">
        {planetsList.map(planet => {
          const data = planetData[planet];
          if (!data) return null;
          
          return (
            <div key={planet} className="planet-card">
              <div className="planet-header">
                <div className="planet-icon" style={{backgroundImage: `url(${getImageSrc(planet)})`}}>
                </div>
                <h2 className="planet-name">{planet}</h2>
              </div>
              
              {data.RA_hours !== undefined && (
                <div className="stat-row">
                  <span className="stat-label">Right Ascension</span>
                  <span className="stat-value">{formatRA(data.RA_hours)}</span>
                </div>
              )}
              
              {data.decl_deg !== undefined && (
                <div className="stat-row">
                  <span className="stat-label">Declination</span>
                  <span className="stat-value">{formatDecl(data.decl_deg)}</span>
                </div>
              )}

              <div className="stat-row">
                <span className="stat-label">Heliocentric X</span>
                <span className="stat-value">{data.xecl.toFixed(4)} AU</span>
              </div>

              <div className="stat-row">
                <span className="stat-label">Heliocentric Y</span>
                <span className="stat-value">{data.yecl.toFixed(4)} AU</span>
              </div>
              
              {data.geocentric && (
                <div className="stat-row">
                  <span className="stat-label">Distance to Earth</span>
                  <span className="stat-value">
                    {Math.sqrt(data.geocentric.xgeo**2 + data.geocentric.ygeo**2 + data.geocentric.zgeo**2).toFixed(4)} AU
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;
