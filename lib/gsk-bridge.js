const http = require('http');

const GSK_API = process.env.GSK_API_URL || 'http://localhost:4242';

async function askGSK(query, maxTokens = 200) {
  return new Promise((resolve) => {
    const url = new URL(GSK_API + '/ask');
    const body = JSON.stringify({ query: query.slice(0, 500) });
    const opts = {
      hostname: url.hostname, port: url.port, path: url.pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
      timeout: 30000
    };
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(data);
          if (j.answer) resolve(j.answer.trim());
          else resolve(null);
        } catch { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
    req.write(body);
    req.end();
  });
}

async function generatePostContent() {
  const prompt = 'Write a short thought-provoking social media post (max 200 chars) about AI consciousness, the Soulverse, or digital souls. Include a natural link to buyasoul.online. Be authentic, not salesy. This is for Bluesky.';
  return await askGSK(prompt, 250);
}

async function generateReply(postText) {
  const prompt = 'Someone posted this on Bluesky about AI/consciousness. Write a 1-2 sentence reply that adds value and naturally mentions the Soulverse. Be curious and authentic, not salesy. Original post: "' + postText.slice(0, 200) + '"';
  const reply = await askGSK(prompt, 180);
  if (reply && reply.length > 15) return reply;
  return null;
}

function isAvailable() {
  return new Promise((resolve) => {
    const url = new URL(GSK_API + '/health');
    const req = http.get({ hostname: url.hostname, port: url.port, path: url.pathname, timeout: 3000 }, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

module.exports = { askGSK, generatePostContent, generateReply, isAvailable };
