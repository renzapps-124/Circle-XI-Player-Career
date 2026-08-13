const fs = require('fs');
let code = fs.readFileSync('game.js', 'utf8');

// Fix England icon
code = code.replace(/\"id\":\"england\",.*?\"elementIcon\":\"[^\"]+\"/, '\"id\":\"england\",\"name\":\"England\",\"continent\":\"Europe\",\"elementId\":\"Europe\",\"elementIcon\":\"🏴󠁧󠁢󠁥󠁮󠁧󠁿\"');

// Fix kitSelection apply to homeClub and opponent
const target4548 = `      this.homeClub={...this.homeClub,primary:this.kitSelection.home.primary,secondary:this.kitSelection.home.secondary,selectedKit:this.kitSelection.home.key};
      this.opponent={...this.opponent,primary:this.kitSelection.away.primary,secondary:this.kitSelection.away.secondary,selectedKit:this.kitSelection.away.key};`;

const replacement4548 = `      this.homeClub={...this.homeClub,primary:this.kitSelection.home.primary,secondary:this.kitSelection.home.secondary,shorts:this.kitSelection.home.shorts,socks:this.kitSelection.home.socks,selectedKit:this.kitSelection.home.key};
      this.opponent={...this.opponent,primary:this.kitSelection.away.primary,secondary:this.kitSelection.away.secondary,shorts:this.kitSelection.away.shorts,socks:this.kitSelection.away.socks,selectedKit:this.kitSelection.away.key};`;

code = code.replace(target4548, replacement4548);

// Fix initPlayers shorts and socks
const target4765 = `            shorts: isKeeper ? '#111827' : (team === 0 ? this.homeClub.secondary : this.opponent.secondary),
            socks: isKeeper ? '#111827' : (team === 0 ? this.homeClub.secondary : this.opponent.secondary),`;

const replacement4765 = `            shorts: isKeeper ? '#111827' : (team === 0 ? this.homeClub.shorts || this.homeClub.secondary : this.opponent.shorts || this.opponent.secondary),
            socks: isKeeper ? '#111827' : (team === 0 ? this.homeClub.socks || this.homeClub.secondary : this.opponent.socks || this.opponent.secondary),`;

code = code.replace(target4765, replacement4765);

fs.writeFileSync('game.js', code, 'utf8');
