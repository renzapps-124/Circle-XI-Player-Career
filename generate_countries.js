const https = require('https');
const fs = require('fs');

const customCountries = {
    'England': { color: ['#ffffff', '#e50000'], rep: 85 },
    'France': { color: ['#002395', '#ffffff'], rep: 88 },
    'Germany': { color: ['#ffffff', '#000000'], rep: 86 },
    'Spain': { color: ['#c60b1e', '#000000'], rep: 87 },
    'Italy': { color: ['#0064a8', '#ffffff'], rep: 85 },
    'Brazil': { color: ['#fedf00', '#009b3a'], rep: 89 },
    'Argentina': { color: ['#75aadb', '#ffffff'], rep: 87 },
    'Netherlands': { color: ['#f36c21', '#ffffff'], rep: 84 },
    'Portugal': { color: ['#e42518', '#046a38'], rep: 85 },
    'Belgium': { color: ['#e30613', '#000000'], rep: 83 },
    'Croatia': { color: ['#ff0000', '#ffffff'], rep: 81 },
    'Uruguay': { color: ['#55b5e5', '#000000'], rep: 80 },
    'Colombia': { color: ['#fcd116', '#003893'], rep: 78 },
    'USA': { color: ['#ffffff', '#002868'], rep: 75 },
    'Mexico': { color: ['#006341', '#ffffff'], rep: 76 },
    'Senegal': { color: ['#ffffff', '#00853f'], rep: 75 },
    'Morocco': { color: ['#c1272d', '#006233'], rep: 77 },
    'Nigeria': { color: ['#008751', '#ffffff'], rep: 74 },
    'Ghana': { color: ['#ffffff', '#000000'], rep: 73 },
    'Japan': { color: ['#000555', '#ffffff'], rep: 77 },
    'South Korea': { color: ['#ef3340', '#000000'], rep: 76 },
    'Australia': { color: ['#fcd116', '#008751'], rep: 72 },
    'Ivory Coast': { color: ['#f77f00', '#ffffff'], rep: 74 },
    'Cameroon': { color: ['#007a5e', '#ce1126'], rep: 72 },
    'Egypt': { color: ['#ce1126', '#ffffff'], rep: 73 },
    'Algeria': { color: ['#ffffff', '#006233'], rep: 74 },
    'Saudi Arabia': { color: ['#006c35', '#ffffff'], rep: 71 },
    'Iran': { color: ['#ffffff', '#da0000'], rep: 73 },
    'Ecuador': { color: ['#ffdd00', '#034ea2'], rep: 75 },
    'Peru': { color: ['#ffffff', '#d91023'], rep: 74 },
    'Chile': { color: ['#d52b1e', '#0039a6'], rep: 74 },
    'Switzerland': { color: ['#ff0000', '#ffffff'], rep: 79 },
    'Denmark': { color: ['#c60c30', '#ffffff'], rep: 79 },
    'Sweden': { color: ['#ffc90e', '#005293'], rep: 77 },
    'Norway': { color: ['#ef3340', '#00205b'], rep: 77 },
    'Poland': { color: ['#ffffff', '#dc143c'], rep: 76 },
    'Serbia': { color: ['#c6363c', '#ffffff'], rep: 77 },
    'Turkey': { color: ['#e30a17', '#ffffff'], rep: 76 },
    'Wales': { color: ['#d30731', '#ffffff'], rep: 75 },
    'Scotland': { color: ['#001489', '#ffffff'], rep: 74 },
    'Ukraine': { color: ['#ffd700', '#0057b7'], rep: 76 },
    'Austria': { color: ['#ed2939', '#ffffff'], rep: 76 },
    'Hungary': { color: ['#ce2939', '#ffffff'], rep: 75 },
    'Czechia': { color: ['#d7141a', '#11457e'], rep: 74 },
    'Greece': { color: ['#ffffff', '#0d5eaf'], rep: 73 },
    'Ireland': { color: ['#169b62', '#ffffff'], rep: 72 },
    'Canada': { color: ['#ff0000', '#ffffff'], rep: 74 },
    'Costa Rica': { color: ['#ce1126', '#002b7f'], rep: 72 },
    'Jamaica': { color: ['#fed100', '#009b3a'], rep: 70 },
    'Panama': { color: ['#d21034', '#005293'], rep: 70 },
    'South Africa': { color: ['#ffb81c', '#007749'], rep: 71 },
    'Mali': { color: ['#14b53a', '#fcd116'], rep: 72 },
    'Tunisia': { color: ['#e70013', '#ffffff'], rep: 73 },
    'Qatar': { color: ['#8a1538', '#ffffff'], rep: 70 },
    'UAE': { color: ['#ffffff', '#ff0000'], rep: 68 },
    'China': { color: ['#ee1c25', '#ffff00'], rep: 65 },
    'India': { color: ['#0000ff', '#ff9933'], rep: 55 },
    'New Zealand': { color: ['#ffffff', '#000000'], rep: 68 },
    'Montara': { color: ['#1d4ed8', '#f8fafc'], rep: 65 }
};

function getContinent(region, subregion) {
    if (region === 'Americas') {
        if (subregion === 'North America' || subregion === 'Central America' || subregion === 'Caribbean') {
            return 'North America';
        }
        return 'South America';
    }
    return region;
}

function getYouthLabel(rep) {
    if (rep >= 85) return 'Elite';
    if (rep >= 75) return 'Great';
    if (rep >= 65) return 'Good';
    if (rep >= 55) return 'Developing';
    return 'Basic';
}

https.get('https://restcountries.com/v3.1/all', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const countriesData = JSON.parse(data);
        const output = [];

        for (const c of countriesData) {
            let name = c.name?.common || '';
            if (!name) continue;
            
            if (name === 'United States') name = 'USA';
            if (name === 'United Kingdom') continue; // Skip UK, handled manually for football nations
            
            const continent = getContinent(c.region || '', c.subregion || '');
            if (!['Europe', 'South America', 'North America', 'Africa', 'Asia', 'Oceania'].includes(continent)) continue;
            
            const flag = c.flag || '?';
            
            let rep = Math.min(65, Math.floor((c.population || 0) / 1000000) + 30);
            if (rep > 65) rep = 65;
            let colors = ['#ffffff', '#000000'];
            
            if (customCountries[name]) {
                rep = customCountries[name].rep;
                colors = customCountries[name].color;
            }
            
            const tactical = {
                risk: 50 + (rep % 30),
                transition: 60 + (rep % 20),
                control: 40 + (rep % 40),
                defence: 50 + (rep % 30),
                pressing: 45 + (rep % 35)
            };
            
            output.push({
                id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                name: name,
                continent: continent,
                elementId: continent,
                elementIcon: flag,
                youthLabel: getYouthLabel(rep),
                reputation: rep,
                tactical: tactical,
                elementPalette: colors
            });
        }
        
        const extraNations = [
            ['England', '??????????????', 'Europe'],
            ['Wales', '??????????????', 'Europe'],
            ['Scotland', '??????????????', 'Europe'],
            ['Northern Ireland', '????', 'Europe'],
            ['Montara', '?', 'Europe'] // Found in game as a default country
        ];
        
        for (const [nation, flag, continent] of extraNations) {
            if (!output.find(x => x.name === nation)) {
                const rep = customCountries[nation]?.rep || 70;
                const colors = customCountries[nation]?.color || ['#ffffff', '#000000'];
                output.push({
                    id: nation.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                    name: nation,
                    continent: continent,
                    elementId: continent,
                    elementIcon: flag,
                    youthLabel: getYouthLabel(rep),
                    reputation: rep,
                    tactical: { risk: 60, transition: 70, control: 65, defence: 70, pressing: 65 },
                    elementPalette: colors
                });
            }
        }
        
        output.sort((a, b) => a.name.localeCompare(b.name));
        
        let jsCode = '    COUNTRIES: [\n';
        for (const item of output) {
            jsCode += '      ' + JSON.stringify(item) + ',\n';
        }
        jsCode += '    ],\n';
        
        let content = fs.readFileSync('game.js', 'utf-8');
        content = content.replace(/    COUNTRIES: \[\n[\s\S]*?\n    \],\n/, jsCode);
        fs.writeFileSync('game.js', content, 'utf-8');
        
        console.log('Successfully injected ' + output.length + ' countries into game.js.');
    });
});
