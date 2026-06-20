process.on('uncaughtException', (err) => { console.error('UNCAUGHT:', err.message, err.stack); });
process.on('unhandledRejection', (err) => { console.error('UNHANDLED:', err.message, err.stack); });

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const db = require('./db');
const { moderate, getPrePublishSuggestions, analyzeConstitution } = require('./moderation');
const { updateReputation, getTrustLevel, TRUST_LEVELS } = require('./reputation');
const { generateCSRFToken, securityHeaders, ipRateLimit, authRateLimit } = require('./security');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
// Absolute paths so views/static resolve no matter what CWD the app is launched
// from (relative paths were the cause of unstyled pages).
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const isProd = process.env.NODE_ENV === 'production';
if (isProd) app.set('trust proxy', 1); // secure cookies behind a hosting proxy
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: isProd, httpOnly: true, sameSite: 'lax', maxAge: 24 * 60 * 60 * 1000 },
}));

app.use(securityHeaders);

// Health check for hosting platforms (Koyeb, etc.).
app.get('/healthz', (req, res) => {
  res.json({ status: 'ok', demo: process.env.CIVITAS_DEMO_MODE === 'true', uptime: process.uptime() });
});

// JSON API for the SPA client — mounted before the HTML rate limiter and the
// EJS res.locals middleware (which regenerates the CSRF token each request).
app.use('/api', require('./api')());

// Serve the built React SPA at /app (single-process deploy, no Vite needed).
// Falls through gracefully if the client hasn't been built yet.
const clientDist = path.join(__dirname, 'client', 'dist');
if (fs.existsSync(path.join(clientDist, 'index.html'))) {
  app.use('/app', express.static(clientDist));
  app.get(/^\/app(\/.*)?$/, (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
  // Make the polished SPA the front door; the classic EJS app stays reachable
  // at its own routes (e.g. /c, /proposals) for features not yet in the SPA.
  app.get('/', (req, res) => res.redirect('/app/'));
}

app.use(ipRateLimit);

app.use((req, res, next) => {
  try {
    res.locals.currentUser = req.session.userId
      ? db.prepare('SELECT id, username, email, display_name, bio, avatar_url, reputation, trust_level FROM users WHERE id = ?').get(req.session.userId)
      : null;
    res.locals.currentCommunity = null;
    res.locals.csrfToken = req.session ? generateCSRFToken(req) : null;
    res.locals.unreadCount = 0;
    if (res.locals.currentUser) {
      res.locals.unreadCount = db.prepare('SELECT COUNT(*) as c FROM notifications WHERE user_id = ? AND is_read = 0').get(res.locals.currentUser.id).c;
    }
    next();
  } catch(err) {
    console.error('MIDDLEWARE ERROR:', err.message);
    next(err);
  }
});

const requireAuth = (req, res, next) => {
  if (!req.session.userId) return res.redirect('/login');
  next();
};

const optionalAuth = (req, res, next) => next();

const getCommunityBySlug = (req, res, next) => {
  if (!req.params.slug) return next();
  const community = db.prepare('SELECT * FROM communities WHERE slug = ?').get(req.params.slug);
  if (!community) return res.status(404).render('error', { title: 'Community Not Found', message: 'This community does not exist.' });
  res.locals.currentCommunity = community;
  next();
};

function notify(userId, type, title, message, link) {
  db.prepare('INSERT INTO notifications (user_id, notification_type, title, message, link) VALUES (?, ?, ?, ?, ?)').run(userId, type, title, message, link || '');
}

// LANDING
app.get('/', optionalAuth, (req, res) => {
  const communities = db.prepare("SELECT c.*, COUNT(DISTINCT cm.user_id) as member_count FROM communities c LEFT JOIN community_members cm ON c.id = cm.community_id WHERE c.is_active = 1 GROUP BY c.id ORDER BY member_count DESC LIMIT 10").all();
  const recentPosts = db.prepare("SELECT p.*, u.username, u.display_name, c.name as community_name, c.slug as community_slug FROM posts p JOIN users u ON p.user_id = u.id JOIN communities c ON p.community_id = c.id WHERE p.status = 'approved' ORDER BY p.created_at DESC LIMIT 10").all();
  res.render('index', { communities, recentPosts });
});

// AUTH
app.get('/register', (req, res) => { if (req.session.userId) return res.redirect('/'); res.render('auth', { mode: 'register', error: null }); });
app.post('/register', authRateLimit, (req, res) => {
  const { username, email, password, display_name } = req.body;
  if (!username || !email || !password) return res.render('auth', { mode: 'register', error: 'All fields are required.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.render('auth', { mode: 'register', error: 'Please enter a valid email address.' });
  if (username.length < 3 || username.length > 30) return res.render('auth', { mode: 'register', error: 'Username must be 3-30 characters.' });
  if (password.length < 8) return res.render('auth', { mode: 'register', error: 'Password must be at least 8 characters.' });
  if (db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email)) return res.render('auth', { mode: 'register', error: 'Username or email already taken.' });
  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare('INSERT INTO users (username, email, password_hash, display_name) VALUES (?, ?, ?, ?)').run(username, email, hash, display_name || username);
  req.session.userId = result.lastInsertRowid;
  res.redirect('/');
});

app.get('/login', (req, res) => { if (req.session.userId) return res.redirect('/'); res.render('auth', { mode: 'login', error: null }); });
app.post('/login', authRateLimit, (req, res) => {
  const { login, password } = req.body;
  if (!login || !password) return res.render('auth', { mode: 'login', error: 'All fields are required.' });
  const user = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(login, login);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) return res.render('auth', { mode: 'login', error: 'Invalid credentials.' });
  req.session.userId = user.id;
  res.redirect('/');
});

app.get('/logout', (req, res) => { req.session.destroy(); res.redirect('/'); });

// COMMUNITIES
app.get('/c', optionalAuth, (req, res) => {
  const communities = db.prepare("SELECT c.*, COUNT(DISTINCT cm.user_id) as member_count FROM communities c LEFT JOIN community_members cm ON c.id = cm.community_id WHERE c.is_active = 1 GROUP BY c.id ORDER BY member_count DESC").all();
  res.render('communities', { communities });
});

const TEMPLATE_RULES = {
  custom: [
    { title: 'Be Respectful', summary: 'Treat everyone with respect. No personal attacks or harassment.', purpose: 'Maintain a welcoming environment.', severity: 'critical', keywords: ['insult','attack','harass'] },
    { title: 'Stay On Topic', summary: 'Keep posts relevant to the community purpose.', purpose: 'Ensure content is useful to members.', severity: 'standard', keywords: ['off-topic'] },
    { title: 'No Spam', summary: 'Do not post promotional content without context.', purpose: 'Prevent commercialization of the space.', severity: 'standard', keywords: ['buy now','click here','subscribe'] },
  ],
  creator: [
    { title: 'Constructive Feedback', summary: 'Give feedback that helps others improve their work. No empty criticism.', purpose: 'Foster growth-oriented discussions.', severity: 'critical', keywords: ['terrible','awful','worst','useless'] },
    { title: 'No Spam', summary: 'Share your work only in designated spaces.', purpose: 'Prevent commercialization.', severity: 'standard', keywords: ['buy now','click here','subscribe'] },
    { title: 'Credit Others', summary: 'Give credit when sharing others\' work or ideas.', purpose: 'Maintain integrity.', severity: 'standard', keywords: ['plagiarism','steal','copy'] },
  ],
  course: [
    { title: 'Respectful Q&A', summary: 'Ask and answer questions respectfully. No condescension toward learners.', purpose: 'Create a safe learning environment.', severity: 'critical', keywords: ['stupid','obvious','dumb'] },
    { title: 'No Plagiarism', summary: 'Share original work. Cite sources.', purpose: 'Academic integrity.', severity: 'critical', keywords: ['plagiarism','copy paste'] },
    { title: 'Stay On Topic', summary: 'Keep discussions relevant to the course material.', purpose: 'Focus learning.', severity: 'standard', keywords: ['off-topic'] },
  ],
  opensource: [
    { title: 'Code of Conduct', summary: 'Be respectful and inclusive. No harassment or discrimination.', purpose: 'Maintain a welcoming open source community.', severity: 'critical', keywords: ['insult','attack','harass','slur'] },
    { title: 'Contribution Guidelines', summary: 'Follow the project\'s contribution process. No spam PRs.', purpose: 'Maintain code quality.', severity: 'standard', keywords: ['spam','junk'] },
    { title: 'Technical Disagreements', summary: 'Disagree with the approach, not the person. Back up arguments with evidence.', purpose: 'Keep technical discussions productive.', severity: 'standard', keywords: ['terrible','awful','idiot'] },
  ],
  professional: [
    { title: 'Expertise Standards', summary: 'Share accurate information. Cite sources for factual claims.', purpose: 'Maintain high-quality discussion.', severity: 'critical', keywords: ['fake','lies'] },
    { title: 'No Solicitation', summary: 'No unsolicited DMs or promotional posts.', purpose: 'Keep the space professional.', severity: 'standard', keywords: ['hire me','buy my','check out my'] },
    { title: 'Respectful Disagreement', summary: 'Challenge ideas, not people.', purpose: 'Enable productive debate.', severity: 'standard', keywords: ['idiot','clueless','moron'] },
  ],
  civic: [
    { title: 'Debate Norms', summary: 'Attack arguments, not people. No personal insults.', purpose: 'Enable robust deliberation.', severity: 'critical', keywords: ['idiot','moron','traitor','fascist'] },
    { title: 'Evidence Expectations', summary: 'Support factual claims with sources.', purpose: 'Maintain discussion quality.', severity: 'standard', keywords: ['trust me','everyone knows'] },
    { title: 'Proposal Process', summary: 'Use the proposal system for structural changes.', purpose: 'Ensure organized governance.', severity: 'standard', keywords: ['proposal','change'] },
  ],
};

app.get('/c/new', requireAuth, (req, res) => res.render('create-community', { error: null }));
app.post('/c/new', requireAuth, (req, res) => {
  const { name, description, purpose, template } = req.body;
  if (!name) return res.render('create-community', { error: 'Community name is required.' });
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (db.prepare('SELECT id FROM communities WHERE slug = ?').get(slug)) return res.render('create-community', { error: 'A community with that name already exists.' });
  const selectedTemplate = template || 'custom';
  const result = db.prepare('INSERT INTO communities (name, slug, description, purpose, template, created_by) VALUES (?, ?, ?, ?, ?, ?)').run(name, slug, description || '', purpose || '', selectedTemplate, req.session.userId);
  db.prepare('INSERT INTO community_members (community_id, user_id, role) VALUES (?, ?, ?)').run(result.lastInsertRowid, req.session.userId, 'owner');
  const constResult = db.prepare("INSERT INTO constitutions (community_id, version, status, created_by, effective_at) VALUES (?, 1, 'active', ?, datetime('now'))").run(result.lastInsertRowid, req.session.userId);
  const defaultRules = TEMPLATE_RULES[selectedTemplate] || TEMPLATE_RULES.custom;
  defaultRules.forEach((rule, i) => {
    db.prepare('INSERT INTO rules (constitution_id, rule_number, title, summary, purpose, severity, keywords) VALUES (?, ?, ?, ?, ?, ?, ?)').run(constResult.lastInsertRowid, i + 1, rule.title, rule.summary, rule.purpose, rule.severity, JSON.stringify(rule.keywords));
  });
  res.redirect('/c/' + slug);
});

app.get('/c/:slug', optionalAuth, getCommunityBySlug, (req, res) => {
  const community = res.locals.currentCommunity;
  const memberCount = db.prepare('SELECT COUNT(*) as count FROM community_members WHERE community_id = ?').get(community.id).count;
  const isMember = req.session.userId ? db.prepare('SELECT role FROM community_members WHERE community_id = ? AND user_id = ?').get(community.id, req.session.userId) : null;
  const posts = db.prepare("SELECT p.*, u.username, u.display_name, u.avatar_url FROM posts p JOIN users u ON p.user_id = u.id WHERE p.community_id = ? AND p.status = 'approved' ORDER BY p.is_pinned DESC, p.created_at DESC LIMIT 30").all(community.id);
  const topTags = db.prepare('SELECT t.*, COUNT(pt.post_id) as usage FROM tags t LEFT JOIN post_tags pt ON t.id = pt.tag_id WHERE t.community_id = ? GROUP BY t.id ORDER BY usage DESC LIMIT 10').all(community.id);
  res.render('community', { community, memberCount, isMember, posts, topTags });
});

app.post('/c/:slug/join', requireAuth, getCommunityBySlug, (req, res) => {
  const community = res.locals.currentCommunity;
  if (!db.prepare('SELECT id FROM community_members WHERE community_id = ? AND user_id = ?').get(community.id, req.session.userId)) {
    db.prepare('INSERT INTO community_members (community_id, user_id, role) VALUES (?, ?, ?)').run(community.id, req.session.userId, 'member');
  }
  res.redirect('/c/' + community.slug);
});

app.post('/c/:slug/leave', requireAuth, getCommunityBySlug, (req, res) => {
  const community = res.locals.currentCommunity;
  db.prepare("DELETE FROM community_members WHERE community_id = ? AND user_id = ? AND role != 'owner'").run(community.id, req.session.userId);
  res.redirect('/c/' + community.slug);
});

// POSTS
app.get('/c/:slug/new', requireAuth, getCommunityBySlug, (req, res) => {
  const community = res.locals.currentCommunity;
  const rules = db.prepare("SELECT * FROM rules WHERE constitution_id IN (SELECT id FROM constitutions WHERE community_id = ? AND status = 'active')").all(community.id);
  res.render('create-post', { community, rules, error: null });
});

app.post('/c/:slug/new', requireAuth, getCommunityBySlug, (req, res) => {
  const community = res.locals.currentCommunity;
  const { title, content, post_type, tags } = req.body;
  if (!content || content.trim().length === 0) {
    const rules = db.prepare("SELECT * FROM rules WHERE constitution_id IN (SELECT id FROM constitutions WHERE community_id = ? AND status = 'active')").all(community.id);
    return res.render('create-post', { community, rules, error: 'Content is required.' });
  }
  const rules = db.prepare("SELECT * FROM rules WHERE constitution_id IN (SELECT id FROM constitutions WHERE community_id = ? AND status = 'active')").all(community.id);
  const moderationResult = moderate(content, rules.map(r => ({ ...r, keywords: JSON.parse(r.keywords || '[]') })));
  const status = moderationResult.status === 'borderline' ? 'pending' : moderationResult.status;
  const result = db.prepare('INSERT INTO posts (community_id, user_id, title, content, post_type, status, ai_score, ai_details) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(community.id, req.session.userId, title || '', content, post_type || 'text', status, moderationResult.score, JSON.stringify(moderationResult.details));
  if (tags) {
    const tagList = tags.split(',').map(t => t.trim().toLowerCase()).filter(t => t);
    for (const tagName of tagList) {
      let tag = db.prepare('SELECT id FROM tags WHERE community_id = ? AND name = ?').get(community.id, tagName);
      if (!tag) { const tagResult = db.prepare('INSERT INTO tags (community_id, name) VALUES (?, ?)').run(community.id, tagName); tag = { id: tagResult.lastInsertRowid }; }
      db.prepare('INSERT OR IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)').run(result.lastInsertRowid, tag.id);
    }
  }
  updateReputation(db, req.session.userId, { dimension: 'helpfulness', condition: 'post_approved' });
  updateReputation(db, req.session.userId, { dimension: 'participation', condition: 'post_approved' });
  res.redirect('/c/' + community.slug + '/p/' + result.lastInsertRowid);
});

app.get('/c/:slug/p/:id', optionalAuth, getCommunityBySlug, (req, res) => {
  const community = res.locals.currentCommunity;
  const post = db.prepare('SELECT p.*, u.username, u.display_name, u.avatar_url, u.reputation, u.trust_level FROM posts p JOIN users u ON p.user_id = u.id WHERE p.id = ? AND p.community_id = ?').get(req.params.id, community.id);
  if (!post) return res.status(404).render('error', { title: 'Post Not Found', message: 'This post does not exist.' });
  const comments = db.prepare("SELECT c.*, u.username, u.display_name, u.avatar_url FROM comments c JOIN users u ON c.user_id = u.id WHERE c.post_id = ? AND c.status = 'approved' ORDER BY c.created_at ASC").all(post.id);
  const votes = db.prepare('SELECT reaction_type, COUNT(*) as count FROM reactions WHERE post_id = ? GROUP BY reaction_type').all(post.id);
  const userVote = req.session.userId ? db.prepare('SELECT reaction_type FROM reactions WHERE post_id = ? AND user_id = ?').get(post.id, req.session.userId) : null;
  const postTags = db.prepare('SELECT t.* FROM tags t JOIN post_tags pt ON t.id = pt.tag_id WHERE pt.post_id = ?').all(post.id);
  const isBookmarked = req.session.userId ? db.prepare('SELECT id FROM bookmarks WHERE user_id = ? AND post_id = ?').get(req.session.userId, post.id) : null;
  res.render('post', { community, post, comments, votes, userVote, postTags, isBookmarked });
});

app.post('/c/:slug/p/:id/comment', requireAuth, getCommunityBySlug, (req, res) => {
  const community = res.locals.currentCommunity;
  const { content } = req.body;
  if (!content || content.trim().length === 0) return res.redirect('/c/' + community.slug + '/p/' + req.params.id);
  const moderationResult = moderate(content);
  const status = moderationResult.status === 'borderline' ? 'pending' : moderationResult.status;
  db.prepare('INSERT INTO comments (post_id, user_id, content, status, ai_score, ai_details) VALUES (?, ?, ?, ?, ?, ?)').run(req.params.id, req.session.userId, content, status, moderationResult.score, JSON.stringify(moderationResult.details));
  const post = db.prepare('SELECT user_id FROM posts WHERE id = ?').get(req.params.id);
  if (post && post.user_id !== req.session.userId) notify(post.user_id, 'comment', 'New Comment', 'Someone commented on your post.', '/c/' + community.slug + '/p/' + req.params.id);
  res.redirect('/c/' + community.slug + '/p/' + req.params.id);
});

app.post('/c/:slug/p/:id/vote', requireAuth, getCommunityBySlug, (req, res) => {
  const community = res.locals.currentCommunity;
  const { reaction_type } = req.body;
  const post = db.prepare('SELECT * FROM posts WHERE id = ? AND community_id = ?').get(req.params.id, community.id);
  if (!post) return res.status(404).render('error', { title: 'Not Found', message: 'Post not found.' });
  const existing = db.prepare('SELECT id FROM reactions WHERE post_id = ? AND user_id = ? AND reaction_type = ?').get(post.id, req.session.userId, reaction_type);
  if (existing) { db.prepare('DELETE FROM reactions WHERE id = ?').run(existing.id); }
  else { db.prepare('INSERT INTO reactions (post_id, user_id, reaction_type) VALUES (?, ?, ?)').run(post.id, req.session.userId, reaction_type); }
  res.redirect('/c/' + community.slug + '/p/' + req.params.id);
});

app.post('/c/:slug/p/:id/bookmark', requireAuth, getCommunityBySlug, (req, res) => {
  const community = res.locals.currentCommunity;
  const existing = db.prepare('SELECT id FROM bookmarks WHERE user_id = ? AND post_id = ?').get(req.session.userId, req.params.id);
  if (existing) { db.prepare('DELETE FROM bookmarks WHERE id = ?').run(existing.id); }
  else { db.prepare('INSERT INTO bookmarks (user_id, post_id) VALUES (?, ?)').run(req.session.userId, req.params.id); }
  res.redirect('/c/' + community.slug + '/p/' + req.params.id);
});

// MODERATION
app.get('/moderation', requireAuth, (req, res) => {
  const queue = db.prepare("SELECT p.*, u.username, u.display_name, c.name as community_name, c.slug as community_slug FROM posts p JOIN users u ON p.user_id = u.id JOIN communities c ON p.community_id = c.id WHERE p.status IN ('pending', 'borderline') ORDER BY p.created_at ASC").all();
  res.render('moderation', { queue, recentDecisions: [] });
});

app.post('/moderation/:id/decision', requireAuth, (req, res) => {
  const { decision, rationale } = req.body;
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  if (!post) return res.status(404).render('error', { title: 'Not Found', message: 'Post not found.' });
  db.prepare('UPDATE posts SET status = ? WHERE id = ?').run(decision, post.id);
  const caseResult = db.prepare('INSERT INTO moderation_cases (post_id, community_id, case_type, status) VALUES (?, ?, ?, ?)').run(post.id, post.community_id, 'content', 'decided');
  db.prepare('INSERT INTO decisions (case_id, decision, rationale, decided_by) VALUES (?, ?, ?, ?)').run(caseResult.lastInsertRowid, decision, rationale || '', req.session.userId);
  db.prepare('UPDATE users SET mod_votes_total = mod_votes_total + 1 WHERE id = ?').run(req.session.userId);
  if (decision === 'approved') db.prepare('UPDATE users SET mod_votes_correct = mod_votes_correct + 1 WHERE id = ?').run(req.session.userId);
  if (post.user_id !== req.session.userId) notify(post.user_id, 'moderation', 'Post ' + decision, 'Your post has been ' + decision + '.', '/c/' + post.community_id + '/p/' + post.id);
  res.redirect('/moderation');
});

// DASHBOARD
app.get('/dashboard', requireAuth, (req, res) => {
  const user = res.locals.currentUser;
  const userPosts = db.prepare('SELECT p.*, c.name as community_name, c.slug as community_slug FROM posts p JOIN communities c ON p.community_id = c.id WHERE p.user_id = ? ORDER BY p.created_at DESC').all(user.id);
  const stats = { totalPosts: userPosts.length, approved: userPosts.filter(p => p.status === 'approved').length, pending: userPosts.filter(p => p.status === 'pending').length, rejected: userPosts.filter(p => p.status === 'rejected').length, reputation: user.reputation, trustLevel: TRUST_LEVELS.find(tl => tl.level === user.trust_level) };
  const notifications = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20').all(user.id);
  res.render('dashboard', { user, posts: userPosts, stats, notifications });
});

app.get('/c/:slug/rejected', requireAuth, getCommunityBySlug, (req, res) => {
  const community = res.locals.currentCommunity;
  const posts = db.prepare("SELECT p.*, u.username, u.display_name FROM posts p JOIN users u ON p.user_id = u.id WHERE p.user_id = ? AND p.community_id = ? AND p.status IN ('rejected', 'pending') ORDER BY p.created_at DESC").all(req.session.userId, community.id);
  res.render('rejected', { community, posts });
});

// NOTIFICATIONS
app.get('/notifications', requireAuth, (req, res) => {
  const notifications = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').all(req.session.userId);
  res.render('notifications', { notifications });
});
app.post('/notifications/read', requireAuth, (req, res) => { db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.session.userId); res.redirect('/notifications'); });
app.post('/notifications/:id/read', requireAuth, (req, res) => { db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.session.userId); res.redirect('/notifications'); });

// API
app.post('/api/suggestions', requireAuth, (req, res) => {
  const { content, community_id } = req.body;
  if (!content) return res.json({ suggestions: [] });
  const rules = community_id ? db.prepare("SELECT * FROM rules WHERE constitution_id IN (SELECT id FROM constitutions WHERE community_id = ? AND status = 'active')").all(community_id) : [];
  const parsedRules = rules.map(r => ({ ...r, keywords: JSON.parse(r.keywords || '[]') }));
  const result = getPrePublishSuggestions(content, parsedRules);
  res.json(result);
});

app.post('/api/constitution-analyze', requireAuth, (req, res) => {
  const { content } = req.body;
  if (!content || content.trim().length === 0) return res.json({ error: 'No content provided' });
  const analysis = analyzeConstitution(content);
  res.json(analysis);
});

// APPEALS
app.get('/appeals', requireAuth, (req, res) => {
  const appeals = db.prepare('SELECT a.*, p.title as post_title, mc.case_type FROM appeals a JOIN decisions d ON a.decision_id = d.id JOIN moderation_cases mc ON a.case_id = mc.id LEFT JOIN posts p ON mc.post_id = p.id WHERE a.user_id = ? ORDER BY a.created_at DESC').all(req.session.userId);
  res.render('appeals', { appeals });
});
app.post('/appeals', requireAuth, (req, res) => {
  const { case_id, ground, explanation } = req.body;
  if (!case_id || !ground || !explanation) return res.redirect('/appeals');
  const decision = db.prepare('SELECT * FROM decisions WHERE case_id = ? ORDER BY created_at DESC LIMIT 1').get(case_id);
  if (!decision) return res.redirect('/appeals');
  db.prepare('INSERT INTO appeals (case_id, decision_id, user_id, ground, explanation) VALUES (?, ?, ?, ?, ?)').run(case_id, decision.id, req.session.userId, ground, explanation);
  db.prepare("UPDATE moderation_cases SET status = 'appealed' WHERE id = ?").run(case_id);
  res.redirect('/appeals');
});

// HEALTH
app.get('/c/:slug/health', requireAuth, getCommunityBySlug, (req, res) => {
  const community = res.locals.currentCommunity;
  const stats = {
    memberCount: db.prepare('SELECT COUNT(*) as c FROM community_members WHERE community_id = ?').get(community.id).c,
    postCount: db.prepare('SELECT COUNT(*) as c FROM posts WHERE community_id = ?').get(community.id).c,
    pendingCount: db.prepare("SELECT COUNT(*) as c FROM posts WHERE community_id = ? AND status = 'pending'").get(community.id).c,
    approvedCount: db.prepare("SELECT COUNT(*) as c FROM posts WHERE community_id = ? AND status = 'approved'").get(community.id).c,
    rejectedCount: db.prepare("SELECT COUNT(*) as c FROM posts WHERE community_id = ? AND status = 'rejected'").get(community.id).c,
    commentCount: db.prepare('SELECT COUNT(*) as c FROM comments comment INNER JOIN posts p ON comment.post_id = p.id WHERE p.community_id = ?').get(community.id).c,
    totalVotes: db.prepare('SELECT COUNT(*) as c FROM reactions r JOIN posts p ON r.post_id = p.id WHERE p.community_id = ?').get(community.id).c,
  };
  const recentCases = db.prepare('SELECT mc.*, d.decision, d.rationale FROM moderation_cases mc LEFT JOIN decisions d ON mc.id = d.case_id WHERE mc.community_id = ? ORDER BY mc.created_at DESC LIMIT 10').all(community.id);
  const topContributors = db.prepare('SELECT u.id, u.username, u.display_name, u.reputation, u.trust_level, COUNT(p.id) as post_count FROM users u JOIN posts p ON u.id = p.user_id WHERE p.community_id = ? AND p.status = \'approved\' GROUP BY u.id ORDER BY post_count DESC LIMIT 5').all(community.id);
  res.render('health', { community, stats, recentCases, topContributors });
});

// CONSTITUTION
app.get('/c/:slug/constitution', getCommunityBySlug, (req, res) => {
  const community = res.locals.currentCommunity;
  const constitution = db.prepare("SELECT * FROM constitutions WHERE community_id = ? AND status = 'active' ORDER BY version DESC LIMIT 1").get(community.id);
  const rules = constitution ? db.prepare('SELECT * FROM rules WHERE constitution_id = ? ORDER BY rule_number ASC').all(constitution.id) : [];
  const isMember = req.session.userId ? db.prepare('SELECT role FROM community_members WHERE community_id = ? AND user_id = ?').get(community.id, req.session.userId) : null;
  res.render('constitution', { community, constitution, rules, isMember });
});

app.get('/c/:slug/constitution/edit', requireAuth, getCommunityBySlug, (req, res) => {
  const community = res.locals.currentCommunity;
  const isMember = db.prepare('SELECT role FROM community_members WHERE community_id = ? AND user_id = ?').get(community.id, req.session.userId);
  if (!isMember || (isMember.role !== 'owner' && isMember.role !== 'admin')) return res.redirect('/c/' + community.slug + '/constitution');
  const constitution = db.prepare("SELECT * FROM constitutions WHERE community_id = ? AND status = 'active' ORDER BY version DESC LIMIT 1").get(community.id);
  const rules = constitution ? db.prepare('SELECT * FROM rules WHERE constitution_id = ? ORDER BY rule_number ASC').all(constitution.id) : [];
  const constitutionText = rules.map(r => '# ' + r.title + '\n' + r.summary + (r.purpose ? '\nPurpose: ' + r.purpose : '')).join('\n\n');
  res.render('edit-constitution', { community, constitutionText, error: null });
});

app.post('/c/:slug/constitution/edit', requireAuth, getCommunityBySlug, (req, res) => {
  const community = res.locals.currentCommunity;
  const isMember = db.prepare('SELECT role FROM community_members WHERE community_id = ? AND user_id = ?').get(community.id, req.session.userId);
  if (!isMember || (isMember.role !== 'owner' && isMember.role !== 'admin')) return res.redirect('/c/' + community.slug + '/constitution');
  const { content } = req.body;
  if (!content || content.trim().length === 0) return res.render('edit-constitution', { community, constitutionText: '', error: 'Content required.' });
  const oldConst = db.prepare("SELECT * FROM constitutions WHERE community_id = ? AND status = 'active' ORDER BY version DESC LIMIT 1").get(community.id);
  const newVersion = oldConst ? oldConst.version + 1 : 1;
  if (oldConst) db.prepare("UPDATE constitutions SET status = 'superseded' WHERE id = ?").run(oldConst.id);
  const constResult = db.prepare("INSERT INTO constitutions (community_id, version, status, created_by, effective_at) VALUES (?, ?, 'active', ?, datetime('now'))").run(community.id, newVersion, req.session.userId);
  const constId = constResult.lastInsertRowid;
  const sections = content.split(/\n\n+/).filter(s => s.trim());
  let ruleNumber = 1;
  for (const section of sections) {
    const lines = section.trim().split('\n');
    let title = 'Rule ' + ruleNumber;
    let summary = lines.join(' ').trim();
    if (lines[0].startsWith('#')) { title = lines[0].replace(/^#+\s*/, '').trim(); summary = lines.slice(1).join(' ').trim(); }
    if (summary) { db.prepare('INSERT INTO rules (constitution_id, rule_number, title, summary, keywords) VALUES (?, ?, ?, ?, ?)').run(constId, ruleNumber, title, summary, '[]'); ruleNumber++; }
  }
  res.redirect('/c/' + community.slug + '/constitution');
});

// PROPOSALS
app.get('/c/:slug/proposals', requireAuth, getCommunityBySlug, (req, res) => {
  const community = res.locals.currentCommunity;
  const proposals = db.prepare('SELECT p.*, u.username, u.display_name FROM proposals p JOIN users u ON p.proposer_id = u.id WHERE p.community_id = ? ORDER BY p.created_at DESC').all(community.id);
  res.render('proposals', { community, proposals });
});
app.get('/c/:slug/proposals/new', requireAuth, getCommunityBySlug, (req, res) => res.render('create-proposal', { community: res.locals.currentCommunity, error: null }));

app.get('/c/:slug/proposals/:id', requireAuth, getCommunityBySlug, (req, res) => {
  const community = res.locals.currentCommunity;
  const proposal = db.prepare('SELECT p.*, u.username, u.display_name FROM proposals p JOIN users u ON p.proposer_id = u.id WHERE p.id = ? AND p.community_id = ?').get(req.params.id, community.id);
  if (!proposal) return res.redirect('/c/' + community.slug + '/proposals');
  const proposer = db.prepare('SELECT username, display_name FROM users WHERE id = ?').get(proposal.proposer_id);
  const supportCount = db.prepare("SELECT COUNT(*) as c FROM proposal_votes WHERE proposal_id = ? AND vote = 'support'").get(proposal.id).c;
  const opposeCount = db.prepare("SELECT COUNT(*) as c FROM proposal_votes WHERE proposal_id = ? AND vote = 'oppose'").get(proposal.id).c;
  const abstainCount = db.prepare("SELECT COUNT(*) as c FROM proposal_votes WHERE proposal_id = ? AND vote = 'abstain'").get(proposal.id).c;
  res.render('proposal-detail', { community, proposal, proposer, supportCount, opposeCount, abstainCount });
});

app.post('/c/:slug/proposals/new', requireAuth, getCommunityBySlug, (req, res) => {
  const community = res.locals.currentCommunity;
  const { title, description, proposed_text, motivation, vote_threshold } = req.body;
  if (!title || !proposed_text) return res.render('create-proposal', { community, error: 'Title and proposed text required.' });
  db.prepare('INSERT INTO proposals (community_id, proposer_id, title, description, proposed_text, motivation, vote_threshold, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(community.id, req.session.userId, title, description || '', proposed_text, motivation || '', vote_threshold || 5, 'open');
  res.redirect('/c/' + community.slug + '/proposals');
});

app.post('/c/:slug/proposals/:id/vote', requireAuth, getCommunityBySlug, (req, res) => {
  const community = res.locals.currentCommunity;
  const { vote } = req.body;
  if (!vote) return res.redirect('/c/' + community.slug + '/proposals');
  const proposal = db.prepare('SELECT * FROM proposals WHERE id = ? AND community_id = ?').get(req.params.id, community.id);
  if (!proposal) return res.redirect('/c/' + community.slug + '/proposals');
  db.prepare('INSERT OR REPLACE INTO proposal_votes (proposal_id, user_id, vote) VALUES (?, ?, ?)').run(proposal.id, req.session.userId, vote);
  res.redirect('/c/' + community.slug + '/proposals/' + proposal.id);
});

// PROFILE & SETTINGS
app.get('/u/:username', optionalAuth, (req, res) => {
  const profileUser = db.prepare('SELECT id, username, display_name, bio, avatar_url, reputation, trust_level, joined_at FROM users WHERE username = ?').get(req.params.username);
  if (!profileUser) return res.status(404).render('error', { title: 'User Not Found', message: 'This user does not exist.' });
  const posts = db.prepare("SELECT p.*, c.name as community_name, c.slug as community_slug FROM posts p JOIN communities c ON p.community_id = c.id WHERE p.user_id = ? AND p.status = 'approved' ORDER BY p.created_at DESC LIMIT 20").all(profileUser.id);
  const trustLevel = TRUST_LEVELS.find(tl => tl.level === profileUser.trust_level);
  res.render('profile', { profileUser, posts, trustLevel });
});

app.get('/settings', requireAuth, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.userId);
  res.render('settings', { user, error: null });
});
app.post('/settings', requireAuth, (req, res) => {
  const { display_name, bio } = req.body;
  db.prepare('UPDATE users SET display_name = ?, bio = ? WHERE id = ?').run(display_name || '', bio || '', req.session.userId);
  res.redirect('/settings');
});

// SEARCH
app.get('/search', optionalAuth, (req, res) => {
  const q = req.query.q || '';
  if (!q.trim()) return res.render('search', { query: '', results: [] });
  const results = db.prepare("SELECT p.*, u.username, u.display_name, c.name as community_name, c.slug as community_slug FROM posts p JOIN users u ON p.user_id = u.id JOIN communities c ON p.community_id = c.id WHERE p.status = 'approved' AND (p.title LIKE ? OR p.content LIKE ?) ORDER BY p.created_at DESC LIMIT 30").all('%' + q + '%', '%' + q + '%');
  res.render('search', { query: q, results });
});

// ERRORS
app.use((req, res) => { res.status(404).render('error', { title: 'Page Not Found', message: 'Not found.' }); });
app.use((err, req, res, next) => { console.error('ERROR:', err.message); res.status(500).render('error', { title: 'Server Error', message: err.message || 'Error.' }); });

// START
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
if (userCount === 0) require('./seed')();
if (require.main === module) {
  app.listen(PORT, () => console.log('Civitas running at http://localhost:' + PORT));
}
module.exports = app;
