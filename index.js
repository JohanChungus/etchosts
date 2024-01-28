require("dotenv").config();
const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const resolver = require("dns").promises;

const app = express();
const PORT = process.env.PORT || 3000;

// The telegram bot
const TOKEN = "6035023034:AAG-MAmWuXVH6ZE-B2MMTR9dgf5-zZlu0bw";
const bot = new TelegramBot(TOKEN, { polling: true });
const sess = new Map();

resolver.setServers(["8.8.8.8"]);

async function generate(hostnames) {
  let hosts = {};
  let text = [];

  for (const hostname of hostnames) {
    const host = /(?:https?:\/\/)?([\w\d\.\-]+)/.exec(hostname.toLowerCase())[1];

    if (host.endsWith(".onion")) continue;

    if (hosts[host]) continue;

    hosts[host] = (await resolver.lookup(host, { all: true })).map((ip) => ip.address);
  }

  for (const host in hosts) {
    const ips = hosts[host];

    ips.forEach((ip) => {
      text.push(`<pre>${ip}\t${host}</pre>`);
    });
  }

  return text.join("\n");
}

app.get("/", (req, res) => res.send("Hello, World!"));

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    "<pre><b>🙋‍♂️Hi! I can get IP from websites</b></pre>\n" +
      "To get IP from a website, just send me the link or domains, each separated by space.\n Hosting and modified by <b><a href='https://t.me/vano_ganzzz'><pre>🅅🄰🄽🄾 🄶🄰🄽🅉🅉🅉</pre></a></b>",
    { reply_to_message_id: msg.message_id, reply_markup: { force_reply: true, selective: true }, parse_mode: "HTML" }
  );
});

bot.onText(/\/about/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    "Hosting and modified by <b><a href='https://t.me/vano_ganzzz'>🅅🄰🄽🄾 🄶🄰🄽🅉🅉🅉</a></b>\n" +
      "Credit: <b>Yonle</b>",
    { reply_to_message_id: msg.message_id, reply_markup: { force_reply: true, selective: true }, parse_mode: "HTML" }
  );
});

bot.on("message", async (msg) => {
  if (
    msg.chat.type !== "private" &&
    msg.reply_to_message &&
    sess.get(msg.from.id) != msg.reply_to_message.message_id
  )
    return;
  try {
    const hosts = await generate(msg.text.split(" "));
    const textMsg = `<b>${hosts}</b>`;

    if (textMsg.length > 4096)
      return bot.sendDocument(msg.chat.id, Buffer.from(hosts), { reply_to_message_id: msg.message_id });

    bot.sendMessage(msg.chat.id, textMsg, { parse_mode: "HTML", reply_to_message_id: msg.message_id });
  } catch (error) {
    console.error(error);
  }

  sess.delete(msg.from.id);
});

bot.on("polling_error", (error) => console.error(error));

bot.getMe().then(({ username }) => console.log(`Logged in as @${username}`));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
