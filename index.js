require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
} = require("discord.js");

const { loadUsers, saveUsers } = require("./db");
const { loadBets, saveBets } = require("./betDb");
const fs = require("fs");

// ======================
// BOT
// ======================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const PREFIX = "!";

// ======================
// USER DATABASE
// ======================

function getUser(users, userId) {

  if (!users[userId]) {

    users[userId] = {
      coins: 0,
      lastDaily: 0,
      wins: 0,
      losses: 0,
      wagered: 0,
    };

    saveUsers(users);

  }

  return users[userId];

}

// ======================
// MATCH DATABASE
// ======================

function loadMatches() {

  if (!fs.existsSync("./matches.json")) {

    fs.writeFileSync(
      "./matches.json",
      "[]"
    );

  }

  return JSON.parse(
    fs.readFileSync("./matches.json", "utf8")
  );

}

function saveMatches(matches) {

  fs.writeFileSync(
    "./matches.json",
    JSON.stringify(matches, null, 2)
  );

}

// ======================
// BOT READY
// ======================

client.once("ready", () => {

  console.log(
    `✅ ${client.user.tag} is online!`
  );

});

// ======================
// COMMAND HANDLER
// ======================

client.on("messageCreate", async (message) => {

  if (message.author.bot) return;

  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content
    .slice(PREFIX.length)
    .trim()
    .split(/\s+/);

  const command = args.shift().toLowerCase();

  const users = loadUsers();

  const user = getUser(
    users,
    message.author.id
  );
    // ======================
  // !ping
  // ======================
  if (command === "ping") {

    const embed = new EmbedBuilder()
      .setColor("#00C853")
      .setTitle("🏓 Pong!")
      .setDescription("VFN Betting Bot is online.")
      .setFooter({
        text: "VFN Betting Bot",
      })
      .setTimestamp();

    return message.reply({
      embeds: [embed],
    });

  }

  // ======================
  // !help
  // ======================
  if (command === "help") {

    const embed = new EmbedBuilder()
      .setColor("#0099FF")
      .setTitle("📖 VFN Betting Commands")
      .setDescription("Available commands")
      .addFields(
        {
          name: "💰 Economy",
          value:
            "`!daily`\n`!balance`",
          inline: true,
        },
        {
          name: "⚽ Betting",
          value:
            "`!creatematch`\n`!matches`\n`!bet`\n`!betslip`\n`!mybets`",
          inline: true,
        },
        {
          name: "👑 Admin",
          value:
            "`!closematch`\n`!result`\n`!leaderboard`",
          inline: true,
        }
      )
      .setFooter({
        text: "VFN Betting Bot",
      })
      .setTimestamp();

    return message.reply({
      embeds: [embed],
    });

  }

  // ======================
  // !balance
  // ======================
  if (command === "balance") {

    const embed = new EmbedBuilder()
      .setColor("#FFD700")
      .setTitle("💰 Wallet")
      .addFields(
        {
          name: "Coins",
          value: `${user.coins.toLocaleString()}`,
          inline: true,
        },
        {
          name: "Wins",
          value: `${user.wins}`,
          inline: true,
        },
        {
          name: "Losses",
          value: `${user.losses}`,
          inline: true,
        }
      )
      .setFooter({
        text: "VFN Betting Bot",
      })
      .setTimestamp();

    return message.reply({
      embeds: [embed],
    });

  }

  // ======================
  // !daily
  // ======================
  if (command === "daily") {

    const now = Date.now();
    const cooldown = 24 * 60 * 60 * 1000;

    if (now - user.lastDaily < cooldown) {

      const remaining =
        cooldown - (now - user.lastDaily);

      const hours = Math.floor(
        remaining / (1000 * 60 * 60)
      );

      const minutes = Math.floor(
        (remaining % (1000 * 60 * 60)) /
          (1000 * 60)
      );

      const embed = new EmbedBuilder()
        .setColor("#FF9800")
        .setTitle("⏳ Daily Cooldown")
        .setDescription(
          `Come back in **${hours}h ${minutes}m**`
        )
        .setFooter({
          text: "VFN Betting Bot",
        })
        .setTimestamp();

      return message.reply({
        embeds: [embed],
      });

    }

    user.coins += 500;
    user.lastDaily = now;

    saveUsers(users);

    const embed = new EmbedBuilder()
      .setColor("#00C853")
      .setTitle("🎁 Daily Reward")
      .setDescription(
        "You claimed your daily reward!"
      )
      .addFields(
        {
          name: "Reward",
          value: "500 Coins",
          inline: true,
        },
        {
          name: "New Balance",
          value: `${user.coins.toLocaleString()} Coins`,
          inline: true,
        }
      )
      .setFooter({
        text: "VFN Betting Bot",
      })
      .setTimestamp();

    return message.reply({
      embeds: [embed],
    });

  }
    // ======================
  // !creatematch
  // ======================
  if (command === "creatematch") {

    const team1 = args[0];
    const team2 = args[1];
    const odds1 = parseFloat(args[2]);
    const odds2 = parseFloat(args[3]);

    if (!team1 || !team2 || !odds1 || !odds2) {

      const embed = new EmbedBuilder()
        .setColor("#E53935")
        .setTitle("❌ Invalid Usage")
        .setDescription(
          "`!creatematch Team1 Team2 Odds1 Odds2`\n\nExample:\n`!creatematch Barcelona RealMadrid 1.85 2.30`"
        );

      return message.reply({
        embeds: [embed],
      });

    }

    const matches = loadMatches();

    const id = matches.length + 1;

    matches.push({
      id,
      team1,
      team2,
      odds1,
      odds2,
      status: "OPEN",
    });

    saveMatches(matches);

    const embed = new EmbedBuilder()
      .setColor("#00C853")
      .setTitle("⚽ New Match Created")
      .addFields(
        {
          name: "🆔 Match ID",
          value: id.toString(),
          inline: true,
        },
        {
          name: "⚔️ Fixture",
          value: `${team1} 🆚 ${team2}`,
        },
        {
          name: "📈 Odds",
          value:
            `🔵 ${team1}: **${odds1}x**\n🔴 ${team2}: **${odds2}x**`,
        },
        {
          name: "📊 Status",
          value: "🟢 OPEN",
          inline: true,
        }
      )
      .setFooter({
        text: "VFN Betting Bot",
      })
      .setTimestamp();

    return message.reply({
      embeds: [embed],
    });

  }

  // ======================
  // !matches
  // ======================
  if (command === "matches") {

    const matches = loadMatches();

    if (matches.length === 0) {

      const embed = new EmbedBuilder()
        .setColor("#E53935")
        .setTitle("📋 Matches")
        .setDescription("There are currently no matches.");

      return message.reply({
        embeds: [embed],
      });

    }

    const embed = new EmbedBuilder()
      .setColor("#1E88E5")
      .setTitle("📋 Open Matches");

    matches.forEach(match => {

      embed.addFields({
        name: `🆔 Match #${match.id}`,
        value:
`⚽ ${match.team1} 🆚 ${match.team2}

📈 ${match.odds1}x | ${match.odds2}x

📊 ${match.status}`,
      });

    });

    embed
      .setFooter({
        text: "VFN Betting Bot",
      })
      .setTimestamp();

    return message.reply({
      embeds: [embed],
    });

  }
    // ======================
  // !bet
  // ======================
  if (command === "bet") {

    const matchId = parseInt(args[0]);
    const team = args[1];
    const amount = parseInt(args[2]);

    if (!matchId || !team || !amount) {

      const embed = new EmbedBuilder()
        .setColor("#E53935")
        .setTitle("❌ Invalid Bet")
        .setDescription(
          "`!bet MatchID Team Amount`\n\nExample:\n`!bet 1 Barcelona 500`"
        );

      return message.reply({ embeds: [embed] });

    }

    const matches = loadMatches();
    const bets = loadBets();

    const match = matches.find(
      m => m.id === matchId
    );

    if (!match) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#E53935")
            .setTitle("❌ Match Not Found")
        ]
      });
    }

    if (match.status !== "OPEN") {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#E53935")
            .setTitle("🔒 Betting Closed")
        ]
      });
    }

    if (
      team.toLowerCase() !== match.team1.toLowerCase() &&
      team.toLowerCase() !== match.team2.toLowerCase()
    ) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#E53935")
            .setTitle("❌ Invalid Team")
        ]
      });
    }

    if (user.coins < amount) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#E53935")
            .setTitle("💸 Not Enough Coins")
        ]
      });
    }

    user.coins -= amount;
    user.wagered += amount;

    saveUsers(users);

    bets.push({
      user: message.author.id,
      matchId,
      team,
      amount
    });

    saveBets(bets);

    const embed = new EmbedBuilder()
      .setColor("#00C853")
      .setTitle("🎯 Bet Placed")
      .addFields(
        {
          name: "⚽ Match",
          value: `${match.team1} 🆚 ${match.team2}`
        },
        {
          name: "🎯 Pick",
          value: team,
          inline: true
        },
        {
          name: "💰 Stake",
          value: `${amount} Coins`,
          inline: true
        },
        {
          name: "🏦 Balance",
          value: `${user.coins.toLocaleString()} Coins`,
          inline: true
        }
      )
      .setFooter({
        text: "VFN Betting Bot"
      })
      .setTimestamp();

    return message.reply({
      embeds: [embed]
    });

  }

  // ======================
  // !mybets
  // ======================
  if (command === "mybets") {

    const bets = loadBets();

    const myBets = bets.filter(
      b => b.user === message.author.id
    );

    if (myBets.length === 0) {

      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#E53935")
            .setTitle("🎟 No Active Bets")
        ]
      });

    }

    const matches = loadMatches();

    const embed = new EmbedBuilder()
      .setColor("#1E88E5")
      .setTitle("🎟 My Bets");

    myBets.forEach(bet => {

      const match = matches.find(
        m => m.id === bet.matchId
      );

      if (!match) return;

      embed.addFields({
        name: `🆔 Match #${bet.matchId}`,
        value:
`⚽ ${match.team1} 🆚 ${match.team2}

🎯 Pick: ${bet.team}

💰 Stake: ${bet.amount} Coins`
      });

    });

    embed
      .setFooter({
        text: "VFN Betting Bot"
      })
      .setTimestamp();

    return message.reply({
      embeds: [embed]
    });

  }
    // ======================
  // !betslip
  // ======================
  if (command === "betslip") {

    const bets = loadBets();

    const bet = bets.find(
      b => b.user === message.author.id
    );

    if (!bet) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#E53935")
            .setTitle("🎟 No Active Bet")
            .setDescription("You don't have any active bets.")
        ]
      });
    }

    const matches = loadMatches();

    const match = matches.find(
      m => m.id === bet.matchId
    );

    const odds =
      bet.team.toLowerCase() === match.team1.toLowerCase()
        ? match.odds1
        : match.odds2;

    const potentialWin = Math.floor(
      bet.amount * odds
    );

    const embed = new EmbedBuilder()
      .setColor("#8E24AA")
      .setTitle("🎟 VFN Bet Slip")
      .addFields(
        {
          name: "⚽ Match",
          value: `${match.team1} 🆚 ${match.team2}`
        },
        {
          name: "🎯 Pick",
          value: bet.team,
          inline: true
        },
        {
          name: "💰 Stake",
          value: `${bet.amount} Coins`,
          inline: true
        },
        {
          name: "📈 Odds",
          value: `${odds}x`,
          inline: true
        },
        {
          name: "🏆 Potential Win",
          value: `${potentialWin} Coins`
        },
        {
          name: "📊 Status",
          value: match.status,
          inline: true
        }
      )
      .setFooter({
        text: "VFN Betting Bot"
      })
      .setTimestamp();

    return message.reply({
      embeds: [embed]
    });

  }

  // ======================
  // !cancelbet
  // ======================
  if (command === "cancelbet") {

    const matchId = parseInt(args[0]);

    const bets = loadBets();

    const index = bets.findIndex(
      b =>
        b.user === message.author.id &&
        b.matchId === matchId
    );

    if (index === -1) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#E53935")
            .setTitle("❌ Bet Not Found")
        ]
      });
    }

    user.coins += bets[index].amount;

    saveUsers(users);

    bets.splice(index, 1);

    saveBets(bets);

    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("#FB8C00")
          .setTitle("✅ Bet Cancelled")
          .setDescription(
            `Refunded **${bets[index]?.amount ?? 0} Coins**`
          )
      ]
    });

  }

  // ======================
  // !closematch
  // ======================
  if (command === "closematch") {

    const matchId = parseInt(args[0]);

    const matches = loadMatches();

    const match = matches.find(
      m => m.id === matchId
    );

    if (!match) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#E53935")
            .setTitle("❌ Match Not Found")
        ]
      });
    }

    match.status = "CLOSED";

    saveMatches(matches);

    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("#FB8C00")
          .setTitle("🔒 Betting Closed")
          .setDescription(
            `Match #${matchId} has been closed.`
          )
      ]
    });

  }

  // ======================
  // !result
  // ======================
  if (command === "result") {

    const matchId = parseInt(args[0]);
    const winner = args[1];

    const matches = loadMatches();
    const bets = loadBets();

    const match = matches.find(
      m => m.id === matchId
    );

    if (!match) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#E53935")
            .setTitle("❌ Match Not Found")
        ]
      });
    }

    if (match.status === "FINISHED") {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#E53935")
            .setTitle("❌ Result Already Recorded")
        ]
      });
    }

    match.status = "FINISHED";

    let winners = 0;

    bets.forEach(bet => {

      if (
        bet.matchId === matchId &&
        bet.team.toLowerCase() === winner.toLowerCase()
      ) {

        const allUsers = loadUsers();

        const multiplier =
          bet.team.toLowerCase() === match.team1.toLowerCase()
            ? match.odds1
            : match.odds2;

        allUsers[bet.user].coins += Math.floor(
          bet.amount * multiplier
        );

        allUsers[bet.user].wins++;

        saveUsers(allUsers);

        winners++;

      }

    });

    saveBets(
      bets.filter(
        b => b.matchId !== matchId
      )
    );

    saveMatches(matches);

    const embed = new EmbedBuilder()
      .setColor("#43A047")
      .setTitle("🏆 Match Finished")
      .addFields(
        {
          name: "Winner",
          value: winner
        },
        {
          name: "Paid Winners",
          value: winners.toString(),
          inline: true
        }
      )
      .setFooter({
        text: "VFN Betting Bot"
      })
      .setTimestamp();

    return message.reply({
      embeds: [embed]
    });

  }

  // ======================
  // !leaderboard
  // ======================
  if (command === "leaderboard") {

    const leaderboard = Object.entries(users)
      .sort((a, b) => b[1].coins - a[1].coins)
      .slice(0, 10);

    const embed = new EmbedBuilder()
      .setColor("#FBC02D")
      .setTitle("👑 Coin Leaderboard");

    leaderboard.forEach(([id, data], i) => {
      embed.addFields({
        name: `#${i + 1}`,
        value: `<@${id}> — **${data.coins}** Coins`
      });
    });

    embed
      .setFooter({
        text: "VFN Betting Bot"
      })
      .setTimestamp();

    return message.reply({
      embeds: [embed]
    });

  }

});

client.login(process.env.DISCORD_TOKEN);
