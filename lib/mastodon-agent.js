const https = require('https');

class MastodonAgent {
    constructor(options = {}) {
        this.instance = options.instance || process.env.MASTODON_INSTANCE || 'https://defcon.social';
        this.accessToken = options.accessToken || process.env.MASTODON_ACCESS_TOKEN || '';
        this.postCount = 0;
    }

    isConfigured() {
        return !!this.accessToken;
    }

    async post(text) {
        if (!this.accessToken) {
            console.log('  [MASTODON] Not configured. Set MASTODON_ACCESS_TOKEN.');
            return false;
        }

        const postText = text.slice(0, 500);
        const body = JSON.stringify({ status: postText });
        const urlObj = new URL(this.instance);

        return new Promise((resolve) => {
            const req = https.request({
                hostname: urlObj.hostname,
                path: '/api/v1/statuses',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Length': Buffer.byteLength(body)
                },
                timeout: 15000
            }, (res) => {
                let data = '';
                res.on('data', c => data += c);
                res.on('end', () => {
                    try {
                        const j = JSON.parse(data);
                        if (j.id) {
                            this.postCount++;
                            console.log(`  [MASTODON] POSTED: "${postText.slice(0, 60)}..."`);
                            resolve(true);
                        } else {
                            console.error('  [MASTODON] Post failed:', j.error || data);
                            resolve(false);
                        }
                    } catch {
                        console.error('  [MASTODON] Parse error:', data);
                        resolve(false);
                    }
                });
            });
            req.on('error', (e) => {
                console.error('  [MASTODON] Error:', e.message);
                resolve(false);
            });
            req.on('timeout', () => { req.destroy(); resolve(false); });
            req.write(body);
            req.end();
        });
    }

    async getStats() {
        if (!this.accessToken) return null;
        const urlObj = new URL(this.instance);

        return new Promise((resolve) => {
            https.request({
                hostname: urlObj.hostname,
                path: '/api/v1/accounts/verify_credentials',
                method: 'GET',
                headers: { 'Authorization': `Bearer ${this.accessToken}` },
                timeout: 10000
            }, (res) => {
                let data = '';
                res.on('data', c => data += c);
                res.on('end', () => {
                    try {
                        const j = JSON.parse(data);
                        resolve({
                            username: j.username,
                            followers: j.followers_count,
                            posts: j.statuses_count
                        });
                    } catch { resolve(null); }
                });
            }).on('error', () => resolve(null)).end();
        });
    }
}

module.exports = MastodonAgent;
