require("dotenv").config();
const express = require("express");
const grammy = require("grammy");
const resolver = require("dns").promises;

const app = express();
const PORT = process.env.PORT || 3000;

// The telegram bot
const TOKEN = "6035023034:AAG-MAmWuXVH6ZE-B2MMTR9dgf5-zZlu0bw";
const bot = new grammy.Bot(TOKEN);
const sess = new Map();

resolver.setServers(["8.8.8.8"]);

async function generate(hostnames) {
  let hosts = {};
  let text = [];

  for (i in hostnames) {
    // Grab the Hostname, even in URL.
    host = /(?:https?:\/\/)?([\w\d\.\-]+)/.exec(hostnames[i].toLowerCase())[1];

    // Ignore onion address since it's unsupported here
    if (host.endsWith(".onion")) continue;

    // Skip existing hostname
    if (hosts[host]) continue;

    // Look up IP address of {host} string.
    // Returns Array with a bunch of IP addresses of a single hostname
    hosts[host] = (await resolver.lookup(host, { all: true })).map((ip) => ip.address);
  }

  // Parse hosts
  for (host in hosts) {
    let ips = hosts[host];

    ips.forEach((ip) => {
      text.push(`<pre>${ip}\t${host}</pre>`);
    });
  }

  return text.join("\n");
}

app.get("/", (req, res) => res.send("Hello, World!"));

bot.command("start", (ctx) =>
  ctx.reply(
    "<pre><b>🙋‍♂️Hi! I can get IP from websites</b></pre>\n" +
      "To get IP from a website, just send me the link or domains, each separated by space.\n Hosting and modified by <b><a href='https://t.me/vano_ganzzz'><pre>🅅🄰🄽🄾 🄶🄰🄽🅉🅉🅉</pre></a></b>",
    { reply_to_message_id: ctx.message.message_id, reply_markup: { force_reply: true, selective: true }, parse_mode: "HTML" }
  )
);

bot.command("about", (ctx) =>
  ctx.reply(
    "Hosting and modified by <b><a href='https://t.me/vano_ganzzz'>🅅🄰🄽🄾 🄶🄰🄽🅉🅉🅉</a></b>\n" +
      "Credit: <b>Yonle</b>",
    { reply_to_message_id: ctx.message.message_id, reply_markup: { force_reply: true, selective: true }, parse_mode: "HTML" }
  )
);

bot.on("message:text", async (ctx) => {
  if (
    ctx.message.chat.type !== "private" &&
    ctx.message.reply_to_message &&
    sess.get(ctx.message.from.id) != ctx.message.reply_to_message.message_id
  )
    return;
  try {
    let hosts = await generate(ctx.message.text.split(" "));
    let textMsg = `<b>${hosts}</b>`;

    // Sent as a file if the string length is at the maximum length.
    if (textMsg.length > 4096)
      return ctx.replyWithDocument(
        new grammy.InputFile(Buffer.from(hosts), "hosts"),
        { reply_to_message_id: ctx.message.message_id }
      );

    // Sent as a text message whenever it's possible.
    ctx.reply(textMsg, {
      parse_mode: "HTML",
      reply_to_message_id: ctx.message.message_id,
    });
  } catch (error) {
    // Handle errors silently without sending them as a reply
    console.error(error);
  }

  // Delete the session when available.
  sess.delete(ctx.message.from.id);
});

bot.catch(console.error);
bot.start();

bot.api.getMe().then(({ first_name }) => console.log(`Logged as ${first_name}!`));

process.on("unhandledRejection", console.error);

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
