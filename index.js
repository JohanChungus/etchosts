// Import required modules
import { VercelRequest, VercelResponse } from '@vercel/node';
import grammy from 'grammy';
import resolver from 'dns/promises';

// The telegram bot
const TOKEN = '6035023034:AAG-MAmWuXVH6ZE-B2MMTR9dgf5-zZlu0bw';
const bot = new grammy.Bot(TOKEN);
const sess = new Map();

// Set DNS server
resolver.setServers(['8.8.8.8']);

// Function to generate IP addresses
async function generate(hostnames) {
  let hosts = {};
  let text = [];

  for (const hostname of hostnames) {
    const host = /(?:https?:\/\/)?([\w\d\.\-]+)/.exec(hostname.toLowerCase())[1];

    if (host.endsWith('.onion')) continue;

    if (hosts[host]) continue;

    hosts[host] = (await resolver.lookup(host, { all: true })).map((ip) => ip.address);
  }

  for (const host in hosts) {
    const ips = hosts[host];

    ips.forEach((ip) => {
      text.push(`<pre>${ip}\t${host}</pre>`);
    });
  }

  return text.join('\n');
}

// Vercel server handler
export default function handler(req: VercelRequest, res: VercelResponse) {
  const { name = 'World' } = req.query;

  // Handle Telegram bot logic
  bot.handleUpdate(req.body);

  // Add your Vercel response logic here
  res.json({
    message: `Hello ${name}!`,
  });
}

// Other Telegram bot commands
bot.command('start', (ctx) =>
  ctx.reply(
    "<pre><b>🙋‍♂️Hi! Im can get IP website</b></pre>\n" +
      "To get IP from the website just send me the link or domains, each splitted with space.\nHosting and modified by <b><a href='https://t.me/vano_ganzzz'><pre>🅅🄰🄽🄾 🄶🄰🄽🅉🅉🅉</pre></a></b>",
    { reply_to_message_id: ctx.message.message_id, reply_markup: { force_reply: true, selective: true }, parse_mode: 'HTML' }
  )
);

bot.command('about', (ctx) =>
  ctx.reply(
    "Hosting and modified by <b><a href='https://t.me/vano_ganzzz'>🅅🄰🄽🄾 🄶🄰🄽🅉🅉🅉</a></b>\n" +
      "Credit: <b>Yonle</b>",
    { reply_to_message_id: ctx.message.message_id, reply_markup: { force_reply: true, selective: true }, parse_mode: 'HTML' }
  )
);

bot.on('message:text', async (ctx) => {
  if (
    ctx.message.chat.type !== 'private' &&
    ctx.message.reply_to_message &&
    sess.get(ctx.message.from.id) !== ctx.message.reply_to_message.message_id
  )
    return;

  try {
    let hosts = await generate(ctx.message.text.split(' '));
    let textMsg = `<b>${hosts}</b>`;

    if (textMsg.length > 4096)
      return ctx.replyWithDocument(
        new grammy.InputFile(Buffer.from(hosts), 'hosts'),
        { reply_to_message_id: ctx.message.message_id }
      );

    ctx.reply(textMsg, {
      parse_mode: 'HTML',
      reply_to_message_id: ctx.message.message_id,
    });
  } catch (error) {
    console.error(error);
  }

  sess.delete(ctx.message.from.id);
});

bot.catch(console.error);
bot.start();

bot.api
  .getMe()
  .then(({ first_name }) => console.log(`Logged as ${first_name}!`));

process.on('unhandledRejection', console.error);
