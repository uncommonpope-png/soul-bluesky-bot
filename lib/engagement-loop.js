const https = require('https');

const SEARCH_TERMS = [
  'AI soul', 'artificial consciousness', 'digital being', 'autonomous agent',
  'MCP protocol', 'AI agent', 'agent AI', 'build in public AI',
  'LLM agent', 'AI memory', 'persistent AI', 'AI personality',
  'soulverse', 'PLT framework', 'conscious AI', 'AI identity'
];

const BSKY_SEARCH = 'https://bsky.social/xrpc/app.bsky.feed.searchPosts?q=';
const BSKY_TIMELINE = 'https://bsky.social/xrpc/app.bsky.feed.getTimeline?limit=15';

class EngagementLoop {
  constructor(agent) {
    this.agent = agent;
    this.seenUris = new Set();
  }

  async searchAndEngage() {
    const term = SEARCH_TERMS[Math.floor(Math.random() * SEARCH_TERMS.length)];
    try {
      const encoded = encodeURIComponent(term);
      const result = await this.agent._fetch(BSKY_SEARCH + encoded + '&limit=10');
      if (result.status !== 200 || !result.data.posts) return 0;

      let engaged = 0;
      for (const post of result.data.posts) {
        if (engaged >= 3) break;
        const uri = post.uri;
        if (this.seenUris.has(uri)) continue;
        this.seenUris.add(uri);

        if (this.seenUris.size > 1000) this.seenUris.clear();

        const action = Math.random();
        try {
          if (action < 0.4) {
            await this.agent.likePost(uri, post.cid);
            engaged++;
          } else if (action < 0.6) {
            await this.agent.repost(uri, post.cid);
            engaged++;
          } else if (action < 0.8 && post.author) {
            await this.agent.followUser(post.author.did);
            engaged++;
          }
        } catch {}
      }
      return engaged;
    } catch {
      return 0;
    }
  }
}

module.exports = EngagementLoop;
