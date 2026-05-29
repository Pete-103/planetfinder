import re

def parse_formulas(filepath):
    lines = open(filepath).read().splitlines()
    
    planets = ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune']
    cols = ['E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']
    
    data = {p: {'base': {}, 'adj': {}, 'rev_period': 0} for p in planets}
    
    for line in lines:
        if 'C54:Revolution Period' in line:
            parts = line.split('|')
            for part in parts:
                if ':' in part and not part.startswith('C54'):
                    col = re.search(r'([A-Z])', part).group(1)
                    val = float(part.split(':')[1])
                    if col in cols:
                        data[planets[cols.index(col)]]['rev_period'] = val
        
        # Base elements (rows 55-60)
        base_names = {'55': 'a', '56': 'e', '57': 'i', '58': 'L', '59': 'w_bar', '60': 'W'}
        for row, name in base_names.items():
            if f'55:a' in line or f'{row}:' in line:
                if name == 'a' and '55' not in line: continue
                if name == 'e' and '56' not in line: continue
                if name == 'i' and '57' not in line: continue
                if name == 'L' and '58' not in line: continue
                if name == 'w_bar' and '59' not in line: continue
                if name == 'W' and '60' not in line: continue
                
                parts = line.split('|')
                for part in parts:
                    part = part.strip()
                    if ':' in part:
                        col = part.split(':')[0][0]
                        try:
                            val = float(part.split(':')[1])
                            if col in cols:
                                data[planets[cols.index(col)]]['base'][name] = val
                        except ValueError:
                            pass
                            
        # Adj elements (rows 61-66)
        for row, name in base_names.items():
            adj_row = str(int(row) + 6)
            if f'{adj_row}:' in line:
                parts = line.split('|')
                for part in parts:
                    part = part.strip()
                    if ':' in part:
                        col = part.split(':')[0][0]
                        try:
                            val = float(part.split(':')[1])
                            if col in cols:
                                data[planets[cols.index(col)]]['adj'][name] = val
                        except ValueError:
                            pass

    js_code = "export const PLANET_DATA = {\n"
    for p in planets:
        js_code += f"  {p}: {{\n"
        js_code += f"    rev_period: {data[p]['rev_period']},\n"
        js_code += f"    base: {data[p]['base']},\n"
        js_code += f"    adj: {data[p]['adj']}\n"
        js_code += "  },\n"
    js_code += "};\n\n"
    
    js_code += """
export function calculatePlanetPositions(date) {
    const J2000 = new Date(Date.UTC(2000, 0, 1, 11, 58, 55, 816));
    const JD_2000 = 2451545.0;
    
    // Difference in days
    const diffDays = (date - J2000) / (1000 * 60 * 60 * 24);
    const T = diffDays / 36525.0;
    
    const results = {};
    
    for (const [planet, data] of Object.entries(PLANET_DATA)) {
        // Calculate current elements
        const a = data.base.a + data.adj.a * T;
        const e = data.base.e + data.adj.e * T;
        let i = data.base.i + data.adj.i * T;
        let L = data.base.L + data.adj.L * T;
        let w_bar = data.base.w_bar + data.adj.w_bar * T;
        let W = data.base.W + data.adj.W * T;
        
        // Convert to radians
        const rad = Math.PI / 180;
        i *= rad;
        L *= rad;
        w_bar *= rad;
        W *= rad;
        
        const w = w_bar - W;
        let M = L - w_bar;
        // Normalize M to [0, 2PI]
        M = M % (2 * Math.PI);
        if (M < 0) M += 2 * Math.PI;
        
        // Solve Kepler's equation: E = M + e * sin(E)
        let E = M + e * Math.sin(M);
        for (let iter = 0; iter < 10; iter++) {
            E = M + e * Math.sin(E);
        }
        
        // Heliocentric coordinates in orbital plane
        const x_prime = a * (Math.cos(E) - e);
        const y_prime = a * Math.sqrt(1 - e*e) * Math.sin(E);
        
        // Heliocentric ecliptic coordinates
        const xecl = x_prime * (Math.cos(w)*Math.cos(W) - Math.sin(w)*Math.sin(W)*Math.cos(i)) - y_prime * (Math.sin(w)*Math.cos(W) + Math.cos(w)*Math.sin(W)*Math.cos(i));
        const yecl = x_prime * (Math.cos(w)*Math.sin(W) + Math.sin(w)*Math.cos(W)*Math.cos(i)) - y_prime * (Math.sin(w)*Math.sin(W) - Math.cos(w)*Math.cos(W)*Math.cos(i));
        const zecl = x_prime * (Math.sin(w)*Math.sin(i)) + y_prime * (Math.cos(w)*Math.sin(i));
        
        results[planet] = { xecl, yecl, zecl, a, e, i, M, E };
    }
    
    // Obliquity of the ecliptic
    const obliq = 23.43928 * Math.PI / 180;
    
    // Equatorial coordinates
    for (const planet in results) {
        const { xecl, yecl, zecl } = results[planet];
        const xeq = xecl;
        const yeq = yecl * Math.cos(obliq) - zecl * Math.sin(obliq);
        const zeq = yecl * Math.sin(obliq) + zecl * Math.cos(obliq);
        results[planet].xeq = xeq;
        results[planet].yeq = yeq;
        results[planet].zeq = zeq;
    }
    
    // Geocentric coordinates
    const earth = results['Earth'];
    for (const planet in results) {
        if (planet === 'Earth') continue;
        const xgeo = results[planet].xeq - earth.xeq;
        const ygeo = results[planet].yeq - earth.yeq;
        const zgeo = results[planet].zeq - earth.zeq;
        
        // Right Ascension and Declination
        let RA = Math.atan2(ygeo, xgeo);
        if (RA < 0) RA += 2 * Math.PI;
        const RA_hours = RA * 24 / (2 * Math.PI);
        
        const decl = Math.atan2(zgeo, Math.sqrt(xgeo*xgeo + ygeo*ygeo));
        const decl_deg = decl * 180 / Math.PI;
        
        results[planet].geocentric = { xgeo, ygeo, zgeo };
        results[planet].RA_hours = RA_hours;
        results[planet].decl_deg = decl_deg;
    }
    
    return results;
}
"""
    open('src/planetMath.js', 'w').write(js_code)
    print("planetMath.js generated")

if __name__ == "__main__":
    parse_formulas('formulas.txt')
