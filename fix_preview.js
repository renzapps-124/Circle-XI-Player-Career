const fs = require('fs');
let c = fs.readFileSync('game.js', 'utf8');

const regex = /const p={skin:\$\('#skinTone'\)\.value,hair:\$\('#hair'\)\.value,hairColour:\$\('#hairColour'\)\?\.value\|\|'#21140d',boots:\$\('#bootColour'\)\.value,build:\$\('#build'\)\.value,position:\$\('#position'\)\.value,shirtNumber:\+\(\$\('#shirtNumber'\)\.value\|\|8\),primary:previewClub\?\.primary\|\|'#6d28d9',secondary:previewClub\?\.secondary\|\|'#f8fafc',shorts:previewClub\?\.secondary\|\|'#f8fafc',socks:previewClub\?\.secondary\|\|'#f8fafc'};\s*drawMediaPlayerModel/;

const replacement = `let pr = previewClub?.primary || '#6d28d9', se = previewClub?.secondary || '#f8fafc';
    if (typeof activeCreatorStep !== 'undefined' && activeCreatorStep === 0) {
        const ctry = selectedNationalityCountry();
        if (ctry && ctry.elementPalette) {
            pr = ctry.elementPalette[0];
            se = ctry.elementPalette[1];
        }
    }
    const p={skin:$('#skinTone').value,hair:$('#hair').value,hairColour:$('#hairColour')?.value||'#21140d',boots:$('#bootColour').value,build:$('#build').value,position:$('#position').value,shirtNumber:+($('#shirtNumber').value||8),primary:pr,secondary:se,shorts:se,socks:se};
    drawMediaPlayerModel`;

if (c.match(regex)) {
    c = c.replace(regex, replacement);
    fs.writeFileSync('game.js', c);
    console.log('Fixed preview colors');
} else {
    console.log('Could not find regex match');
}
