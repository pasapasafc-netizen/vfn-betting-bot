const fs = require("fs");

const FILE = "./parlays.json";

function loadParlays() {
  if (!fs.existsSync(FILE)) {
    fs.writeFileSync(FILE, "[]");
  }

  return JSON.parse(fs.readFileSync(FILE, "utf8"));
}

function saveParlays(parlays) {
  fs.writeFileSync(
    FILE,
    JSON.stringify(parlays, null, 2)
  );
}

module.exports = {
  loadParlays,
  saveParlays,
};
