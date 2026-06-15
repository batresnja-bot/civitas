const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data.db');

function initDB() {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT DEFAULT '',
      bio TEXT DEFAULT '',
      avatar_url TEXT DEFAULT '',
      email_verified INTEGER DEFAULT 0,
      email_verification_token TEXT,
      reputation REAL DEFAULT 0,
      trust_level INTEGER DEFAULT 0,
      joined_at TEXT DEFAULT (datetime('now')),
      last_active_at TEXT DEFAULT (datetime('now')),
      is_suspended INTEGER DEFAULT 0,
      suspension_reason TEXT,
      suspension_expires_at TEXT,
      mod_votes_correct INTEGER DEFAULT 0,
      mod_votes_total INTEGER DEFAULT 0,
      settings TEXT DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS communities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT DEFAULT '',
      purpose TEXT DEFAULT '',
      visibility TEXT DEFAULT 'public',
      template TEXT DEFAULT 'custom',
      created_by INTEGER REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      settings TEXT DEFAULT '{}',
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS community_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      community_id INTEGER REFERENCES communities(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      role TEXT DEFAULT 'member',
      joined_at TEXT DEFAULT (datetime('now')),
      is_muted INTEGER DEFAULT 0,
      mute_expires_at TEXT,
      UNIQUE(community_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS constitutions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      community_id INTEGER REFERENCES communities(id) ON DELETE CASCADE,
      version INTEGER DEFAULT 1,
      status TEXT DEFAULT 'active',
      content TEXT DEFAULT '{}',
      created_by INTEGER REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now')),
      effective_at TEXT,
      superseded_at TEXT
    );

    CREATE TABLE IF NOT EXISTS rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      constitution_id INTEGER REFERENCES constitutions(id) ON DELETE CASCADE,
      rule_number INTEGER NOT NULL,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      purpose TEXT DEFAULT '',
      full_text TEXT DEFAULT '',
      positive_examples TEXT DEFAULT '[]',
      negative_examples TEXT DEFAULT '[]',
      exceptions TEXT DEFAULT '[]',
      keywords TEXT DEFAULT '[]',
      severity TEXT DEFAULT 'standard',
      default_response TEXT DEFAULT 'warning',
      appeal_available INTEGER DEFAULT 1,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      community_id INTEGER REFERENCES communities(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      parent_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
      post_type TEXT DEFAULT 'text',
      title TEXT DEFAULT '',
      content TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      ai_score REAL DEFAULT 0,
      ai_details TEXT DEFAULT '{}',
      is_pinned INTEGER DEFAULT 0,
      is_locked INTEGER DEFAULT 0,
      edited_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      status TEXT DEFAULT 'approved',
      ai_score REAL DEFAULT 0,
      ai_details TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now')),
      edited_at TEXT
    );

    CREATE TABLE IF NOT EXISTS reactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
      comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      reaction_type TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(post_id, user_id, reaction_type)
    );

    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      community_id INTEGER REFERENCES communities(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      post_count INTEGER DEFAULT 0,
      UNIQUE(community_id, name)
    );

    CREATE TABLE IF NOT EXISTS post_tags (
      post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
      tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (post_id, tag_id)
    );

    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reporter_id INTEGER REFERENCES users(id),
      post_id INTEGER REFERENCES posts(id) ON DELETE SET NULL,
      comment_id INTEGER REFERENCES comments(id) ON DELETE SET NULL,
      reason TEXT NOT NULL,
      details TEXT DEFAULT '',
      status TEXT DEFAULT 'pending',
      reviewed_by INTEGER REFERENCES users(id),
      reviewed_at TEXT,
      resolution TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS moderation_cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER REFERENCES posts(id) ON DELETE SET NULL,
      comment_id INTEGER REFERENCES comments(id) ON DELETE SET NULL,
      community_id INTEGER REFERENCES communities(id),
      case_type TEXT DEFAULT 'content',
      status TEXT DEFAULT 'open',
      priority TEXT DEFAULT 'normal',
      ai_assessment TEXT DEFAULT '{}',
      assigned_reviewer_id INTEGER REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now')),
      decided_at TEXT,
      closed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS decisions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER REFERENCES moderation_cases(id) ON DELETE CASCADE,
      decision TEXT NOT NULL,
      rationale TEXT DEFAULT '',
      rule_id INTEGER REFERENCES rules(id),
      decided_by INTEGER REFERENCES users(id),
      is_appeal INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS appeals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER REFERENCES moderation_cases(id) ON DELETE CASCADE,
      decision_id INTEGER REFERENCES decisions(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id),
      ground TEXT NOT NULL,
      explanation TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      reviewed_by INTEGER REFERENCES users(id),
      reviewed_at TEXT,
      resolution TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS proposals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      community_id INTEGER REFERENCES communities(id) ON DELETE CASCADE,
      proposer_id INTEGER REFERENCES users(id),
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      current_text TEXT DEFAULT '',
      proposed_text TEXT NOT NULL,
      motivation TEXT DEFAULT '',
      expected_benefits TEXT DEFAULT '',
      possible_harms TEXT DEFAULT '',
      affected_groups TEXT DEFAULT '',
      status TEXT DEFAULT 'draft',
      vote_threshold INTEGER DEFAULT 5,
      created_at TEXT DEFAULT (datetime('now')),
      voting_ends_at TEXT
    );

    CREATE TABLE IF NOT EXISTS proposal_votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      proposal_id INTEGER REFERENCES proposals(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id),
      vote TEXT NOT NULL,
      rationale TEXT DEFAULT '',
      weight REAL DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(proposal_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      notification_type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      link TEXT DEFAULT '',
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor_id INTEGER REFERENCES users(id),
      actor_type TEXT DEFAULT 'user',
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id INTEGER,
      community_id INTEGER,
      details TEXT DEFAULT '{}',
      ip_address TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS feature_flags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      flag_name TEXT UNIQUE NOT NULL,
      is_enabled INTEGER DEFAULT 0,
      description TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS bookmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, post_id)
    );

    CREATE INDEX IF NOT EXISTS idx_posts_community ON posts(community_id);
    CREATE INDEX IF NOT EXISTS idx_posts_user ON posts(user_id);
    CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
    CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON audit_log(actor_id);
    CREATE INDEX IF NOT EXISTS idx_community_members_user ON community_members(user_id);
    CREATE INDEX IF NOT EXISTS idx_community_members_community ON community_members(community_id);
  `);

  return db;
}

const db = initDB();

module.exports = db;
