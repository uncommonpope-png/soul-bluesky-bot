const BlueskyAgent = require('./lib/soul-bluesky.js');

const agent = new BlueskyAgent(null, {
    identifier: process.env.BLUESKY_IDENTIFIER,
    password: process.env.BLUESKY_PASSWORD,
});

(async () => {
    const ok = await agent.authenticate();
    if (!ok) {
        console.error('Auth failed');
        process.exit(1);
    }
    const content = await agent.generateContent();
    const posted = await agent.post(content);
    if (posted) {
        console.log(`OK: ${content.text.substring(0, 80)}...`);
        const stats = await agent.getStats();
        console.log(`Stats: ${stats.posts} posts | ${stats.followers} followers`);
    } else {
        console.error('Post failed');
        process.exit(1);
    }
})();
