const fs = require('fs');

const FILE = './users.json';

function loadUsers() {
  if (!fs.existsSync(FILE)) {
    fs.writeFileSync(FILE, '{}');
  }

  return JSON.parse(fs.readFileSync(FILE));
}

function saveUsers(users) {
  fs.writeFileSync(FILE, JSON.stringify(users, null, 2));
}

module.exports = {
  loadUsers,
  saveUsers
};
