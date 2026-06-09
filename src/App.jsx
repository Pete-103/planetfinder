import React, { useState, useEffect } from 'react';
import { calculatePlanetPositions, getSunsetTime } from './planetMath';
import LocalSkyView from './LocalSkyView';
import './index.css';

function App() {
  const [date, setDate] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const ms = String(now.getMilliseconds()).padStart(3, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${ms}`;
  });
  const [planetData, setPlanetData] = useState({});
  const [playbackRate, setPlaybackRate] = useState(0); // Hours per 100ms tick
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Location state
  const [latitude, setLatitude] = useState(0);
  const [longitude, setLongitude] = useState(0);
  useEffect(() => {
    // Try to get location on initial load
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLat = position.coords.latitude;
          const newLon = position.coords.longitude;
          setLatitude(newLat.toFixed(3));
          setLongitude(newLon.toFixed(3));
          
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
          setIsInitialized(true);
        },
        (error) => {
          console.warn("Initial location fetch failed or denied.", error);
          setIsInitialized(true);
        },
        { timeout: 10000 }
      );
    } else {
      setIsInitialized(true);
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

  const handleDateOnlyChange = (e) => {
    if (!e.target.value) return;
    setDate(`${e.target.value}T${date.substring(11)}`);
  };

  const handleTimeOnlyChange = (e) => {
    let val = e.target.value;
    if (!val) return;
    if (val.length === 5) val += ':00';
    setDate(`${date.substring(0, 10)}T${val}.000`);
  };

  const handleLocationChange = (e) => {
    const { name, value } = e.target;
    if (name === 'latitude') setLatitude(value);
    if (name === 'longitude') setLongitude(value);
  };

  if (!isInitialized) {
    return null;
  }

  return (
    <div className="app-container">
      <div className="main-view-wrapper" style={{ position: 'relative', width: '100%', height: '70vh', minHeight: '500px', marginBottom: '2rem', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
        
        {/* Floating Controls Overlay */}
        <div className="floating-controls" style={{ position: 'absolute', top: '10px', left: '10px', right: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 10, pointerEvents: 'none' }}>
          
          {/* Date & Time Overlay */}
          <div className="datetime-overlay" style={{ background: 'rgba(20, 25, 40, 0.8)', padding: '0.5rem', borderRadius: '8px', pointerEvents: 'auto', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
              <input 
                type="date" 
                className="date-picker"
                value={date.substring(0, 10)}
                onChange={handleDateOnlyChange}
                style={{ width: '45%', padding: '0.4rem', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.2)', color: '#fff' }}
              />
              <input 
                type="time" 
                step="1"
                className="date-picker"
                value={date.substring(11, 19)}
                onChange={handleTimeOnlyChange}
                style={{ width: '45%', padding: '0.4rem', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.2)', color: '#fff' }}
              />
              <span style={{ fontSize: '0.8rem', color: '#ccc', fontWeight: 'bold' }}>
                {new Date().toLocaleTimeString('en-us', { timeZoneName: 'short' }).split(' ').pop()}
              </span>
            </div>
            <div className="location-quick-inputs" style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', justifyContent: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.8rem', color: '#ccc' }}>Lat</label>
                <input type="number" name="latitude" value={latitude} onChange={handleLocationChange} step="0.001" title="Latitude" style={{ width: '80px', padding: '0.4rem', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.2)', color: '#fff' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.8rem', color: '#ccc' }}>Lon</label>
                <input type="number" name="longitude" value={longitude} onChange={handleLocationChange} step="0.001" title="Longitude" style={{ width: '80px', padding: '0.4rem', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.2)', color: '#fff' }} />
              </div>
            </div>
            <div className="playback-controls" style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
              <button type="button" className="loc-btn" style={{ padding: '0.4rem', minWidth: '45px', fontSize: '1.2rem', margin: 0, background: playbackRate === -24 ? '#3b82f6' : '' }} onClick={() => setPlaybackRate(playbackRate === -24 ? 0 : -24)} title="Fast Backward (-1 day/tick)">⏪</button>
              <button type="button" className="loc-btn" style={{ padding: '0.4rem', minWidth: '45px', fontSize: '1.2rem', margin: 0, background: playbackRate === -1 ? '#3b82f6' : '' }} onClick={() => setPlaybackRate(playbackRate === -1 ? 0 : -1)} title="Play Backward (-1 hr/tick)">◀️</button>
              <button type="button" className="loc-btn" style={{ padding: '0.4rem', minWidth: '45px', fontSize: '1.2rem', margin: 0, background: playbackRate === 0 ? '#3b82f6' : '' }} onClick={() => setPlaybackRate(0)} title="Pause">⏸️</button>
              <button type="button" className="loc-btn" style={{ padding: '0.4rem', minWidth: '45px', fontSize: '1.2rem', margin: 0, background: playbackRate === 1 ? '#3b82f6' : '' }} onClick={() => setPlaybackRate(playbackRate === 1 ? 0 : 1)} title="Play Forward (+1 hr/tick)">▶️</button>
              <button type="button" className="loc-btn" style={{ padding: '0.4rem', minWidth: '45px', fontSize: '1.2rem', margin: 0, background: playbackRate === 24 ? '#3b82f6' : '' }} onClick={() => setPlaybackRate(playbackRate === 24 ? 0 : 24)} title="Fast Forward (+1 day/tick)">⏩</button>
          </div>
          </div>
        </div>



        {/* Main View */}
        <div className="view-container" style={{height: '100%'}}>
          <LocalSkyView date={date} latitude={latitude} longitude={longitude} planetData={planetData} />
        </div>

      </div>
    </div>
  );
}

export default App;
