const fs = require('fs');

const FILE = './matches.json';

function loadMatches() {
  if (!fs.existsSync(FILE)) {
    fs.writeFileSync(FILE, '{}');
  }

  return JSON.parse(fs.readFileSync(FILE));
}

function saveMatches(matches) {
  fs.writeFileSync(FILE, JSON.stringify(matches, null, 2));
}

module.exports = {
  loadMatches,
  saveMatches
};
