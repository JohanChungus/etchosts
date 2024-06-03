import { serve } from "https://deno.land/std@0.180.0/http/server.ts";
import { config } from "https://deno.land/std@0.180.0/dotenv/mod.ts";
import { resolve } from "https://deno.land/std@0.180.0/net/dns.ts";
import { Bot } from "https://deno.land/x/telegram_bot_api@v0.5.3/mod.ts";

// Konfigurasi Bot Telegram
const LOG_CHANNEL_ID = "-1001966063772"; // ID Channel untuk log
const TOKEN = "6035023034:AAG-MAmWuXVH6ZE-B2MMTR9dgf5-zZlu0bw"; // Token bot Anda
const TELEGRAM_API = "https://api.telegram.org/bot"; // API Telegram (bisa diubah)

// Inisialisasi konfigurasi dari file .env
config({ export: true });

// Membuat instance Bot Telegram
const bot = new Bot(TOKEN, { apiUrl: TELEGRAM_API });

// Membuat session map
const sess = new Map();

// Menentukan server DNS yang akan digunakan
resolve.setServers(["8.8.8.8"]); // Gunakan Google DNS

// Fungsi untuk menghasilkan daftar IP dari domain
async function generate(hostnames: string[]): Promise<string[]> {
  let hosts: Record<string, string[]> = {};
  let text: string[] = [];

  for (const hostname of hostnames) {
    const host = /(?:https?:\/\/)?([\w\d\.\-]+)/.exec(hostname.toLowerCase())[1];

    if (host.endsWith(".onion")) continue; // Skip alamat onion

    if (hosts[host]) continue; // Skip jika host sudah ada

    try {
      hosts[host] = (await resolve(host, { all: true })).map((ip) => ip.address);
    } catch (error) {
      // Tangani error jika domain tidak ditemukan
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

  return text;
}

// Handler untuk route '/'
const handler = async (req: Request): Promise<Response> => {
  return new Response("Hello, World!");
};

// Handler untuk perintah /start
bot.onText("/start", async (msg) => {
  const chatId = msg.chat.id;
  await bot.sendMessage(
    chatId,
    "<pre><b>🙋‍♂️Hi! I can get IP from websites</b></pre>\n" +
      "To get IP from a website, just send me the link or domains, each separated by space.\n Hosting and modified by <b><a href='https://t.me/vano_ganzzz'><pre>🅅🄰🄽🄾 🄶🄰🄽🅉🅉🅉</pre></a></b>",
    { reply_to_message_id: msg.message_id, reply_markup: { force_reply: true, selective: true }, parse_mode: "HTML" }
  );
});

// Handler untuk perintah /about
bot.onText("/about", async (msg) => {
  const chatId = msg.chat.id;
  await bot.sendMessage(
    chatId,
    "Hosting and modified by <b><a href='https://t.me/vano_ganzzz'>🅅🄰🄽🄾 🄶🄰🄽🅉🅉🅉</a></b>\n" +
      "Credit: <b>Yonle</b>",
    { reply_to_message_id: msg.message_id, reply_markup: { force_reply: true, selective: true }, parse_mode: "HTML" }
  );
});

// Handler untuk pesan teks
bot.on("message", async (msg) => {
  if (
    msg.chat.type !== "private" &&
    msg.reply_to_message &&
    sess.get(msg.from.id) != msg.reply_to_message.message_id
  )
    return; 

  try {
    const hosts = await generate(msg.text.split(" "));
    const textMsg = `<b>${hosts.join("\n")}</b>`;

    if (textMsg.length > 4096) {
      return await bot.sendDocument(msg.chat.id, new Blob([textMsg], { type: "text/plain" }), { reply_to_message_id: msg.message_id });
    } 

    // Log aktivitas pengguna
    const logText = `USER@${msg.from.username || msg.from.first_name} (${msg.from.id}) sent: ${msg.text}`;
    await bot.sendMessage(LOG_CHANNEL_ID, logText, { parse_mode: "HTML" }).catch(console.error);

    await bot.sendMessage(msg.chat.id, textMsg, { parse_mode: "HTML", reply_to_message_id: msg.message_id });
  } catch (error) {
    console.error(error); 
    await bot.sendMessage(msg.chat.id, "An error occurred while processing your request.", { reply_to_message_id: msg.message_id });
  }

  sess.delete(msg.from.id);
});

// Handler untuk error polling
bot.on("polling_error", (error) => console.error(error));

// Menjalankan bot dan mencetak username
await bot.getMe().then(({ username }) => console.log(`Logged in as @${username}`));

// Menjalankan server
serve(handler, { port: parseInt(Deno.env.get("PORT") || "3000") });
