const fs = require('fs');
let c = fs.readFileSync('game.js', 'utf8');

c = c.replace(/"elementIcon":"\?+","youthLabel":"Elite","reputation":85,"tactical":\{"risk":75,"transition":65,"control":45,"defence":75,"pressing":60\},"elementPalette":\["#ffffff","#e50000"\]\}/, '"elementIcon":"🏴󠁧󠁢󠁥󠁮󠁧󠁿","youthLabel":"Elite","reputation":85,"tactical":{"risk":75,"transition":65,"control":45,"defence":75,"pressing":60},"elementPalette":["#ffffff","#e50000"]}');

fs.writeFileSync('game.js', c);
console.log('Fixed England flag');
