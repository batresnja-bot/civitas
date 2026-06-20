// API integration tests. Runs against the real Express app with an isolated,
// freshly-seeded SQLite database (CIVITAS_DB_PATH set before the app is loaded).
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import os from 'os';
import path from 'path';
import fs from 'fs';
import request from 'supertest';

let app;
let dbFile;

beforeAll(async () => {
  dbFile = path.join(os.tmpdir(), `civitas-test-${Date.now()}-${Math.random().toString(16).slice(2)}.db`);
  process.env.CIVITAS_DB_PATH = dbFile;
  process.env.SESSION_SECRET = 'test-secret';
  app = (await import('../app.js')).default; // CJS module.exports = app
});

afterAll(() => {
  for (const suffix of ['', '-wal', '-shm']) {
    try { fs.unlinkSync(dbFile + suffix); } catch { /* ignore */ }
  }
});

// An authenticated agent persists the session cookie and carries a CSRF token.
async function authedAgent(login = 'sarah_chen', password = 'password123') {
  const agent = request.agent(app);
  await agent.post('/api/auth/login').send({ login, password }).expect(200);
  const me = await agent.get('/api/auth/me').expect(200);
  return { agent, csrf: me.body.csrfToken };
}

describe('auth', () => {
  it('returns null user when anonymous', async () => {
    const res = await request(app).get('/api/auth/me').expect(200);
    expect(res.body.user).toBeNull();
    expect(typeof res.body.csrfToken).toBe('string');
  });

  it('rejects bad credentials', async () => {
    await request(app).post('/api/auth/login').send({ login: 'sarah_chen', password: 'wrong' }).expect(401);
  });

  it('logs in a seeded user and reports them via /auth/me', async () => {
    const { agent } = await authedAgent();
    const me = await agent.get('/api/auth/me').expect(200);
    expect(me.body.user.username).toBe('sarah_chen');
    expect(me.body.user.trust).toHaveProperty('name');
  });

  it('registers a new account', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'newbie_test', email: 'newbie@test.dev', password: 'password123' })
      .expect(201);
    expect(res.body.user.username).toBe('newbie_test');
  });

  it('validates registration input', async () => {
    await request(app).post('/api/auth/register').send({ username: 'a', email: 'x@y.z', password: 'password123' }).expect(400);
    await request(app).post('/api/auth/register').send({ username: 'okname', email: 'bad', password: 'password123' }).expect(400);
    await request(app).post('/api/auth/register').send({ username: 'okname2', email: 'ok@ok.dev', password: 'short' }).expect(400);
  });
});

describe('demo mode + coach', () => {
  it('reports demo flag on /auth/me (off by default in tests)', async () => {
    const res = await request(app).get('/api/auth/me').expect(200);
    expect(res.body).toHaveProperty('demo');
    expect(res.body.demo).toBe(false);
  });

  it('refuses demo login when demo mode is off', async () => {
    await request(app).post('/api/auth/demo').send({ role: 'founder' }).expect(403);
  });

  it('Post Coach returns status + suggestions for risky drafts', async () => {
    const { agent } = await authedAgent();
    const res = await agent.post('/api/coach').send({ content: 'you are a stupid idiot' }).expect(200);
    expect(res.body).toHaveProperty('suggestions');
    expect(Array.isArray(res.body.suggestions)).toBe(true);
  });
});

describe('communities', () => {
  it('lists seeded communities', async () => {
    const res = await request(app).get('/api/communities').expect(200);
    expect(Array.isArray(res.body.communities)).toBe(true);
    expect(res.body.communities.length).toBeGreaterThan(0);
    expect(res.body.communities[0]).toHaveProperty('slug');
  });

  it('returns a single community with membership info', async () => {
    const list = await request(app).get('/api/communities').expect(200);
    const slug = list.body.communities[0].slug;
    const res = await request(app).get(`/api/communities/${slug}`).expect(200);
    expect(res.body.community.slug).toBe(slug);
    expect(res.body.community).toHaveProperty('memberCount');
  });

  it('404s an unknown community', async () => {
    await request(app).get('/api/communities/does-not-exist-xyz').expect(404);
  });

  it('lets an authed member join and leave', async () => {
    const { agent, csrf } = await authedAgent('alex_rivera');
    const list = await request(app).get('/api/communities').expect(200);
    const slug = list.body.communities[list.body.communities.length - 1].slug;
    const joined = await agent.post(`/api/communities/${slug}/join`).set('x-csrf-token', csrf).expect(200);
    expect(joined.body.community.isMember).toBe(true);
    const left = await agent.post(`/api/communities/${slug}/leave`).set('x-csrf-token', csrf).expect(200);
    expect(left.body.community.isMember).toBe(false);
  });
});

describe('feed', () => {
  it('returns recent approved posts', async () => {
    const res = await request(app).get('/api/feed').expect(200);
    expect(Array.isArray(res.body.posts)).toBe(true);
    if (res.body.posts.length) {
      expect(res.body.posts[0]).toHaveProperty('author');
      expect(res.body.posts[0].status).toBe('approved');
    }
  });
});

describe('posts and moderation', () => {
  let slug;
  beforeAll(async () => {
    const list = await request(app).get('/api/communities').expect(200);
    slug = list.body.communities[0].slug;
  });

  it('creates a clean post that is approved', async () => {
    const { agent, csrf } = await authedAgent();
    const res = await agent
      .post(`/api/communities/${slug}/posts`)
      .set('x-csrf-token', csrf)
      .send({ title: 'A helpful question', content: 'I would love thoughtful feedback on this idea. Thank you all.' })
      .expect(201);
    expect(res.body.status).toBe('approved');
    expect(res.body.moderation.status).toBe('approved');
  });

  it('does not approve a toxic post', async () => {
    const { agent, csrf } = await authedAgent();
    const res = await agent
      .post(`/api/communities/${slug}/posts`)
      .set('x-csrf-token', csrf)
      .send({ content: 'You should kill yourself, you stupid idiot. I hope you die.' })
      .expect(201);
    expect(res.body.status).not.toBe('approved');
    expect(res.body.moderation.status).not.toBe('approved');
  });

  it('requires a CSRF token to create a post', async () => {
    const { agent } = await authedAgent();
    await agent.post(`/api/communities/${slug}/posts`).send({ content: 'no csrf token here' }).expect(403);
  });

  it('requires auth to create a post', async () => {
    await request(app).post(`/api/communities/${slug}/posts`).send({ content: 'anon' }).expect(401);
  });

  it('runs a live moderation preview', async () => {
    const { agent } = await authedAgent();
    const res = await agent.post('/api/moderation/preview').send({ content: 'A perfectly nice and constructive message.', communitySlug: slug }).expect(200);
    expect(res.body.status).toBe('approved');
    expect(typeof res.body.explanation).toBe('string');
  });

  it('toggles a reaction and a bookmark on a post', async () => {
    const { agent, csrf } = await authedAgent();
    const created = await agent
      .post(`/api/communities/${slug}/posts`)
      .set('x-csrf-token', csrf)
      .send({ content: 'Another genuinely constructive and clear contribution here.' })
      .expect(201);
    const postId = created.body.postId;

    const react1 = await agent.post(`/api/communities/${slug}/posts/${postId}/react`).set('x-csrf-token', csrf).send({ reactionType: 'helpful' }).expect(200);
    expect(react1.body.active).toBe(true);
    const react2 = await agent.post(`/api/communities/${slug}/posts/${postId}/react`).set('x-csrf-token', csrf).send({ reactionType: 'helpful' }).expect(200);
    expect(react2.body.active).toBe(false);

    const bm1 = await agent.post(`/api/communities/${slug}/posts/${postId}/bookmark`).set('x-csrf-token', csrf).expect(200);
    expect(bm1.body.bookmarked).toBe(true);
    const bm2 = await agent.post(`/api/communities/${slug}/posts/${postId}/bookmark`).set('x-csrf-token', csrf).expect(200);
    expect(bm2.body.bookmarked).toBe(false);
  });

  it('returns a public profile with posts and reputation dimensions', async () => {
    const res = await request(app).get('/api/users/sarah_chen').expect(200);
    expect(res.body.user.username).toBe('sarah_chen');
    expect(res.body.user.trust).toHaveProperty('name');
    expect(Array.isArray(res.body.posts)).toBe(true);
    expect(Array.isArray(res.body.dimensions)).toBe(true);
  });

  it('404s an unknown profile', async () => {
    await request(app).get('/api/users/nobody_xyz').expect(404);
  });

  it('returns a community constitution with rules', async () => {
    const res = await request(app).get(`/api/communities/${slug}/constitution`).expect(200);
    expect(res.body.community).toHaveProperty('name');
    expect(Array.isArray(res.body.rules)).toBe(true);
    expect(res.body.rules.length).toBeGreaterThan(0);
    expect(res.body.rules[0]).toHaveProperty('severity');
  });

  it('serves the dashboard for an authed user and 401s anon', async () => {
    await request(app).get('/api/me/dashboard').expect(401);
    const { agent } = await authedAgent();
    const res = await agent.get('/api/me/dashboard').expect(200);
    expect(res.body.stats).toHaveProperty('total');
    expect(res.body.user.username).toBe('sarah_chen');
  });

  it('Trust Radar requires auth and returns a health label + insights for a founder', async () => {
    await request(app).get('/api/trust-radar').expect(401);
    const { agent } = await authedAgent('sarah_chen');
    const res = await agent.get('/api/trust-radar').expect(200);
    expect(typeof res.body.healthLabel).toBe('string');
    expect(Array.isArray(res.body.insights)).toBe(true);
    expect(Array.isArray(res.body.newcomers)).toBe(true);
  });

  it('Weekly Trust Report returns metrics for a founder', async () => {
    const { agent } = await authedAgent('sarah_chen');
    const res = await agent.get('/api/trust-report').expect(200);
    expect(res.body.metrics).toHaveProperty('helpfulAnswers');
    expect(Array.isArray(res.body.recommendedActions)).toBe(true);
  });

  it('builds a Decision Receipt for a held post', async () => {
    const { agent, csrf } = await authedAgent();
    const created = await agent
      .post(`/api/communities/${slug}/posts`)
      .set('x-csrf-token', csrf)
      .send({ content: 'you are a stupid idiot and i hope you die' })
      .expect(201);
    const res = await request(app).get(`/api/communities/${slug}/posts/${created.body.postId}/receipt`).expect(200);
    expect(res.body.receipt).toHaveProperty('title');
    expect(res.body.receipt).toHaveProperty('relevantNorm');
    expect(res.body.receipt.status).not.toBe('approved');
  });

  it('adds a comment to a post', async () => {
    const { agent, csrf } = await authedAgent();
    const created = await agent
      .post(`/api/communities/${slug}/posts`)
      .set('x-csrf-token', csrf)
      .send({ content: 'A clear post that others can reply to thoughtfully.' })
      .expect(201);
    const postId = created.body.postId;
    const res = await agent.post(`/api/communities/${slug}/posts/${postId}/comment`).set('x-csrf-token', csrf).send({ content: 'Thanks, this was helpful.' }).expect(201);
    expect(res.body).toHaveProperty('id');
  });
});
