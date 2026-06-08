import React, { useState, useEffect } from 'react';
import { calculatePlanetPositions, PLANET_DATA, getSunsetTime } from './planetMath';
import SkyMap from './SkyMap';
import ThreeDView from './ThreeDView';
import LocalSkyView from './LocalSkyView';
import { UPCOMING_EVENTS } from './eventsData';
import { Settings, X } from 'lucide-react';
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
    const sunset = getSunsetTime(now, 0, 0); // Default to lat=0, lon=0
    sunset.setMinutes(sunset.getMinutes() + 20);
    const year = sunset.getFullYear();
    const month = String(sunset.getMonth() + 1).padStart(2, '0');
    const day = String(sunset.getDate()).padStart(2, '0');
    const hours = String(sunset.getHours()).padStart(2, '0');
    const minutes = String(sunset.getMinutes()).padStart(2, '0');
    const seconds = String(sunset.getSeconds()).padStart(2, '0');
    const ms = String(sunset.getMilliseconds()).padStart(3, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${ms}`;
  });
  const [planetData, setPlanetData] = useState({});
  const [viewType, setViewType] = useState('Local-Horizon'); // 'Local-Horizon', '2D', '3D-SolarSystem', '3D-CelestialSphere'
  const [selectedEventId, setSelectedEventId] = useState("");
  const [playbackRate, setPlaybackRate] = useState(0); // Hours per 100ms tick
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [hoveredPlanet, setHoveredPlanet] = useState(null);
  
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
          const newLat = position.coords.latitude;
          const newLon = position.coords.longitude;
          setLatitude(newLat.toFixed(4));
          setLongitude(newLon.toFixed(4));
          if (position.coords.altitude !== null) {
            setElevation(position.coords.altitude.toFixed(0));
          }
          
          // Now that we have location, calculate sunset time for today
          const now = new Date();
          const sunset = getSunsetTime(now, newLat, newLon);
          sunset.setMinutes(sunset.getMinutes() + 20);
          
          const year = sunset.getFullYear();
          const month = String(sunset.getMonth() + 1).padStart(2, '0');
          const day = String(sunset.getDate()).padStart(2, '0');
          const hours = String(sunset.getHours()).padStart(2, '0');
          const minutes = String(sunset.getMinutes()).padStart(2, '0');
          const seconds = String(sunset.getSeconds()).padStart(2, '0');
          const ms = String(sunset.getMilliseconds()).padStart(3, '0');
          setDate(`${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${ms}`);
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

    if (Math.abs(playbackRate) >= 24) {
      // Discrete steps for large automation to see frames exactly 24 hours apart
      const interval = setInterval(() => {
        setDate(prevDateStr => {
          const d = new Date(prevDateStr);
          if (isNaN(d)) return prevDateStr;
          
          d.setHours(d.getHours() + playbackRate);
          
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          const hours = String(d.getHours()).padStart(2, '0');
          const minutes = String(d.getMinutes()).padStart(2, '0');
          const seconds = String(d.getSeconds()).padStart(2, '0');
          const ms = String(d.getMilliseconds()).padStart(3, '0');
          return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${ms}`;
        });
      }, 1000); // Step every 1000ms for day-by-day views
      return () => clearInterval(interval);
    } else {
      // Smooth animation for small automation (e.g. 1 hour/tick)
      let lastTime = performance.now();
      let animationFrameId;

      const animate = (time) => {
        const deltaMs = time - lastTime;
        lastTime = time;

        setDate(prevDateStr => {
          const d = new Date(prevDateStr);
          if (isNaN(d)) return prevDateStr;
          
          d.setTime(d.getTime() + playbackRate * 900 * deltaMs);
          
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          const hours = String(d.getHours()).padStart(2, '0');
          const minutes = String(d.getMinutes()).padStart(2, '0');
          const seconds = String(d.getSeconds()).padStart(2, '0');
          const ms = String(d.getMilliseconds()).padStart(3, '0');
          return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${ms}`;
        });

        animationFrameId = requestAnimationFrame(animate);
      };

      animationFrameId = requestAnimationFrame(animate);
      
      return () => cancelAnimationFrame(animationFrameId);
    }
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
      <div className="main-view-wrapper" style={{ position: 'relative', width: '100%', height: '70vh', minHeight: '500px', marginBottom: '2rem', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
        
        {/* Floating Controls Overlay */}
        <div className="floating-controls" style={{ position: 'absolute', top: '10px', left: '10px', right: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 10, pointerEvents: 'none' }}>
          
          {/* Date & Time Overlay */}
          <div className="datetime-overlay" style={{ background: 'rgba(20, 25, 40, 0.8)', padding: '0.5rem', borderRadius: '8px', pointerEvents: 'auto', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <input 
              type="datetime-local" 
              id="datetime"
              className="date-picker"
              step="1"
              value={date.substring(0, 19)}
              onChange={handleDateChange}
              style={{ marginBottom: '0.5rem', width: '100%', padding: '0.5rem', fontSize: '0.9rem' }}
            />
            <div className="playback-controls" style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
              <button type="button" className="loc-btn" style={{ padding: '0.25rem', minWidth: '30px', margin: 0, background: playbackRate === -24 ? '#3b82f6' : '' }} onClick={() => setPlaybackRate(playbackRate === -24 ? 0 : -24)} title="Fast Backward (-1 day/tick)">⏪</button>
              <button type="button" className="loc-btn" style={{ padding: '0.25rem', minWidth: '30px', margin: 0, background: playbackRate === -1 ? '#3b82f6' : '' }} onClick={() => setPlaybackRate(playbackRate === -1 ? 0 : -1)} title="Play Backward (-1 hr/tick)">◀️</button>
              <button type="button" className="loc-btn" style={{ padding: '0.25rem', minWidth: '30px', margin: 0, background: playbackRate === 0 ? '#3b82f6' : '' }} onClick={() => setPlaybackRate(0)} title="Pause">⏸️</button>
              <button type="button" className="loc-btn" style={{ padding: '0.25rem', minWidth: '30px', margin: 0, background: playbackRate === 1 ? '#3b82f6' : '' }} onClick={() => setPlaybackRate(playbackRate === 1 ? 0 : 1)} title="Play Forward (+1 hr/tick)">▶️</button>
              <button type="button" className="loc-btn" style={{ padding: '0.25rem', minWidth: '30px', margin: 0, background: playbackRate === 24 ? '#3b82f6' : '' }} onClick={() => setPlaybackRate(playbackRate === 24 ? 0 : 24)} title="Fast Forward (+1 day/tick)">⏩</button>
            </div>
          </div>

          {/* Settings Button Overlay */}
          <button 
            type="button" 
            onClick={() => setIsSettingsOpen(true)}
            style={{ background: 'rgba(20, 25, 40, 0.8)', border: '1px solid rgba(255,255,255,0.2)', padding: '0.5rem', borderRadius: '50%', color: '#fff', cursor: 'pointer', pointerEvents: 'auto', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Settings"
          >
            <Settings size={24} />
          </button>
        </div>

        {/* Main View */}
        {viewType === '2D' ? (
          <SkyMap planetData={planetData} setHoveredPlanet={setHoveredPlanet} />
        ) : viewType === 'Local-Horizon' ? (
          <div className="view-container" style={{height: '100%'}}>
            <LocalSkyView date={date} latitude={latitude} longitude={longitude} elevation={elevation} planetData={planetData} focusPlanets={selectedEventId ? UPCOMING_EVENTS.find(e => e.id === parseInt(selectedEventId, 10))?.planets : null} setHoveredPlanet={setHoveredPlanet} />
          </div>
        ) : (
          <ThreeDView planetData={planetData} viewType={viewType} setHoveredPlanet={setHoveredPlanet} />
        )}
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="settings-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(5px)' }}>
          <div className="settings-modal-content" style={{ background: '#111827', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '500px', border: '1px solid rgba(255,255,255,0.1)', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            <button 
              onClick={() => setIsSettingsOpen(false)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>
            
            <h2 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#fff' }}>Settings</h2>
            
            <div className="setting-group location-group" style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
              <h3 style={{ fontSize: '1rem', margin: '0 0 1rem 0' }}>Location</h3>
              <div className="location-inputs" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="loc-input" style={{flexDirection: 'column', alignItems: 'flex-start'}}>
                  <label className="stat-label">Latitude</label>
                  <input type="number" name="latitude" value={latitude} onChange={handleLocationChange} step="0.0001" style={{width: '100%', marginTop: '4px'}} />
                </div>
                <div className="loc-input" style={{flexDirection: 'column', alignItems: 'flex-start'}}>
                  <label className="stat-label">Longitude</label>
                  <input type="number" name="longitude" value={longitude} onChange={handleLocationChange} step="0.0001" style={{width: '100%', marginTop: '4px'}} />
                </div>
                <div className="loc-input" style={{flexDirection: 'column', alignItems: 'flex-start'}}>
                  <label className="stat-label">Altitude (m)</label>
                  <input type="number" name="elevation" value={elevation} onChange={handleLocationChange} step="1" style={{width: '100%', marginTop: '4px'}} />
                </div>
              </div>
              <div className="location-buttons" style={{ marginTop: '1rem' }}>
                <button type="button" onClick={useCurrentLocation} className="loc-btn" style={{ width: '100%', margin: 0 }}>Use Current Location</button>
              </div>
            </div>

            <div className="setting-group" style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
              <h3 style={{ fontSize: '1rem', margin: '0 0 1rem 0' }}>Select View</h3>
              <div className="view-selector" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button className={`view-btn ${viewType === 'Local-Horizon' ? 'active' : ''}`} style={{padding: '0.75rem', borderRadius: '6px', background: viewType === 'Local-Horizon' ? '#3b82f6' : 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer'}} onClick={() => {setViewType('Local-Horizon'); setIsSettingsOpen(false);}}>Local Horizon</button>
                <button className={`view-btn ${viewType === '2D' ? 'active' : ''}`} style={{padding: '0.75rem', borderRadius: '6px', background: viewType === '2D' ? '#3b82f6' : 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer'}} onClick={() => {setViewType('2D'); setIsSettingsOpen(false);}}>2D Sky Map</button>
                <button className={`view-btn ${viewType === '3D-SolarSystem' ? 'active' : ''}`} style={{padding: '0.75rem', borderRadius: '6px', background: viewType === '3D-SolarSystem' ? '#3b82f6' : 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer'}} onClick={() => {setViewType('3D-SolarSystem'); setIsSettingsOpen(false);}}>3D Solar System</button>
                <button className={`view-btn ${viewType === '3D-CelestialSphere' ? 'active' : ''}`} style={{padding: '0.75rem', borderRadius: '6px', background: viewType === '3D-CelestialSphere' ? '#3b82f6' : 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer'}} onClick={() => {setViewType('3D-CelestialSphere'); setIsSettingsOpen(false);}}>3D Celestial Sphere</button>
              </div>
            </div>

            <div className="setting-group highlight-group" style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
              <h3 style={{ fontSize: '1rem', margin: '0 0 1rem 0' }}>Upcoming Events</h3>
              <select 
                value={selectedEventId} 
                onChange={(e) => { handleHighlightSelect(e); setIsSettingsOpen(false); }}
                style={{width: '100%', padding: '0.75rem', background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '4px'}}
              >
                <option value="">-- Select an Event --</option>
                {UPCOMING_EVENTS.map(ev => (
                  <option key={ev.id} value={ev.id}>{ev.title}</option>
                ))}
              </select>
            </div>

          </div>
        </div>
      )}

      {/* Floating Info Card */}
      {hoveredPlanet && planetData[hoveredPlanet] && (
        <div className="hover-info-card planet-card" style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 100, width: '90%', maxWidth: '350px', margin: 0, pointerEvents: 'none' }}>
          <div className="planet-header" style={{ marginBottom: '1rem', flexDirection: 'row', justifyContent: 'center' }}>
            <div className="planet-icon" style={{backgroundImage: `url(${getImageSrc(hoveredPlanet)})`, width: '32px', height: '32px', boxShadow: 'none'}}></div>
            <h2 className="planet-name" style={{fontSize: '1.4rem'}}>{hoveredPlanet}</h2>
          </div>
          
          {planetData[hoveredPlanet].RA_hours !== undefined && (
            <div className="stat-row">
              <span className="stat-label">Right Ascension</span>
              <span className="stat-value">{formatRA(planetData[hoveredPlanet].RA_hours)}</span>
            </div>
          )}
          
          {planetData[hoveredPlanet].decl_deg !== undefined && (
            <div className="stat-row">
              <span className="stat-label">Declination</span>
              <span className="stat-value">{formatDecl(planetData[hoveredPlanet].decl_deg)}</span>
            </div>
          )}

          {planetData[hoveredPlanet].altitude !== undefined && viewType === 'Local-Horizon' && (
            <>
              <div className="stat-row">
                <span className="stat-label">Altitude</span>
                <span className="stat-value">{planetData[hoveredPlanet].altitude.toFixed(2)}°</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Azimuth</span>
                <span className="stat-value">{planetData[hoveredPlanet].azimuth.toFixed(2)}°</span>
              </div>
            </>
          )}

          {planetData[hoveredPlanet].xecl !== undefined && viewType !== 'Local-Horizon' && (
            <>
              <div className="stat-row">
                <span className="stat-label">Heliocentric X</span>
                <span className="stat-value">{planetData[hoveredPlanet].xecl.toFixed(4)} AU</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Heliocentric Y</span>
                <span className="stat-value">{planetData[hoveredPlanet].yecl.toFixed(4)} AU</span>
              </div>
            </>
          )}
          
          {planetData[hoveredPlanet].geocentric && viewType !== 'Local-Horizon' && (
            <div className="stat-row">
              <span className="stat-label">Distance to Earth</span>
              <span className="stat-value">
                {Math.sqrt(planetData[hoveredPlanet].geocentric.xgeo**2 + planetData[hoveredPlanet].geocentric.ygeo**2 + planetData[hoveredPlanet].geocentric.zgeo**2).toFixed(4)} AU
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
