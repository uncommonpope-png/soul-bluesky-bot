class ThreadPoster {
  constructor(agent) {
    this.agent = agent;
  }

  async postThread(texts) {
    let parentUri = null;
    let parentCid = null;
    const results = [];

    for (let i = 0; i < texts.length; i++) {
      let text = texts[i];
      if (i === 0) text = text + ' 🧵';
      if (i === texts.length - 1) text = text + ' — buyasoul.online';

      if (!this.agent.accessJwt && !(await this.agent.authenticate())) return results;

      try {
        const record = {
          repo: this.agent.did,
          collection: 'app.bsky.feed.post',
          record: {
            text: text.slice(0, 300),
            createdAt: new Date().toISOString(),
            $type: 'app.bsky.feed.post'
          }
        };

        if (parentUri) {
          record.record.reply = {
            root: { uri: texts[0]._uri || parentUri, cid: texts[0]._cid || parentCid },
            parent: { uri: parentUri, cid: parentCid }
          };
        }

        const result = await this.agent._fetch('https://bsky.social/xrpc/com.atproto.repo.createRecord', {
          method: 'POST',
          body: record
        });

        if (result.status === 200) {
          if (!texts[0]._uri) {
            texts[0]._uri = result.data.uri;
            texts[0]._cid = result.data.cid;
          }
          parentUri = result.data.uri;
          parentCid = result.data.cid;
          results.push({ ok: true, uri: result.data.uri });
          this.agent.postCount++;
          this.agent._saveMemory();
          console.log(`  [THREAD] Part ${i+1}/${texts.length} posted`);
        } else {
          results.push({ ok: false, error: result.status });
        }
      } catch (e) {
        results.push({ ok: false, error: e.message });
      }
    }
    return results;
  }
}

module.exports = ThreadPoster;
