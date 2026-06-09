import { calculatePlanetPositions, PLANET_DATA } from './planetMath';

function getAngleBetween(pos1, pos2) {
    if (!pos1 || !pos2) return Infinity;
    const mag1 = Math.sqrt(pos1.xgeo**2 + pos1.ygeo**2 + pos1.zgeo**2);
    const mag2 = Math.sqrt(pos2.xgeo**2 + pos2.ygeo**2 + pos2.zgeo**2);
    const dot = (pos1.xgeo * pos2.xgeo + pos1.ygeo * pos2.ygeo + pos1.zgeo * pos2.zgeo) / (mag1 * mag2);
    return Math.acos(Math.max(-1, Math.min(1, dot))) * 180 / Math.PI;
}

function fineSearch(p1, p2, approximateDate) {
    let minAngle = Infinity;
    let bestDate = approximateDate;

    // Scan 48 hours around the approximate date in 1-hour increments
    for (let h = -24; h <= 24; h++) {
        const testDate = new Date(approximateDate.getTime() + h * 60 * 60 * 1000);
        const positions = calculatePlanetPositions(testDate, 0, 0);
        const pos1 = positions[p1]?.geocentric;
        const pos2 = positions[p2]?.geocentric;
        const angle = getAngleBetween(pos1, pos2);
        
        if (angle < minAngle) {
            minAngle = angle;
            bestDate = testDate;
        }
    }
    return { bestDate, minAngle };
    return { bestDate, minAngle };
}



export function scanForConjunctions(startDate, daysToScan = 365, latitude = 0, longitude = 0) {
    const events = [];
    let eventId = 1;
    const activeConjunctions = {};
    const planets = Object.keys(PLANET_DATA).filter(p => p !== 'Earth');

    // To prevent duplicate scans backwards in time, we'll track the last processed date
    for (let day = 0; day <= daysToScan; day++) {
        const currentDate = new Date(startDate.getTime() + day * 24 * 60 * 60 * 1000);
        // Set to 00:00 UTC for consistent daily sampling
        currentDate.setUTCHours(0, 0, 0, 0);
        
        const positions = calculatePlanetPositions(currentDate, 0, 0);

        for (let i = 0; i < planets.length; i++) {
            for (let j = i + 1; j < planets.length; j++) {
                const p1 = planets[i];
                const p2 = planets[j];
                const pairKey = `${p1}-${p2}`;
                
                const pos1 = positions[p1]?.geocentric;
                const pos2 = positions[p2]?.geocentric;
                const angle = getAngleBetween(pos1, pos2);

                if (angle <= 5) {
                    if (!activeConjunctions[pairKey]) {
                        activeConjunctions[pairKey] = {
                            p1, p2,
                            minAngle: angle,
                            approximateDate: currentDate
                        };
                    } else {
                        if (angle < activeConjunctions[pairKey].minAngle) {
                            activeConjunctions[pairKey].minAngle = angle;
                            activeConjunctions[pairKey].approximateDate = currentDate;
                        }
                    }
                } else {
                    if (activeConjunctions[pairKey]) {
                        // Conjunction ended, finalize it
                        const active = activeConjunctions[pairKey];
                        const { bestDate: rawBestDate, minAngle } = fineSearch(active.p1, active.p2, active.approximateDate);
                        const bestDate = rawBestDate;
                        
                        const dateStr = bestDate.toLocaleString('en-US', { 
                            month: 'short', day: 'numeric', year: 'numeric', 
                            hour: 'numeric', minute: '2-digit', timeZone: 'UTC' 
                        }) + ' UTC';

                        events.push({
                            id: eventId++,
                            title: `${active.p1}-${active.p2} (${dateStr})`,
                            date: bestDate.toISOString(),
                            latitude: 0, // Fallbacks, the app will use its current location if available
                            longitude: 0,
                            elevation: 0,
                            description: `Closest approach: ${minAngle.toFixed(2)}° apart.`,
                            planets: [active.p1, active.p2]
                        });

                        delete activeConjunctions[pairKey];
                    }
                }
            }
        }
    }

    // Flush any still-active conjunctions at the end of the scan
    for (const pairKey in activeConjunctions) {
        const active = activeConjunctions[pairKey];
        const { bestDate: rawBestDate, minAngle } = fineSearch(active.p1, active.p2, active.approximateDate);
        const bestDate = rawBestDate;
        
        const dateStr = bestDate.toLocaleString('en-US', { 
            month: 'short', day: 'numeric', year: 'numeric', 
            hour: 'numeric', minute: '2-digit', timeZone: 'UTC' 
        }) + ' UTC';

        events.push({
            id: eventId++,
            title: `${active.p1}-${active.p2} (${dateStr})`,
            date: bestDate.toISOString(),
            latitude: 0, 
            longitude: 0,
            elevation: 0,
            description: `Closest approach: ${minAngle.toFixed(2)}° apart.`,
            planets: [active.p1, active.p2]
        });
    }

    return events;
}
