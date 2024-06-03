import { serve } from "https://deno.land/std@0.180.0/http/server.ts";
import { config } from "https://deno.land/std@0.180.0/dotenv/mod.ts";
import { resolve } from "https://deno.land/std@0.180.0/net/dns.ts";
import { Bot } from "https://deno.land/x/grammy@v1.11.0/mod.ts";

// Load environment variables
config();

// Configuration
const LOG_CHANNEL_ID = "-1001966063772"; // ID Channel untuk log
const TOKEN = "6035023034:AAG-MAmWuXVH6ZE-B2MMTR9dgf5-zZlu0bw"; // Token bot Anda
const PORT = parseInt(Deno.env.get("PORT") || "3000", 10); // Port for the server

// Initialize bot
const bot = new Bot(TOKEN);

// Session management
const sess = new Map();

// Resolve DNS using Google DNS
resolve.setServers(["8.8.8.8"]);

async function generate(hostnames: string[]): Promise<string> {
  const hosts = {};
  const text = [];

  for (const hostname of hostnames) {
    const host = /(?:https?:\/\/)?([\w\d\.\-]+)/.exec(hostname.toLowerCase())?.[1];

    if (host === undefined || host.endsWith(".onion")) continue; // Skip onion addresses

    if (hosts[host]) continue; // Skip if host already exists

    try {
      hosts[host] = (await resolve(host, { all: true })).map((ip) => ip.address);
    } catch (error) {
      // Handle error if domain not found
      console.error(`Error resolving ${host}:`, error);
      hosts[host] = ["Domain not found"];
    }
  }

  for (const host in hosts) {
    const ips = hosts[host];
    ips.forEach((ip) => {
      text.push(`<pre>${ip}\t${host}</pre>`);
    });
  }

  return text.join("\n");
}

bot.command("start", (ctx) => {
  ctx.reply(
    "<pre><b>🙋‍♂️Hi! I can get IP from websites</b></pre>\n" +
      "To get IP from a website, just send me the link or domains, each separated by space.\n Hosting and modified by <b><a href='https://t.me/vano_ganzzz'><pre>🅅🄰🄽🄾 🄶🄰🄽🅉🅉🅉</pre></a></b>",
    { reply_to_message_id: ctx.message.message_id, reply_markup: { force_reply: true, selective: true }, parse_mode: "HTML" }
  );
});

bot.command("about", (ctx) => {
  ctx.reply(
    "Hosting and modified by <b><a href='https://t.me/vano_ganzzz'>🅅🄰🄽ஓ 🄶🄰🄽🅉🅉🅉</a></b>\n" +
      "Credit: <b>Yonle</b>",
    { reply_to_message_id: ctx.message.message_id, reply_markup: { force_reply: true, selective: true }, parse_mode: "HTML" }
  );
});

bot.on("message", async (ctx) => {
  if (
    ctx.chat.type !== "private" &&
    ctx.message.reply_to_message &&
    sess.get(ctx.from.id) !== ctx.message.reply_to_message.message_id
  )
    return;

  try {
    const hosts = await generate(ctx.message.text.split(" "));
    const textMsg = `<b>${hosts}</b>`;

    if (textMsg.length > 4096) {
      return ctx.sendDocument(Buffer.from(hosts), { reply_to_message_id: ctx.message.message_id });
    }

    // Log user activity
    const logText = `USER@${ctx.from.username || ctx.from.first_name} (${ctx.from.id}) sent: ${ctx.message.text}`;
    bot.api.sendMessage(LOG_CHANNEL_ID, logText, { parse_mode: "HTML" }).catch(console.error);

    ctx.reply(textMsg, { parse_mode: "HTML", reply_to_message_id: ctx.message.message_id });
  } catch (error) {
    console.error(error);
    ctx.reply("An error occurred while processing your request.", { reply_to_message_id: ctx.message.message_id });
  }

  sess.delete(ctx.from.id);
});

bot.on("polling_error", (error) => console.error(error));

bot.api.getMe().then(({ username }) => console.log(`Logged in as @${username}`));

// Start the bot and server
bot.start();
serve(async (req) => {
  const body = await Deno.readAll(req.body);
  const text = new TextDecoder().decode(body);
  return new Response("Hello, World!", {
    headers: { "Content-Type": "text/plain" },
  });
}, { port: PORT });

console.log(`Server is running on port ${PORT}`);
