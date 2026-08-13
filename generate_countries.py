import json
import urllib.request

# Major footballing nations with proper kit colors and reputations
custom_countries = {
    'England': {'color': ['#ffffff', '#e50000'], 'rep': 85},
    'France': {'color': ['#002395', '#ffffff'], 'rep': 88},
    'Germany': {'color': ['#ffffff', '#000000'], 'rep': 86},
    'Spain': {'color': ['#c60b1e', '#000000'], 'rep': 87},
    'Italy': {'color': ['#0064a8', '#ffffff'], 'rep': 85},
    'Brazil': {'color': ['#fedf00', '#009b3a'], 'rep': 89},
    'Argentina': {'color': ['#75aadb', '#ffffff'], 'rep': 87},
    'Netherlands': {'color': ['#f36c21', '#ffffff'], 'rep': 84},
    'Portugal': {'color': ['#e42518', '#046a38'], 'rep': 85},
    'Belgium': {'color': ['#e30613', '#000000'], 'rep': 83},
    'Croatia': {'color': ['#ff0000', '#ffffff'], 'rep': 81},
    'Uruguay': {'color': ['#55b5e5', '#000000'], 'rep': 80},
    'Colombia': {'color': ['#fcd116', '#003893'], 'rep': 78},
    'USA': {'color': ['#ffffff', '#002868'], 'rep': 75},
    'Mexico': {'color': ['#006341', '#ffffff'], 'rep': 76},
    'Senegal': {'color': ['#ffffff', '#00853f'], 'rep': 75},
    'Morocco': {'color': ['#c1272d', '#006233'], 'rep': 77},
    'Nigeria': {'color': ['#008751', '#ffffff'], 'rep': 74},
    'Ghana': {'color': ['#ffffff', '#000000'], 'rep': 73}, # Often white with black stars
    'Japan': {'color': ['#000555', '#ffffff'], 'rep': 77},
    'South Korea': {'color': ['#ef3340', '#000000'], 'rep': 76},
    'Australia': {'color': ['#fcd116', '#008751'], 'rep': 72},
    'Ivory Coast': {'color': ['#f77f00', '#ffffff'], 'rep': 74},
    'Cameroon': {'color': ['#007a5e', '#ce1126'], 'rep': 72},
    'Egypt': {'color': ['#ce1126', '#ffffff'], 'rep': 73},
    'Algeria': {'color': ['#ffffff', '#006233'], 'rep': 74},
    'Saudi Arabia': {'color': ['#006c35', '#ffffff'], 'rep': 71},
    'Iran': {'color': ['#ffffff', '#da0000'], 'rep': 73},
    'Ecuador': {'color': ['#ffdd00', '#034ea2'], 'rep': 75},
    'Peru': {'color': ['#ffffff', '#d91023'], 'rep': 74},
    'Chile': {'color': ['#d52b1e', '#0039a6'], 'rep': 74},
    'Switzerland': {'color': ['#ff0000', '#ffffff'], 'rep': 79},
    'Denmark': {'color': ['#c60c30', '#ffffff'], 'rep': 79},
    'Sweden': {'color': ['#ffc90e', '#005293'], 'rep': 77},
    'Norway': {'color': ['#ef3340', '#00205b'], 'rep': 77},
    'Poland': {'color': ['#ffffff', '#dc143c'], 'rep': 76},
    'Serbia': {'color': ['#c6363c', '#ffffff'], 'rep': 77},
    'Turkey': {'color': ['#e30a17', '#ffffff'], 'rep': 76},
    'Wales': {'color': ['#d30731', '#ffffff'], 'rep': 75},
    'Scotland': {'color': ['#001489', '#ffffff'], 'rep': 74},
    'Ukraine': {'color': ['#ffd700', '#0057b7'], 'rep': 76},
    'Austria': {'color': ['#ed2939', '#ffffff'], 'rep': 76},
    'Hungary': {'color': ['#ce2939', '#ffffff'], 'rep': 75},
    'Czechia': {'color': ['#d7141a', '#11457e'], 'rep': 74},
    'Greece': {'color': ['#ffffff', '#0d5eaf'], 'rep': 73},
    'Ireland': {'color': ['#169b62', '#ffffff'], 'rep': 72},
    'Canada': {'color': ['#ff0000', '#ffffff'], 'rep': 74},
    'Costa Rica': {'color': ['#ce1126', '#002b7f'], 'rep': 72},
    'Jamaica': {'color': ['#fed100', '#009b3a'], 'rep': 70},
    'Panama': {'color': ['#d21034', '#005293'], 'rep': 70},
    'South Africa': {'color': ['#ffb81c', '#007749'], 'rep': 71},
    'Mali': {'color': ['#14b53a', '#fcd116'], 'rep': 72},
    'Tunisia': {'color': ['#e70013', '#ffffff'], 'rep': 73},
    'Qatar': {'color': ['#8a1538', '#ffffff'], 'rep': 70},
    'UAE': {'color': ['#ffffff', '#ff0000'], 'rep': 68},
    'China': {'color': ['#ee1c25', '#ffff00'], 'rep': 65},
    'India': {'color': ['#0000ff', '#ff9933'], 'rep': 55},
    'New Zealand': {'color': ['#ffffff', '#000000'], 'rep': 68}
}

# Fetch all countries
req = urllib.request.Request('https://restcountries.com/v3.1/all', headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as response:
    data = json.loads(response.read().decode())

def get_continent(region, subregion):
    if region == 'Americas':
        if subregion in ('North America', 'Central America', 'Caribbean'):
            return 'North America'
        return 'South America'
    return region

def youth_label(rep):
    if rep >= 85: return 'Elite'
    if rep >= 75: return 'Great'
    if rep >= 65: return 'Good'
    if rep >= 55: return 'Developing'
    return 'Basic'

output = []
for c in data:
    name = c.get('name', {}).get('common', '')
    if not name: continue
    # Some overrides
    if name == 'United States': name = 'USA'
    if name == 'United Kingdom': continue # Use England, Wales, Scotland instead (we will add them manually if missing)
    
    continent = get_continent(c.get('region', ''), c.get('subregion', ''))
    if continent not in ['Europe', 'South America', 'North America', 'Africa', 'Asia', 'Oceania']:
        continue
        
    flag = c.get('flag', '?')
    
    if name in custom_countries:
        rep = custom_countries[name]['rep']
        colors = custom_countries[name]['color']
    else:
        rep = min(65, int(c.get('population', 0) / 1000000)) + 30
        if rep > 65: rep = 65
        colors = ['#ffffff', '#000000']
        
    tactical = {
        'risk': 50 + (rep % 30),
        'transition': 60 + (rep % 20),
        'control': 40 + (rep % 40),
        'defence': 50 + (rep % 30),
        'pressing': 45 + (rep % 35)
    }
    
    output.append({
        'id': name.lower().replace(' ', '-'),
        'name': name,
        'continent': continent,
        'elementId': continent,
        'elementIcon': flag,
        'youthLabel': youth_label(rep),
        'reputation': rep,
        'tactical': tactical,
        'elementPalette': colors
    })

# Add missing UK nations
for nation, flag in [('England', '??????????????'), ('Wales', '??????????????'), ('Scotland', '??????????????'), ('Northern Ireland', '????')]:
    if nation not in [x['name'] for x in output]:
        rep = custom_countries.get(nation, {}).get('rep', 70)
        colors = custom_countries.get(nation, {}).get('color', ['#ffffff', '#000000'])
        output.append({
            'id': nation.lower().replace(' ', '-'),
            'name': nation,
            'continent': 'Europe',
            'elementId': 'Europe',
            'elementIcon': flag,
            'youthLabel': youth_label(rep),
            'reputation': rep,
            'tactical': {'risk': 60, 'transition': 70, 'control': 65, 'defence': 70, 'pressing': 65},
            'elementPalette': colors
        })

# Sort by name
output.sort(key=lambda x: x['name'])

# Format as JS array
js_code = '    COUNTRIES: [\n'
for item in output:
    js_code += f"      {json.dumps(item)},\n"
js_code += '    ],\n'

import re
with open('game.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the COUNTRIES array
pattern = re.compile(r'    COUNTRIES: \[\n.*?\n    \],\n', re.DOTALL)
new_content = pattern.sub(js_code, content)

with open('game.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f\"Successfully added {len(output)} countries.\")
