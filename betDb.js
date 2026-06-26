const fs = require("fs");

const FILE = "./bets.json";

function loadBets() {
  if (!fs.existsSync(FILE)) {
    fs.writeFileSync(FILE, "[]");
  }

  return JSON.parse(fs.readFileSync(FILE, "utf8"));
}

function saveBets(bets) {
  fs.writeFileSync(FILE, JSON.stringify(bets, null, 2));
}

module.exports = {
  loadBets,
  saveBets,
};
