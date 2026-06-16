const TRUST_LEVELS = [
  { level: 0, name: 'Newcomer', minScore: 0, description: 'New to the community', permissions: ['post', 'comment', 'react', 'report'] },
  { level: 1, name: 'Contributor', minScore: 10, description: 'Regular contributor', permissions: ['post', 'comment', 'react', 'report', 'bookmark', 'follow'] },
  { level: 2, name: 'Trusted Member', minScore: 50, description: 'Trusted community member', permissions: ['post', 'comment', 'react', 'report', 'bookmark', 'follow', 'create_tags'] },
  { level: 3, name: 'Established', minScore: 150, description: 'Established community member', permissions: ['post', 'comment', 'react', 'report', 'bookmark', 'follow', 'create_tags', 'nominate_reviewer'] },
  { level: 4, name: 'Guardian', minScore: 400, description: 'Community guardian', permissions: ['post', 'comment', 'react', 'report', 'bookmark', 'follow', 'create_tags', 'nominate_reviewer', 'review_content'] },
  { level: 5, name: 'Elder', minScore: 1000, description: 'Community elder', permissions: ['*'] },
];

const REPUTATION_DIMENSIONS = {
  helpfulness: { weight: 1.0, label: 'Helpfulness', description: 'How helpful your contributions are' },
  thoughtfulness: { weight: 1.0, label: 'Thoughtfulness', description: 'How thoughtful your contributions are' },
  reliability: { weight: 0.8, label: 'Reliability', description: 'How reliable your information is' },
  respectfulness: { weight: 1.0, label: 'Respectfulness', description: 'How respectful your interactions are' },
  participation: { weight: 0.5, label: 'Participation', description: 'How active you are in the community' },
  expertise: { weight: 0.7, label: 'Expertise', description: 'Your demonstrated expertise' },
};

const DIMENSION_RULES = {
  helpfulness: [
    { condition: 'post_approved', delta: 2 },
    { condition: 'post_reacted_helpful', delta: 3 },
    { condition: 'post_reacted_insightful', delta: 2 },
    { condition: 'post_reacted_well_explained', delta: 3 },
  ],
  thoughtfulness: [
    { condition: 'post_approved', delta: 1 },
    { condition: 'post_reacted_insightful', delta: 2 },
    { condition: 'comment_approved', delta: 1 },
  ],
  reliability: [
    { condition: 'post_approved', delta: 1 },
    { condition: 'post_rejected', delta: -3 },
    { condition: 'repeated_violation', delta: -10 },
  ],
  respectfulness: [
    { condition: 'post_approved', delta: 1 },
    { condition: 'comment_approved', delta: 1 },
    { condition: 'post_rejected', delta: -2 },
    { condition: 'warning_received', delta: -5 },
    { condition: 'successful_appeal', delta: 5 },
  ],
  participation: [
    { condition: 'post_approved', delta: 1 },
    { condition: 'comment_approved', delta: 0.5 },
    { condition: 'react_given', delta: 0.1 },
    { condition: 'daily_login', delta: 0.2 },
  ],
  expertise: [
    { condition: 'post_approved', delta: 1 },
    { condition: 'post_reacted_well_explained', delta: 2 },
    { condition: 'reliable_source_cited', delta: 1 },
  ],
};

function calculateTotalScore(dimensions) {
  let total = 0;
  for (const [key, value] of Object.entries(dimensions)) {
    const dimConfig = REPUTATION_DIMENSIONS[key];
    if (dimConfig) {
      total += value * dimConfig.weight;
    }
  }
  return total;
}

function getTrustLevel(score) {
  let level = TRUST_LEVELS[0];
  for (const tl of TRUST_LEVELS) {
    if (score >= tl.minScore) level = tl;
  }
  return level;
}

function getPermissions(trustLevel) {
  const level = TRUST_LEVELS.find(tl => tl.level === trustLevel);
  return level ? level.permissions : ['*'];
}

function hasPermission(trustLevel, permission) {
  const perms = getPermissions(trustLevel);
  return perms.includes('*') || perms.includes(permission);
}

function calculateModeratorReliability(votesCorrect, votesTotal) {
  if (votesTotal === 0) return 0.5;
  const ratio = votesCorrect / votesTotal;
  const confidence = Math.min(votesTotal / 20, 1);
  return 0.5 + (ratio - 0.5) * confidence;
}

function calculateReviewerScore(caseResult, reviewerScore, communityAverageScore) {
  const agreement = caseResult.communityAgrees ? 1 : 0;
  const consistency = caseResult.consistentWithHistory ? 1 : 0;
  const confidence = caseResult.isConfident ? 1 : 0;

  const weights = { agreement: 0.4, consistency: 0.3, consistency: 0.3, confidence: 0.3 };

  const rawScore = agreement * weights.agreement + consistency * weights.consistency + confidence * weights.confidence;

  return rawScore * 100;
}

function updateReputation(db, userId, action) {
  const rules = DIMENSION_RULES[action.dimension] || [];
  const rule = rules.find(r => r.condition === action.condition);
  if (!rule) return null;

  const delta = rule.delta;

  const dimension = db.prepare('SELECT * FROM user_reputation_dimensions WHERE user_id = ? AND dimension = ?').get(userId, action.dimension);

  let newScore;
  if (dimension) {
    newScore = Math.max(0, dimension.score + delta);
    db.prepare('UPDATE user_reputation_dimensions SET score = ?, updated_at = datetime(?) WHERE user_id = ? AND dimension = ?').run(newScore, new Date().toISOString(), userId, action.dimension);
  } else {
    newScore = Math.max(0, delta);
    db.prepare('INSERT INTO user_reputation_dimensions (user_id, dimension, score) VALUES (?, ?, ?)').run(userId, action.dimension, newScore);
  }

  const allDimensions = db.prepare('SELECT dimension, score FROM user_reputation_dimensions WHERE user_id = ?').all(userId);
  const dimensions = {};
  for (const d of allDimensions) {
    dimensions[d.dimension] = d.score;
  }
  const totalScore = calculateTotalScore(dimensions);
  const trustLevel = getTrustLevel(totalScore);

  db.prepare('UPDATE users SET reputation = ?, trust_level = ? WHERE id = ?').run(totalScore, trustLevel.level, userId);

  return { dimension: action.dimension, delta, newScore, totalScore, trustLevel: trustLevel.level };
}

module.exports = { TRUST_LEVELS, REPUTATION_DIMENSIONS, calculateTotalScore, getTrustLevel, getPermissions, hasPermission, calculateModeratorReliability, calculateReviewerScore, updateReputation };
