// JSON API for the Civitas SPA client.
//
// Mounted at /api ahead of the EJS res.locals middleware (which regenerates the
// CSRF token on every request) and ahead of the HTML ipRateLimit (too low for
// an SPA). Reuses the same db / moderation / reputation / security logic as the
// server-rendered routes, returning JSON instead of rendering views.

const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');

const db = require('../db');
const { moderate, getPrePublishSuggestions } = require('../moderation');
const { updateReputation, TRUST_LEVELS } = require('../reputation');
const { rateLimit, validateCSRFToken } = require('../security');

const DEMO = process.env.CIVITAS_DEMO_MODE === 'true';
const DEMO_USERS = { founder: 'sarah_chen', member: 'jordan_park', reviewer: 'alex_rivera' };

function trustLevelFor(level) {
  return TRUST_LEVELS.find((tl) => tl.level === level) || TRUST_LEVELS[0];
}

// Stable per-session CSRF token: generated once and reused until it expires,
// unlike the EJS path which mints a fresh token on every request.
function ensureCsrf(req) {
  if (!req.session) return null;
  if (!req.session.csrfToken || !req.session.csrfExpires || req.session.csrfExpires < Date.now()) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
    req.session.csrfExpires = Date.now() + 3600000;
  }
  return req.session.csrfToken;
}

function publicUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    username: u.username,
    displayName: u.display_name || u.username,
    bio: u.bio || '',
    avatarUrl: u.avatar_url || null,
    reputation: u.reputation,
    trustLevel: u.trust_level,
    trust: trustLevelFor(u.trust_level),
  };
}

function activeRules(communityId) {
  const rules = db
    .prepare("SELECT * FROM rules WHERE constitution_id IN (SELECT id FROM constitutions WHERE community_id = ? AND status = 'active')")
    .all(communityId);
  return rules.map((r) => ({ ...r, keywords: JSON.parse(r.keywords || '[]') }));
}

module.exports = function createApiRouter() {
  const router = express.Router();
  router.use(express.json());
  // Express 5 leaves req.body undefined for bodyless POSTs; CSRF validation
  // reads req.body._csrf, so default it to an empty object.
  router.use((req, res, next) => { if (req.body == null) req.body = {}; next(); });

  // Generous, JSON-shaped rate limit (the SPA makes many small calls).
  router.use((req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    if (!rateLimit(`api:${ip}`, 240, 60000)) {
      return res.status(429).json({ error: 'Too many requests. Please slow down.' });
    }
    next();
  });

  const requireAuth = (req, res, next) => {
    if (!req.session || !req.session.userId) return res.status(401).json({ error: 'Authentication required.' });
    next();
  };

  // Reject mutations without a valid CSRF token.
  const requireCsrf = (req, res, next) => {
    if (!validateCSRFToken(req)) return res.status(403).json({ error: 'Invalid or missing CSRF token.' });
    next();
  };

  const currentUser = (req) =>
    req.session && req.session.userId
      ? db.prepare('SELECT id, username, email, display_name, bio, avatar_url, reputation, trust_level FROM users WHERE id = ?').get(req.session.userId)
      : null;

  const getCommunity = (req, res, next) => {
    const community = db.prepare('SELECT * FROM communities WHERE slug = ?').get(req.params.slug);
    if (!community) return res.status(404).json({ error: 'Community not found.' });
    req.community = community;
    next();
  };

  function communityView(community, userId) {
    const memberCount = db.prepare('SELECT COUNT(*) as count FROM community_members WHERE community_id = ?').get(community.id).count;
    const membership = userId
      ? db.prepare('SELECT role FROM community_members WHERE community_id = ? AND user_id = ?').get(community.id, userId)
      : null;
    const topTags = db
      .prepare('SELECT t.*, COUNT(pt.post_id) as usage FROM tags t LEFT JOIN post_tags pt ON t.id = pt.tag_id WHERE t.community_id = ? GROUP BY t.id ORDER BY usage DESC LIMIT 10')
      .all(community.id);
    return {
      id: community.id,
      name: community.name,
      slug: community.slug,
      description: community.description,
      purpose: community.purpose,
      template: community.template,
      createdAt: community.created_at,
      memberCount,
      role: membership ? membership.role : null,
      isMember: !!membership,
      topTags: topTags.map((t) => ({ id: t.id, name: t.name, usage: t.usage })),
    };
  }

  function postSummary(p) {
    return {
      id: p.id,
      title: p.title,
      content: p.content,
      postType: p.post_type,
      status: p.status,
      isPinned: !!p.is_pinned,
      createdAt: p.created_at,
      communityName: p.community_name,
      communitySlug: p.community_slug,
      author: {
        username: p.username,
        displayName: p.display_name || p.username,
        avatarUrl: p.avatar_url || null,
        reputation: p.reputation,
        trustLevel: p.trust_level,
      },
    };
  }

  // --- auth ---
  router.get('/auth/me', (req, res) => {
    const csrfToken = ensureCsrf(req);
    const user = currentUser(req);
    let unreadCount = 0;
    if (user) unreadCount = db.prepare('SELECT COUNT(*) as c FROM notifications WHERE user_id = ? AND is_read = 0').get(user.id).c;
    res.json({ user: publicUser(user), csrfToken, unreadCount, demo: DEMO });
  });

  // One-click demo sign-in (only when demo mode is enabled).
  router.post('/auth/demo', (req, res) => {
    if (!DEMO) return res.status(403).json({ error: 'Demo mode is not enabled.' });
    const username = DEMO_USERS[(req.body || {}).role];
    if (!username) return res.status(400).json({ error: 'Unknown demo role.' });
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user) return res.status(404).json({ error: 'Demo account not found.' });
    req.session.userId = user.id;
    ensureCsrf(req);
    res.json({ user: publicUser(currentUser(req)) });
  });

  router.post('/auth/register', (req, res) => {
    const { username, email, password, displayName } = req.body || {};
    if (!username || !email || !password) return res.status(400).json({ error: 'Username, email and password are required.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
    if (username.length < 3 || username.length > 30) return res.status(400).json({ error: 'Username must be 3-30 characters.' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    if (db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email)) {
      return res.status(409).json({ error: 'Username or email already taken.' });
    }
    const hash = bcrypt.hashSync(password, 10);
    const result = db.prepare('INSERT INTO users (username, email, password_hash, display_name) VALUES (?, ?, ?, ?)').run(username, email, hash, displayName || username);
    req.session.userId = result.lastInsertRowid;
    ensureCsrf(req);
    res.status(201).json({ user: publicUser(currentUser(req)) });
  });

  router.post('/auth/login', (req, res) => {
    const { login, password } = req.body || {};
    if (!login || !password) return res.status(400).json({ error: 'Login and password are required.' });
    const user = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(login, login);
    if (!user || !bcrypt.compareSync(password, user.password_hash)) return res.status(401).json({ error: 'Invalid credentials.' });
    req.session.userId = user.id;
    ensureCsrf(req);
    res.json({ user: publicUser(currentUser(req)) });
  });

  router.post('/auth/logout', requireAuth, requireCsrf, (req, res) => {
    req.session.destroy(() => res.json({ ok: true }));
  });

  // --- communities ---
  router.get('/communities', (req, res) => {
    const communities = db
      .prepare("SELECT c.*, COUNT(DISTINCT cm.user_id) as member_count FROM communities c LEFT JOIN community_members cm ON c.id = cm.community_id WHERE c.is_active = 1 GROUP BY c.id ORDER BY member_count DESC")
      .all();
    res.json({
      communities: communities.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        purpose: c.purpose,
        template: c.template,
        memberCount: c.member_count,
      })),
    });
  });

  router.get('/communities/:slug', getCommunity, (req, res) => {
    res.json({ community: communityView(req.community, req.session.userId) });
  });

  router.get('/communities/:slug/posts', getCommunity, (req, res) => {
    const posts = db
      .prepare("SELECT p.*, u.username, u.display_name, u.avatar_url FROM posts p JOIN users u ON p.user_id = u.id WHERE p.community_id = ? AND p.status = 'approved' ORDER BY p.is_pinned DESC, p.created_at DESC LIMIT 50")
      .all(req.community.id);
    res.json({ posts: posts.map(postSummary) });
  });

  router.post('/communities/:slug/join', requireAuth, requireCsrf, getCommunity, (req, res) => {
    if (!db.prepare('SELECT id FROM community_members WHERE community_id = ? AND user_id = ?').get(req.community.id, req.session.userId)) {
      db.prepare('INSERT INTO community_members (community_id, user_id, role) VALUES (?, ?, ?)').run(req.community.id, req.session.userId, 'member');
    }
    res.json({ community: communityView(req.community, req.session.userId) });
  });

  router.post('/communities/:slug/leave', requireAuth, requireCsrf, getCommunity, (req, res) => {
    db.prepare("DELETE FROM community_members WHERE community_id = ? AND user_id = ? AND role != 'owner'").run(req.community.id, req.session.userId);
    res.json({ community: communityView(req.community, req.session.userId) });
  });

  // --- feed ---
  router.get('/feed', (req, res) => {
    const posts = db
      .prepare("SELECT p.*, u.username, u.display_name, u.avatar_url, u.reputation, u.trust_level, c.name as community_name, c.slug as community_slug FROM posts p JOIN users u ON p.user_id = u.id JOIN communities c ON p.community_id = c.id WHERE p.status = 'approved' ORDER BY p.created_at DESC LIMIT 30")
      .all();
    res.json({ posts: posts.map(postSummary) });
  });

  // --- single post ---
  router.get('/communities/:slug/posts/:id', getCommunity, (req, res) => {
    const post = db
      .prepare('SELECT p.*, u.username, u.display_name, u.avatar_url, u.reputation, u.trust_level FROM posts p JOIN users u ON p.user_id = u.id WHERE p.id = ? AND p.community_id = ?')
      .get(req.params.id, req.community.id);
    if (!post) return res.status(404).json({ error: 'Post not found.' });
    const comments = db
      .prepare("SELECT c.*, u.username, u.display_name, u.avatar_url FROM comments c JOIN users u ON c.user_id = u.id WHERE c.post_id = ? AND c.status = 'approved' ORDER BY c.created_at ASC")
      .all(post.id);
    const reactions = db.prepare('SELECT reaction_type, COUNT(*) as count FROM reactions WHERE post_id = ? GROUP BY reaction_type').all(post.id);
    const userReaction = req.session.userId ? db.prepare('SELECT reaction_type FROM reactions WHERE post_id = ? AND user_id = ?').get(post.id, req.session.userId) : null;
    const tags = db.prepare('SELECT t.* FROM tags t JOIN post_tags pt ON t.id = pt.tag_id WHERE pt.post_id = ?').all(post.id);
    const bookmarked = req.session.userId ? !!db.prepare('SELECT id FROM bookmarks WHERE user_id = ? AND post_id = ?').get(req.session.userId, post.id) : false;
    res.json({
      post: {
        ...postSummary({ ...post, community_name: req.community.name, community_slug: req.community.slug }),
        author: {
          username: post.username,
          displayName: post.display_name || post.username,
          avatarUrl: post.avatar_url || null,
          reputation: post.reputation,
          trustLevel: post.trust_level,
          trust: trustLevelFor(post.trust_level),
        },
      },
      comments: comments.map((c) => ({
        id: c.id,
        content: c.content,
        createdAt: c.created_at,
        author: { username: c.username, displayName: c.display_name || c.username, avatarUrl: c.avatar_url || null },
      })),
      reactions: reactions.map((r) => ({ type: r.reaction_type, count: r.count })),
      userReaction: userReaction ? userReaction.reaction_type : null,
      tags: tags.map((t) => ({ id: t.id, name: t.name })),
      bookmarked,
    });
  });

  router.post('/communities/:slug/posts/:id/comment', requireAuth, requireCsrf, getCommunity, (req, res) => {
    const { content } = req.body || {};
    if (!content || content.trim().length === 0) return res.status(400).json({ error: 'Comment content is required.' });
    const post = db.prepare('SELECT * FROM posts WHERE id = ? AND community_id = ?').get(req.params.id, req.community.id);
    if (!post) return res.status(404).json({ error: 'Post not found.' });
    const result = moderate(content);
    const status = result.status === 'borderline' ? 'pending' : result.status;
    const inserted = db
      .prepare('INSERT INTO comments (post_id, user_id, content, status, ai_score, ai_details) VALUES (?, ?, ?, ?, ?, ?)')
      .run(post.id, req.session.userId, content, status, result.score, JSON.stringify(result.details));
    if (post.user_id !== req.session.userId && status === 'approved') {
      db.prepare('INSERT INTO notifications (user_id, notification_type, title, message, link) VALUES (?, ?, ?, ?, ?)').run(
        post.user_id, 'comment', 'New Comment', 'Someone commented on your post.', `/c/${req.community.slug}/p/${post.id}`,
      );
    }
    res.status(201).json({ id: inserted.lastInsertRowid, status, moderation: { status: result.status, explanation: result.explanation } });
  });

  router.post('/communities/:slug/posts/:id/react', requireAuth, requireCsrf, getCommunity, (req, res) => {
    const { reactionType } = req.body || {};
    const allowed = ['helpful', 'insightful', 'well_explained', 'constructive', 'agree'];
    if (!allowed.includes(reactionType)) return res.status(400).json({ error: 'Invalid reaction type.' });
    const post = db.prepare('SELECT * FROM posts WHERE id = ? AND community_id = ?').get(req.params.id, req.community.id);
    if (!post) return res.status(404).json({ error: 'Post not found.' });
    const existing = db.prepare('SELECT id FROM reactions WHERE post_id = ? AND user_id = ? AND reaction_type = ?').get(post.id, req.session.userId, reactionType);
    if (existing) db.prepare('DELETE FROM reactions WHERE id = ?').run(existing.id);
    else db.prepare('INSERT INTO reactions (post_id, user_id, reaction_type) VALUES (?, ?, ?)').run(post.id, req.session.userId, reactionType);
    const reactions = db.prepare('SELECT reaction_type, COUNT(*) as count FROM reactions WHERE post_id = ? GROUP BY reaction_type').all(post.id);
    res.json({ reactions: reactions.map((r) => ({ type: r.reaction_type, count: r.count })), active: !existing });
  });

  router.post('/communities/:slug/posts/:id/bookmark', requireAuth, requireCsrf, getCommunity, (req, res) => {
    const existing = db.prepare('SELECT id FROM bookmarks WHERE user_id = ? AND post_id = ?').get(req.session.userId, req.params.id);
    if (existing) db.prepare('DELETE FROM bookmarks WHERE id = ?').run(existing.id);
    else db.prepare('INSERT INTO bookmarks (user_id, post_id) VALUES (?, ?)').run(req.session.userId, req.params.id);
    res.json({ bookmarked: !existing });
  });

  // Active rules for a community (for the create-post screen).
  router.get('/communities/:slug/rules', getCommunity, (req, res) => {
    res.json({
      rules: activeRules(req.community.id).map((r) => ({
        id: r.id,
        ruleNumber: r.rule_number,
        title: r.title,
        summary: r.summary,
        purpose: r.purpose,
        severity: r.severity,
      })),
    });
  });

  // --- create post ---
  router.post('/communities/:slug/posts', requireAuth, requireCsrf, getCommunity, (req, res) => {
    const { title, content, postType, tags } = req.body || {};
    if (!content || content.trim().length === 0) return res.status(400).json({ error: 'Content is required.' });
    const rules = activeRules(req.community.id);
    const result = moderate(content, rules);
    const status = result.status === 'borderline' ? 'pending' : result.status;
    const inserted = db
      .prepare('INSERT INTO posts (community_id, user_id, title, content, post_type, status, ai_score, ai_details) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(req.community.id, req.session.userId, title || '', content, postType || 'text', status, result.score, JSON.stringify(result.details));
    const postId = inserted.lastInsertRowid;
    if (tags && typeof tags === 'string') {
      const tagList = tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
      for (const tagName of tagList) {
        let tag = db.prepare('SELECT id FROM tags WHERE community_id = ? AND name = ?').get(req.community.id, tagName);
        if (!tag) {
          const tagResult = db.prepare('INSERT INTO tags (community_id, name) VALUES (?, ?)').run(req.community.id, tagName);
          tag = { id: tagResult.lastInsertRowid };
        }
        db.prepare('INSERT OR IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)').run(postId, tag.id);
      }
    }
    if (status === 'approved') {
      updateReputation(db, req.session.userId, { dimension: 'helpfulness', condition: 'post_approved' });
      updateReputation(db, req.session.userId, { dimension: 'participation', condition: 'post_approved' });
    }
    res.status(201).json({
      postId,
      status,
      slug: req.community.slug,
      moderation: { status: result.status, score: result.score, explanation: result.explanation, details: result.details },
    });
  });

  // --- live moderation preview ---
  router.post('/moderation/preview', requireAuth, (req, res) => {
    const { content, communitySlug } = req.body || {};
    if (!content || content.trim().length === 0) return res.json({ status: null, explanation: '', score: 0 });
    let rules = [];
    if (communitySlug) {
      const community = db.prepare('SELECT id FROM communities WHERE slug = ?').get(communitySlug);
      if (community) rules = activeRules(community.id);
    }
    const result = moderate(content, rules);
    res.json({ status: result.status, score: result.score, explanation: result.explanation, details: result.details });
  });

  // --- Post Coach: live status + helpful suggestions for a draft ---
  router.post('/coach', requireAuth, (req, res) => {
    const { content, communitySlug } = req.body || {};
    if (!content || content.trim().length === 0) return res.json({ status: null, explanation: '', suggestions: [] });
    let rules = [];
    if (communitySlug) {
      const community = db.prepare('SELECT id FROM communities WHERE slug = ?').get(communitySlug);
      if (community) rules = activeRules(community.id);
    }
    const result = moderate(content, rules);
    const { suggestions } = getPrePublishSuggestions(content, rules);
    res.json({ status: result.status, explanation: result.explanation, suggestions });
  });

  // ---------- Trust diagnostic layer ----------

  function ownedCommunity(userId) {
    return db
      .prepare("SELECT c.* FROM communities c JOIN community_members m ON m.community_id = c.id WHERE m.user_id = ? AND m.role IN ('owner','admin') ORDER BY c.id LIMIT 1")
      .get(userId);
  }

  function hoursSince(iso) {
    const t = new Date((iso || '').replace(' ', 'T') + 'Z').getTime();
    if (Number.isNaN(t)) return 0;
    return Math.max(0, Math.round((Date.now() - t) / 3600000));
  }

  // Computes live trust signals for a community from existing data. No fake
  // precision — everything here is grounded in real rows.
  function computeRadar(community) {
    const cid = community.id;
    const insights = [];

    // Per-author approved post counts (to spot first-time posters).
    const counts = {};
    db.prepare("SELECT user_id, COUNT(*) c FROM posts WHERE community_id = ? AND status = 'approved' GROUP BY user_id").all(cid).forEach((r) => (counts[r.user_id] = r.c));

    // Unanswered posts (no approved comment yet).
    const unanswered = db
      .prepare(
        "SELECT p.id, p.title, p.content, p.created_at, p.user_id, u.username, u.display_name, u.avatar_url FROM posts p JOIN users u ON u.id = p.user_id WHERE p.community_id = ? AND p.status = 'approved' AND NOT EXISTS (SELECT 1 FROM comments c WHERE c.post_id = p.id AND c.status = 'approved') ORDER BY p.created_at ASC",
      )
      .all(cid);

    const newcomers = unanswered
      .filter((p) => (counts[p.user_id] || 0) <= 1)
      .map((p) => ({
        postId: p.id,
        slug: community.slug,
        title: p.title || p.content.slice(0, 80),
        author: { username: p.username, displayName: p.display_name || p.username, avatarUrl: p.avatar_url || null },
        hoursWaiting: hoursSince(p.created_at),
        reason: 'First-time poster with no reply yet',
      }));

    if (newcomers.length > 0) {
      const worst = Math.max(...newcomers.map((n) => n.hoursWaiting));
      insights.push({
        type: 'newcomer',
        severity: newcomers.length >= 3 || worst >= 24 ? 'serious' : 'warning',
        title: 'Newcomers are being ignored',
        description: `${newcomers.length} first-time poster${newcomers.length > 1 ? 's have' : ' has'} no reply yet (longest waiting ${worst}h). New members often return when their first post gets a helpful reply.`,
        evidence: newcomers.slice(0, 3).map((n) => `${n.author.displayName}: “${n.title}” — ${n.hoursWaiting}h`),
        action: 'Rescue newcomers',
        actionTo: '/radar#newcomers',
      });
    }

    // Open review queue + ageing.
    const queue = db.prepare("SELECT COUNT(*) c, MIN(created_at) oldest FROM posts WHERE community_id = ? AND status IN ('pending','borderline')").get(cid);
    if (queue.c > 0) {
      insights.push({
        type: 'queue',
        severity: hoursSince(queue.oldest) >= 24 ? 'warning' : 'info',
        title: 'Posts are waiting for review',
        description: `${queue.c} post${queue.c > 1 ? 's are' : ' is'} in the review queue. Oldest has waited ${hoursSince(queue.oldest)}h.`,
        evidence: [`${queue.c} in queue`, `oldest ${hoursSince(queue.oldest)}h`],
        action: 'Open Review Center',
        actionTo: '/c/' + community.slug,
      });
    }

    // Which charter norm is causing the most holds (parsed from screening).
    const held = db.prepare("SELECT ai_details FROM posts WHERE community_id = ? AND status IN ('pending','rejected')").all(cid);
    const ruleTally = {};
    held.forEach((h) => {
      try {
        const d = JSON.parse(h.ai_details || '{}');
        (d.constitutionalViolations || []).forEach((v) => {
          if (v.ruleTitle) ruleTally[v.ruleTitle] = (ruleTally[v.ruleTitle] || 0) + 1;
        });
      } catch {
        /* ignore */
      }
    });
    const topRule = Object.entries(ruleTally).sort((a, b) => b[1] - a[1])[0];
    if (topRule && topRule[1] >= 2) {
      insights.push({
        type: 'rule',
        severity: 'warning',
        title: `“${topRule[0]}” may need clearer examples`,
        description: `Most recent holds involved “${topRule[0]}” (${topRule[1]} cases). Adding good/not-okay examples to the charter reduces confusion.`,
        evidence: [`${topRule[1]} holds cited this norm`],
        action: 'Open the charter',
        actionTo: '/c/' + community.slug + '/constitution',
      });
    }

    // Reviewer load concentration.
    const reviewers = db
      .prepare('SELECT d.decided_by, COUNT(*) c FROM decisions d JOIN moderation_cases mc ON mc.id = d.case_id WHERE mc.community_id = ? GROUP BY d.decided_by ORDER BY c DESC')
      .all(cid);
    const totalDecisions = reviewers.reduce((s, r) => s + r.c, 0);
    if (totalDecisions >= 4 && reviewers.length > 0 && reviewers[0].c / totalDecisions >= 0.6) {
      const pct = Math.round((reviewers[0].c / totalDecisions) * 100);
      insights.push({
        type: 'reviewers',
        severity: 'warning',
        title: 'Review load is concentrated',
        description: `One reviewer handled ${pct}% of decisions. Spreading the load protects your most active stewards from burnout.`,
        evidence: [`${pct}% by one reviewer`, `${totalDecisions} decisions total`],
        action: 'Recruit a reviewer',
        actionTo: '/radar',
      });
    }

    // Contributor drift: members active >14d ago but silent since.
    const drift = db
      .prepare(
        `SELECT COUNT(*) c FROM (
           SELECT u.id, MAX(p.created_at) last
           FROM users u JOIN posts p ON p.user_id = u.id
           WHERE p.community_id = ? AND p.status='approved'
           GROUP BY u.id
           HAVING last < datetime('now','-14 days')
         )`,
      )
      .get(cid).c;
    if (drift >= 2) {
      insights.push({
        type: 'drift',
        severity: 'info',
        title: 'Some contributors are drifting',
        description: `${drift} previously active members haven’t posted in over two weeks. A nudge or thank-you often brings helpers back.`,
        evidence: [`${drift} quiet contributors`],
        action: 'See contributors',
        actionTo: '/radar',
      });
    }

    // Overall label.
    const serious = insights.filter((i) => i.severity === 'serious').length;
    const warnings = insights.filter((i) => i.severity === 'warning').length;
    let healthLabel = 'Strong';
    if (serious > 0) healthLabel = 'At risk';
    else if (warnings >= 2) healthLabel = 'Needs attention';
    else if (warnings === 1 || insights.length > 0) healthLabel = 'Stable';

    const recommendedActions = insights
      .filter((i) => i.severity !== 'info')
      .map((i) => i.action)
      .slice(0, 4);

    return { healthLabel, insights, newcomers, recommendedActions };
  }

  router.get('/trust-radar', requireAuth, (req, res) => {
    const community = ownedCommunity(req.session.userId);
    if (!community) return res.status(404).json({ error: 'You don’t manage a community yet.' });
    const radar = computeRadar(community);
    res.json({ community: { name: community.name, slug: community.slug }, ...radar });
  });

  router.get('/trust-report', requireAuth, (req, res) => {
    const community = ownedCommunity(req.session.userId);
    if (!community) return res.status(404).json({ error: 'You don’t manage a community yet.' });
    const cid = community.id;
    const since = "datetime('now','-7 days')";
    const one = (sql, ...a) => db.prepare(sql).get(...a).c;
    const metrics = {
      newPosts: one(`SELECT COUNT(*) c FROM posts WHERE community_id=? AND created_at >= ${since}`, cid),
      helpfulAnswers: one(`SELECT COUNT(*) c FROM comments cm JOIN posts p ON p.id=cm.post_id WHERE p.community_id=? AND cm.status='approved' AND cm.created_at >= ${since}`, cid),
      newMembers: one(`SELECT COUNT(*) c FROM community_members WHERE community_id=? AND joined_at >= ${since}`, cid),
      openCases: one("SELECT COUNT(*) c FROM posts WHERE community_id=? AND status IN ('pending','borderline')", cid),
    };
    const radar = computeRadar(community);
    res.json({
      community: { name: community.name, slug: community.slug },
      weekOf: new Date().toISOString().slice(0, 10),
      healthLabel: radar.healthLabel,
      improvements: [
        `${metrics.helpfulAnswers} helpful answer${metrics.helpfulAnswers === 1 ? '' : 's'} posted`,
        `${metrics.newMembers} newcomer${metrics.newMembers === 1 ? '' : 's'} welcomed`,
        `${metrics.newPosts} new post${metrics.newPosts === 1 ? '' : 's'} started`,
      ],
      risks: radar.insights.filter((i) => i.severity !== 'info').map((i) => i.title),
      recommendedActions: radar.insights.filter((i) => i.severity !== 'info').map((i) => ({ title: i.action, why: i.title })),
      metrics,
    });
  });

  // Decision Receipt: a clear, honest explanation of what happened to a post.
  router.get('/communities/:slug/posts/:id/receipt', getCommunity, (req, res) => {
    const post = db.prepare('SELECT * FROM posts WHERE id = ? AND community_id = ?').get(req.params.id, req.community.id);
    if (!post) return res.status(404).json({ error: 'Post not found.' });
    let details = {};
    try {
      details = JSON.parse(post.ai_details || '{}');
    } catch {
      /* ignore */
    }
    const violation = (details.constitutionalViolations || [])[0];
    const reasonsText =
      (details.reasons || []).length > 0
        ? 'Automated screening flagged: ' + details.reasons.map((r) => r.rule).join(', ') + '.'
        : violation
          ? `This may conflict with “${violation.ruleTitle}”.`
          : 'Automated screening was uncertain about this content.';

    const STATUS = {
      approved: { title: 'Your post is live', reviewedBy: 'Automated screening', appeal: false, next: ['Nothing to do — it published immediately.'] },
      pending: {
        title: 'Your post was sent for community review',
        reviewedBy: 'Automated screening → community reviewers',
        appeal: true,
        next: ['Two qualified reviewers will look at it.', 'You can edit it, wait for review, or withdraw it.'],
      },
      rejected: {
        title: 'Your post needs changes before it goes live',
        reviewedBy: 'Automated screening',
        appeal: true,
        next: ['Edit the flagged part and resubmit.', 'Or appeal for a human decision.'],
      },
    };
    const s = STATUS[post.status] || STATUS.pending;
    res.json({
      receipt: {
        status: post.status,
        title: s.title,
        relevantNorm: violation ? violation.ruleTitle : 'Community guidelines',
        reason: reasonsText,
        reviewedBy: s.reviewedBy,
        nextSteps: s.next,
        appealAvailable: s.appeal,
        expectedTime: post.status === 'pending' ? 'Usually under 6 hours' : null,
        createdAt: post.created_at,
      },
    });
  });

  // --- public profile ---
  router.get('/users/:username', (req, res) => {
    const u = db
      .prepare('SELECT id, username, display_name, bio, avatar_url, reputation, trust_level, joined_at FROM users WHERE username = ?')
      .get(req.params.username);
    if (!u) return res.status(404).json({ error: 'User not found.' });
    const posts = db
      .prepare("SELECT p.*, c.name as community_name, c.slug as community_slug FROM posts p JOIN communities c ON p.community_id = c.id WHERE p.user_id = ? AND p.status = 'approved' ORDER BY p.created_at DESC LIMIT 20")
      .all(u.id);
    const dimensions = db.prepare('SELECT dimension, score FROM user_reputation_dimensions WHERE user_id = ?').all(u.id);
    const withAuthor = (p) => ({ ...p, username: u.username, display_name: u.display_name, avatar_url: u.avatar_url, reputation: u.reputation, trust_level: u.trust_level });
    res.json({
      user: {
        id: u.id,
        username: u.username,
        displayName: u.display_name || u.username,
        bio: u.bio || '',
        avatarUrl: u.avatar_url || null,
        reputation: u.reputation,
        trustLevel: u.trust_level,
        trust: trustLevelFor(u.trust_level),
        joinedAt: u.joined_at,
      },
      posts: posts.map((p) => postSummary(withAuthor(p))),
      dimensions,
    });
  });

  // --- constitution ---
  router.get('/communities/:slug/constitution', getCommunity, (req, res) => {
    const constitution = db
      .prepare("SELECT * FROM constitutions WHERE community_id = ? AND status = 'active' ORDER BY version DESC LIMIT 1")
      .get(req.community.id);
    const rules = constitution
      ? db.prepare('SELECT * FROM rules WHERE constitution_id = ? ORDER BY rule_number ASC').all(constitution.id)
      : [];
    res.json({
      community: { name: req.community.name, slug: req.community.slug, purpose: req.community.purpose },
      constitution: constitution ? { version: constitution.version, effectiveAt: constitution.effective_at } : null,
      rules: rules.map((r) => ({
        id: r.id,
        ruleNumber: r.rule_number,
        title: r.title,
        summary: r.summary,
        purpose: r.purpose,
        severity: r.severity,
      })),
    });
  });

  // --- personal dashboard ---
  router.get('/me/dashboard', requireAuth, (req, res) => {
    const u = currentUser(req);
    const posts = db
      .prepare('SELECT p.*, c.name as community_name, c.slug as community_slug FROM posts p JOIN communities c ON p.community_id = c.id WHERE p.user_id = ? ORDER BY p.created_at DESC LIMIT 50')
      .all(u.id);
    const stats = {
      total: posts.length,
      approved: posts.filter((p) => p.status === 'approved').length,
      pending: posts.filter((p) => p.status === 'pending').length,
      rejected: posts.filter((p) => p.status === 'rejected').length,
    };
    const dimensions = db.prepare('SELECT dimension, score FROM user_reputation_dimensions WHERE user_id = ?').all(u.id);
    const withAuthor = (p) => ({ ...p, username: u.username, display_name: u.display_name, avatar_url: u.avatar_url, reputation: u.reputation, trust_level: u.trust_level });
    res.json({ user: publicUser(u), stats, dimensions, posts: posts.map((p) => postSummary(withAuthor(p))) });
  });

  return router;
};
