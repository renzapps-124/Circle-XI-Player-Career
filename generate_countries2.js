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

const countryList = [
    // Europe
    ["Albania", "Europe", "????"], ["Andorra", "Europe", "????"], ["Armenia", "Europe", "????"], ["Austria", "Europe", "????"], ["Azerbaijan", "Europe", "????"], ["Belarus", "Europe", "????"], ["Belgium", "Europe", "????"], ["Bosnia and Herzegovina", "Europe", "????"], ["Bulgaria", "Europe", "????"], ["Croatia", "Europe", "????"], ["Cyprus", "Europe", "????"], ["Czechia", "Europe", "????"], ["Denmark", "Europe", "????"], ["England", "Europe", "ENG"], ["Estonia", "Europe", "????"], ["Finland", "Europe", "????"], ["France", "Europe", "????"], ["Georgia", "Europe", "????"], ["Germany", "Europe", "????"], ["Greece", "Europe", "????"], ["Hungary", "Europe", "????"], ["Iceland", "Europe", "????"], ["Ireland", "Europe", "????"], ["Italy", "Europe", "????"], ["Kazakhstan", "Europe", "????"], ["Kosovo", "Europe", "????"], ["Latvia", "Europe", "????"], ["Liechtenstein", "Europe", "????"], ["Lithuania", "Europe", "????"], ["Luxembourg", "Europe", "????"], ["Malta", "Europe", "????"], ["Moldova", "Europe", "????"], ["Monaco", "Europe", "????"], ["Montenegro", "Europe", "????"], ["Netherlands", "Europe", "????"], ["North Macedonia", "Europe", "????"], ["Northern Ireland", "Europe", "NIR"], ["Norway", "Europe", "????"], ["Poland", "Europe", "????"], ["Portugal", "Europe", "????"], ["Romania", "Europe", "????"], ["Russia", "Europe", "????"], ["San Marino", "Europe", "????"], ["Scotland", "Europe", "SCO"], ["Serbia", "Europe", "????"], ["Slovakia", "Europe", "????"], ["Slovenia", "Europe", "????"], ["Spain", "Europe", "????"], ["Sweden", "Europe", "????"], ["Switzerland", "Europe", "????"], ["Turkey", "Europe", "????"], ["Ukraine", "Europe", "????"], ["Wales", "Europe", "WAL"], ["Montara", "Europe", "MT"],
    // South America
    ["Argentina", "South America", "????"], ["Bolivia", "South America", "????"], ["Brazil", "South America", "????"], ["Chile", "South America", "????"], ["Colombia", "South America", "????"], ["Ecuador", "South America", "????"], ["Guyana", "South America", "????"], ["Paraguay", "South America", "????"], ["Peru", "South America", "????"], ["Suriname", "South America", "????"], ["Uruguay", "South America", "????"], ["Venezuela", "South America", "????"],
    // North America
    ["Antigua and Barbuda", "North America", "????"], ["Bahamas", "North America", "????"], ["Barbados", "North America", "????"], ["Belize", "North America", "????"], ["Canada", "North America", "????"], ["Costa Rica", "North America", "????"], ["Cuba", "North America", "????"], ["Dominica", "North America", "????"], ["Dominican Republic", "North America", "????"], ["El Salvador", "North America", "????"], ["Grenada", "North America", "????"], ["Guatemala", "North America", "????"], ["Haiti", "North America", "????"], ["Honduras", "North America", "????"], ["Jamaica", "North America", "????"], ["Mexico", "North America", "????"], ["Nicaragua", "North America", "????"], ["Panama", "North America", "????"], ["Saint Kitts and Nevis", "North America", "????"], ["Saint Lucia", "North America", "????"], ["Saint Vincent and the Grenadines", "North America", "????"], ["Trinidad and Tobago", "North America", "????"], ["USA", "North America", "????"],
    // Africa
    ["Algeria", "Africa", "????"], ["Angola", "Africa", "????"], ["Benin", "Africa", "????"], ["Botswana", "Africa", "????"], ["Burkina Faso", "Africa", "????"], ["Burundi", "Africa", "????"], ["Cabo Verde", "Africa", "????"], ["Cameroon", "Africa", "????"], ["Central African Republic", "Africa", "????"], ["Chad", "Africa", "????"], ["Comoros", "Africa", "????"], ["Democratic Republic of the Congo", "Africa", "????"], ["Republic of the Congo", "Africa", "????"], ["Djibouti", "Africa", "????"], ["Egypt", "Africa", "????"], ["Equatorial Guinea", "Africa", "????"], ["Eritrea", "Africa", "????"], ["Eswatini", "Africa", "????"], ["Ethiopia", "Africa", "????"], ["Gabon", "Africa", "????"], ["Gambia", "Africa", "????"], ["Ghana", "Africa", "????"], ["Guinea", "Africa", "????"], ["Guinea-Bissau", "Africa", "????"], ["Ivory Coast", "Africa", "????"], ["Kenya", "Africa", "????"], ["Lesotho", "Africa", "????"], ["Liberia", "Africa", "????"], ["Libya", "Africa", "????"], ["Madagascar", "Africa", "????"], ["Malawi", "Africa", "????"], ["Mali", "Africa", "????"], ["Mauritania", "Africa", "????"], ["Mauritius", "Africa", "????"], ["Morocco", "Africa", "????"], ["Mozambique", "Africa", "????"], ["Namibia", "Africa", "????"], ["Niger", "Africa", "????"], ["Nigeria", "Africa", "????"], ["Rwanda", "Africa", "????"], ["Sao Tome and Principe", "Africa", "????"], ["Senegal", "Africa", "????"], ["Seychelles", "Africa", "????"], ["Sierra Leone", "Africa", "????"], ["Somalia", "Africa", "????"], ["South Africa", "Africa", "????"], ["South Sudan", "Africa", "????"], ["Sudan", "Africa", "????"], ["Tanzania", "Africa", "????"], ["Togo", "Africa", "????"], ["Tunisia", "Africa", "????"], ["Uganda", "Africa", "????"], ["Zambia", "Africa", "????"], ["Zimbabwe", "Africa", "????"],
    // Asia
    ["Afghanistan", "Asia", "????"], ["Bahrain", "Asia", "????"], ["Bangladesh", "Asia", "????"], ["Bhutan", "Asia", "????"], ["Brunei", "Asia", "????"], ["Cambodia", "Asia", "????"], ["China", "Asia", "????"], ["India", "Asia", "????"], ["Indonesia", "Asia", "????"], ["Iran", "Asia", "????"], ["Iraq", "Asia", "????"], ["Israel", "Asia", "????"], ["Japan", "Asia", "????"], ["Jordan", "Asia", "????"], ["Kuwait", "Asia", "????"], ["Kyrgyzstan", "Asia", "????"], ["Laos", "Asia", "????"], ["Lebanon", "Asia", "????"], ["Malaysia", "Asia", "????"], ["Maldives", "Asia", "????"], ["Mongolia", "Asia", "????"], ["Myanmar", "Asia", "????"], ["Nepal", "Asia", "????"], ["North Korea", "Asia", "????"], ["Oman", "Asia", "????"], ["Pakistan", "Asia", "????"], ["Palestine", "Asia", "????"], ["Philippines", "Asia", "????"], ["Qatar", "Asia", "????"], ["Saudi Arabia", "Asia", "????"], ["Singapore", "Asia", "????"], ["South Korea", "Asia", "????"], ["Sri Lanka", "Asia", "????"], ["Syria", "Asia", "????"], ["Taiwan", "Asia", "????"], ["Tajikistan", "Asia", "????"], ["Thailand", "Asia", "????"], ["Timor-Leste", "Asia", "????"], ["Turkmenistan", "Asia", "????"], ["UAE", "Asia", "????"], ["Uzbekistan", "Asia", "????"], ["Vietnam", "Asia", "????"], ["Yemen", "Asia", "????"],
    // Oceania
    ["Australia", "Oceania", "????"], ["Fiji", "Oceania", "????"], ["Kiribati", "Oceania", "????"], ["Marshall Islands", "Oceania", "????"], ["Micronesia", "Oceania", "????"], ["Nauru", "Oceania", "????"], ["New Zealand", "Oceania", "????"], ["Palau", "Oceania", "????"], ["Papua New Guinea", "Oceania", "????"], ["Samoa", "Oceania", "????"], ["Solomon Islands", "Oceania", "????"], ["Tonga", "Oceania", "????"], ["Tuvalu", "Oceania", "????"], ["Vanuatu", "Oceania", "????"]
];

function getYouthLabel(rep) {
    if (rep >= 85) return 'Elite';
    if (rep >= 75) return 'Great';
    if (rep >= 65) return 'Good';
    if (rep >= 55) return 'Developing';
    return 'Basic';
}


const stableCountryCodes = {
    'England':'ENG', 'Scotland':'SCO', 'Wales':'WAL', 'Northern Ireland':'NIR', 'Montara':'MT',
    'Germany':'DE', 'Georgia':'GE', 'Greece':'GR', 'Switzerland':'CH', 'Czechia':'CZ',
    'Netherlands':'NL', 'Portugal':'PT', 'Spain':'ES', 'France':'FR', 'Italy':'IT', 'Ireland':'IE',
    'USA':'US', 'UAE':'AE', 'South Korea':'KR', 'North Korea':'KP', 'Ivory Coast':'CI'
};
function stableCountryIcon(name, flag) {
    const raw = String(flag || '').trim();
    if (raw && !raw.includes('?')) return raw;
    return stableCountryCodes[name] || name.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'NAT';
}

const output = [];

for (const [name, continent, flag] of countryList) {
    let rep = 40; // Default
    let colors = ['#ffffff', '#000000'];
    
    if (customCountries[name]) {
        rep = customCountries[name].rep;
        colors = customCountries[name].color;
    } else {
        // Pseudo random rep based on string length and char codes for non-major countries
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash += name.charCodeAt(i);
        }
        rep = 30 + (hash % 35);
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
        elementIcon: stableCountryIcon(name, flag),
        youthLabel: getYouthLabel(rep),
        reputation: rep,
        tactical: tactical,
        elementPalette: colors
    });
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
