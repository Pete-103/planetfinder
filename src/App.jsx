import React, { useState, useEffect } from 'react';
import { calculatePlanetPositions, PLANET_DATA } from './planetMath';
import SkyMap from './SkyMap';
import ThreeDView from './ThreeDView';
import LocalSkyView from './LocalSkyView';
import { UPCOMING_EVENTS } from './eventsData';
import './ThreeDView.css';
import './index.css';

const getImageSrc = (planet) => {
  const jpgPlanets = ['Venus', 'Mars', 'Jupiter', 'Saturn', 'Sun'];
  if (jpgPlanets.includes(planet)) {
    return `/planets/${planet}.jpg`;
  }
  return `/planets/${planet}.png`;
};

function App() {
  const [date, setDate] = useState(() => {
    const now = new Date();
    now.setHours(22, 0, 0, 0);
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  });
  const [planetData, setPlanetData] = useState({});
  const [viewType, setViewType] = useState('Local-Horizon'); // 'Local-Horizon', '2D', '3D-SolarSystem', '3D-CelestialSphere'
  const [selectedEventId, setSelectedEventId] = useState("");
  const [playbackRate, setPlaybackRate] = useState(0); // Hours per 100ms tick
  
  // Location state
  const [latitude, setLatitude] = useState(0);
  const [longitude, setLongitude] = useState(0);
  const [elevation, setElevation] = useState(0); // in meters, currently not used in math but stored per requirement

  const useCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude.toFixed(4));
          setLongitude(position.coords.longitude.toFixed(4));
          if (position.coords.altitude !== null) {
            setElevation(position.coords.altitude.toFixed(0));
          }
        },
        (error) => {
          console.error("Error obtaining location:", error);
          alert("Could not get current location. Please enable Location Services.");
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  useEffect(() => {
    // Try to get location on initial load
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude.toFixed(4));
          setLongitude(position.coords.longitude.toFixed(4));
          if (position.coords.altitude !== null) {
            setElevation(position.coords.altitude.toFixed(0));
          }
        },
        (error) => {
          console.warn("Initial location fetch failed or denied.", error);
        }
      );
    }
  }, []);

  useEffect(() => {
    const selectedDate = new Date(date);
    if (!isNaN(selectedDate)) {
      const data = calculatePlanetPositions(selectedDate, parseFloat(latitude), parseFloat(longitude));
      setPlanetData(data);
    }
  }, [date, latitude, longitude]);

  useEffect(() => {
    if (playbackRate === 0) return;
    
    const interval = setInterval(() => {
      setDate(prevDateStr => {
        const d = new Date(prevDateStr);
        if (isNaN(d)) return prevDateStr;
        
        // Add playbackRate hours
        d.setHours(d.getHours() + playbackRate);
        
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      });
    }, 2000);
    
    return () => clearInterval(interval);
  }, [playbackRate]);

  const handleDateChange = (e) => {
    setDate(e.target.value);
  };

  const handleLocationChange = (e) => {
    const { name, value } = e.target;
    if (name === 'latitude') setLatitude(value);
    if (name === 'longitude') setLongitude(value);
    if (name === 'elevation') setElevation(value);
  };

  const handleHighlightSelect = (e) => {
    const eventId = e.target.value;
    setSelectedEventId(eventId);
    
    if (eventId) {
      const event = UPCOMING_EVENTS.find(ev => ev.id === parseInt(eventId, 10));
      if (event) {
        setDate(event.date);
        setLatitude(event.latitude);
        setLongitude(event.longitude);
        setElevation(event.elevation || 0);
        setViewType('Local-Horizon');
      }
    }
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
  // Add Sun to the list of planets to display its stats if available
  if (planetData['Sun'] && !planetsList.includes('Sun')) {
    planetsList.push('Sun');
  }

  return (
    <div className="app-container">
      <header>
        <h1>PlanetFinder Dashboard</h1>
        <p>Explore Keplerian Planetary Positions in Real-Time</p>
      </header>

      <div className="controls">
        <div className="settings-panel">
          <div className="setting-group">
            <label htmlFor="datetime" className="stat-label">Date & Time:</label>
            <input 
              type="datetime-local" 
              id="datetime"
              className="date-picker"
              value={date}
              onChange={handleDateChange}
            />
            <div className="playback-controls" style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', justifyContent: 'center' }}>
              <button type="button" className="loc-btn" style={{ padding: '0.25rem 0.5rem', minWidth: '40px', background: playbackRate === -24 ? '#3b82f6' : '' }} onClick={() => setPlaybackRate(playbackRate === -24 ? 0 : -24)} title="Fast Backward (-1 day/tick)">⏪</button>
              <button type="button" className="loc-btn" style={{ padding: '0.25rem 0.5rem', minWidth: '40px', background: playbackRate === -1 ? '#3b82f6' : '' }} onClick={() => setPlaybackRate(playbackRate === -1 ? 0 : -1)} title="Play Backward (-1 hr/tick)">◀️</button>
              <button type="button" className="loc-btn" style={{ padding: '0.25rem 0.5rem', minWidth: '40px', background: playbackRate === 0 ? '#3b82f6' : '' }} onClick={() => setPlaybackRate(0)} title="Pause">⏸️</button>
              <button type="button" className="loc-btn" style={{ padding: '0.25rem 0.5rem', minWidth: '40px', background: playbackRate === 1 ? '#3b82f6' : '' }} onClick={() => setPlaybackRate(playbackRate === 1 ? 0 : 1)} title="Play Forward (+1 hr/tick)">▶️</button>
              <button type="button" className="loc-btn" style={{ padding: '0.25rem 0.5rem', minWidth: '40px', background: playbackRate === 24 ? '#3b82f6' : '' }} onClick={() => setPlaybackRate(playbackRate === 24 ? 0 : 24)} title="Fast Forward (+1 day/tick)">⏩</button>
            </div>
          </div>
          
          <div className="setting-group location-group">
            <div className="location-inputs">
              <div className="loc-input">
                <label className="stat-label">Lat:</label>
                <input type="number" name="latitude" value={latitude} onChange={handleLocationChange} step="0.0001" />
              </div>
              <div className="loc-input">
                <label className="stat-label">Lon:</label>
                <input type="number" name="longitude" value={longitude} onChange={handleLocationChange} step="0.0001" />
              </div>
              <div className="loc-input">
                <label className="stat-label">Alt(m):</label>
                <input type="number" name="elevation" value={elevation} onChange={handleLocationChange} step="1" />
              </div>
            </div>
            <div className="location-buttons">
              <button type="button" onClick={useCurrentLocation} className="loc-btn">Use Current Location</button>
            </div>
          </div>

          <div className="setting-group highlight-group" style={{marginTop: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <label className="stat-label" style={{margin: 0}}>Upcoming Planetary Events:</label>
              {selectedEventId && (
                <button 
                  type="button" 
                  onClick={() => setSelectedEventId("")}
                  style={{background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '1.25rem', lineHeight: '1', padding: '0'}}
                  title="Clear selection"
                >
                  &times;
                </button>
              )}
            </div>
            <select 
              value={selectedEventId} 
              onChange={handleHighlightSelect}
              style={{width: '100%', padding: '0.5rem', marginTop: '0.5rem', background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '4px'}}
            >
              <option value="">-- Select an Event --</option>
              {UPCOMING_EVENTS.map(ev => (
                <option key={ev.id} value={ev.id}>{ev.title}</option>
              ))}
            </select>
            
            {selectedEventId && (
              <div style={{marginTop: '1rem', fontSize: '0.9rem', color: '#d1d5db', position: 'relative', background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '6px'}}>
                {(() => {
                  const ev = UPCOMING_EVENTS.find(e => e.id === parseInt(selectedEventId, 10));
                  if (!ev) return null;
                  return (
                    <>
                      <p style={{marginBottom: '0.5rem'}}>{ev.description}</p>
                      <div style={{display: 'flex', flexWrap: 'wrap', gap: '0.5rem'}}>
                        {ev.planets && ev.planets.map(p => (
                          <span key={p} style={{background: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd', padding: '0.2rem 0.5rem', borderRadius: '999px', fontSize: '0.8rem'}}>{p}</span>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
        
        <div className="view-selector">
          <button 
            className={`view-btn ${viewType === 'Local-Horizon' ? 'active' : ''}`}
            onClick={() => setViewType('Local-Horizon')}
          >Local Horizon</button>
          <button 
            className={`view-btn ${viewType === '2D' ? 'active' : ''}`}
            onClick={() => setViewType('2D')}
          >2D Sky Map</button>
          <button 
            className={`view-btn ${viewType === '3D-SolarSystem' ? 'active' : ''}`}
            onClick={() => setViewType('3D-SolarSystem')}
          >3D Solar System</button>
          <button 
            className={`view-btn ${viewType === '3D-CelestialSphere' ? 'active' : ''}`}
            onClick={() => setViewType('3D-CelestialSphere')}
          >3D Celestial Sphere</button>
        </div>
      </div>

      {viewType === '2D' ? (
        <SkyMap planetData={planetData} />
      ) : viewType === 'Local-Horizon' ? (
        <div className="view-container">
          <LocalSkyView date={date} latitude={latitude} longitude={longitude} elevation={elevation} planetData={planetData} focusPlanets={selectedEventId ? UPCOMING_EVENTS.find(e => e.id === parseInt(selectedEventId, 10))?.planets : null} />
        </div>
      ) : (
        <ThreeDView planetData={planetData} viewType={viewType} />
      )}

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

              {data.altitude !== undefined && viewType === 'Local-Horizon' && (
                <>
                  <div className="stat-row">
                    <span className="stat-label">Altitude</span>
                    <span className="stat-value">{data.altitude.toFixed(2)}°</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">Azimuth</span>
                    <span className="stat-value">{data.azimuth.toFixed(2)}°</span>
                  </div>
                </>
              )}

              {data.xecl !== undefined && viewType !== 'Local-Horizon' && (
                <>
                  <div className="stat-row">
                    <span className="stat-label">Heliocentric X</span>
                    <span className="stat-value">{data.xecl.toFixed(4)} AU</span>
                  </div>

                  <div className="stat-row">
                    <span className="stat-label">Heliocentric Y</span>
                    <span className="stat-value">{data.yecl.toFixed(4)} AU</span>
                  </div>
                </>
              )}
              
              {data.geocentric && viewType !== 'Local-Horizon' && (
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
