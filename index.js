const grammy = require("grammy");
const resolver = require("dns").promises;

// The telegram bot
const TOKEN = "6035023034:AAG-MAmWuXVH6ZE-B2MMTR9dgf5-zZlu0bw";


// User Sessions, Used for /generate command in group.
const sess = new Map();

// When required
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
    // Returns Array with bunch of IP address of single hostname
    hosts[host] = (await resolver.lookup(host, { all: true })).map(
      (ip) => ip.address
    );
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

// Handle /start command
bot.command("start", (ctx) =>
  ctx
    .reply(
      "<pre><b>🙋‍♂️Hi! Im can get IP website</b></pre>\n" +
        "To get IP from website just send me the link or domains, Each splitted with space.\n Hosting and modified by <b><a href='https://t.me/vano_ganzzz'><pre>🅅🄰🄽🄾 🄶🄰🄽🅉🅉🅉</pre></a></b>",
      { reply_to_message_id: ctx.message.message_id, reply_markup: { force_reply: true, selective: true }, parse_mode: "HTML" }
    )
    .then(({ message_id }) => sess.set(ctx.message.from.id, message_id))
);

// Handle /generate command
bot.command("about", (ctx) =>
  ctx
    .reply(
      "Hosting and modified by <b><a href='https://t.me/vano_ganzzz'>🅅🄰🄽🄾 🄶🄰🄽🅉🅉🅉</a></b>\n" +
        "Credit: <b>Yonle</b>",
      { reply_to_message_id: ctx.message.message_id, reply_markup: { force_reply: true, selective: true }, parse_mode: "HTML" }
    )
)

// Listen to text message event
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

    // Sent as file if the string length is at the maximum length.
    if (textMsg.length > 4096)
      return ctx.replyWithDocument(
        new grammy.InputFile(Buffer.from(hosts), "hosts"),
        { reply_to_message_id: ctx.message.message_id }
      );

    // Sent as text message whenever it's possible.
    ctx.reply(textMsg, {
      parse_mode: "HTML",
      reply_to_message_id: ctx.message.message_id,
    });
  } catch (error) {
    // Handle error silently without sending it as a reply
    console.error(error);
  }

  // Delete session when available.
  sess.delete(ctx.message.from.id);
});

bot.catch(console.error);
bot.start();

bot.api
  .getMe()
  .then(({ first_name }) => console.log(`Logged as ${first_name}!`));

process.on("unhandledRejection", console.error);
