const TOXIC_PATTERNS = [
  { pattern: /\b(fuck|shit|damn|ass|bitch|crap|dick|piss|slut|whore)\b/gi, weight: 0.3, label: 'profanity', category: 'language' },
  { pattern: /\b(kill\s+(you|yourself|everyone)|die|murder|suicide|hang\s+yourself)\b/gi, weight: 0.8, label: 'threat', category: 'safety' },
  { pattern: /\b(stupid|idiot|dumbass|retard|moron|imbecile|cunt)\b/gi, weight: 0.5, label: 'insult', category: 'harassment' },
  { pattern: /\b(nigger|faggot|kike|spic|chink|gook|tranny|raghead)\b/gi, weight: 0.9, label: 'hate_speech', category: 'safety' },
  { pattern: /(.)\1{5,}/g, weight: 0.2, label: 'spam_chars', category: 'spam' },
  { pattern: /(https?:\/\/[^\s]+){3,}/gi, weight: 0.5, label: 'link_spam', category: 'spam' },
  { pattern: /\b(buy|click|subscribe|follow|check\s+out)\s+(now|here|my|our)\b/gi, weight: 0.3, label: 'self_promo', category: 'spam' },
];

const POSITIVE_PATTERNS = [
  { pattern: /\b(great|awesome|amazing|love|wonderful|fantastic|excellent|beautiful|perfect)\b/gi, weight: 0.15, label: 'praise' },
  { pattern: /\b(thank|thanks|grateful|appreciate)\b/gi, weight: 0.2, label: 'gratitude' },
  { pattern: /\b(agree|support|absolutely|well\s+said|good\s+point)\b/gi, weight: 0.1, label: 'agreement' },
];

function countMatches(text, pattern) {
  const regex = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g');
  const matches = text.match(regex);
  return matches ? matches.length : 0;
}

function scoreToxicity(text) {
  if (!text || text.trim().length === 0) return { score: 0, maxIndividual: 0, reasons: [], isToxic: false, isBorderline: false };

  let toxicityScore = 0;
  let reasons = [];
  let maxScore = 0;

  for (const rule of TOXIC_PATTERNS) {
    const count = countMatches(text, rule.pattern);
    if (count > 0) {
      const score = Math.min(rule.weight * count, 1);
      toxicityScore += score;
      maxScore = Math.max(maxScore, score);
      reasons.push({ rule: rule.label, category: rule.category, score, count });
    }
  }

  for (const rule of POSITIVE_PATTERNS) {
    const count = countMatches(text, rule.pattern);
    if (count > 0) {
      toxicityScore -= rule.weight * Math.min(count, 3);
      reasons.push({ rule: rule.label, bonus: rule.weight * count });
    }
  }

  toxicityScore = Math.max(-1, Math.min(1, toxicityScore));

  return {
    score: toxicityScore,
    maxIndividual: maxScore,
    reasons,
    isToxic: toxicityScore > 0.4,
    isBorderline: toxicityScore > 0.15 && toxicityScore <= 0.4,
  };
}

function evaluateAgainstConstitution(text, rules) {
  if (!rules || rules.length === 0) return { violations: [], score: 0 };

  const violations = [];

  for (const rule of rules) {
    const keywords = rule.keywords || [];
    if (keywords.length === 0) continue;

    const pattern = new RegExp(keywords.join('|'), 'gi');
    const count = countMatches(text, pattern);
    if (count > 0) {
      violations.push({
        ruleId: rule.id,
        ruleTitle: rule.title,
        ruleSummary: rule.summary,
        severity: rule.severity || 'standard',
        count,
      });
    }
  }

  const severityWeights = { critical: 0.8, standard: 0.5, minor: 0.2 };
  const score = violations.reduce((sum, v) => sum + (severityWeights[v.severity] || 0.5), 0) / Math.max(violations.length, 1);
  return { violations, score };
}

function moderate(content, rules = [], options = {}) {
  const toxicity = scoreToxicity(content);
  const constitutional = evaluateAgainstConstitution(content, rules);

  let finalScore = toxicity.score + constitutional.score * 0.5;
  finalScore = Math.max(-1, Math.min(1, finalScore));

  let status;
  if (finalScore < -0.2) {
    status = 'approved';
  } else if (finalScore > 0.6 || toxicity.maxIndividual > 0.7) {
    status = 'rejected';
  } else if (finalScore > 0.2) {
    status = 'borderline';
  } else {
    status = 'approved';
  }

  const explanation = buildExplanation(status, toxicity, constitutional);

  return {
    status,
    score: finalScore,
    toxicity,
    constitutional,
    explanation,
    details: {
      toxicityScore: finalScore,
      isToxic: toxicity.isToxic,
      isBorderline: toxicity.isBorderline,
      reasons: toxicity.reasons,
      constitutionalViolations: constitutional.violations,
    },
  };
}

function buildExplanation(status, toxicity, constitutional) {
  const parts = [];

  if (status === 'approved') {
    parts.push('This content appears to follow community guidelines.');
  } else if (status === 'rejected') {
    parts.push('This content was held because it may violate community rules.');
  } else if (status === 'borderline') {
    parts.push('This content needs review because it may contain issues that require human judgment.');
  }

  for (const reason of toxicity.reasons) {
    if (reason.rule === 'profanity') parts.push('The system detected potentially inappropriate language.');
    if (reason.rule === 'threat') parts.push('The system detected language that may constitute a threat.');
    if (reason.rule === 'insult') parts.push('The system detected language that may be insulting.');
    if (reason.rule === 'hate_speech') parts.push('The system detected language that may be discriminatory.');
    if (reason.rule === 'spam') parts.push('The system detected patterns associated with spam.');
  }

  for (const violation of constitutional.violations) {
    parts.push(`This content may conflict with "${violation.ruleTitle}".`);
  }

  if (parts.length === 0) {
    parts.push('The system is uncertain about this content.');
  }

  return parts.join(' ');
}

function getPrePublishSuggestions(content, rules = []) {
  const suggestions = [];
  const toxicity = scoreToxicity(content);
  const constitutional = evaluateAgainstConstitution(content, rules);

  for (const reason of toxicity.reasons) {
    if (reason.rule === 'profanity') {
      suggestions.push({ type: 'warning', message: 'This may contain language some members find inappropriate.', rule: 'Language standards' });
    }
    if (reason.rule === 'threat') {
      suggestions.push({ type: 'error', message: 'This may contain threatening language.', rule: 'Safety' });
    }
    if (reason.rule === 'insult') {
      suggestions.push({ type: 'warning', message: 'This may be interpreted as a personal attack.', rule: 'Respect' });
    }
    if (reason.rule === 'spam') {
      suggestions.push({ type: 'warning', message: 'This may be perceived as promotional content.', rule: 'Self-promotion' });
    }
  }

  const ruleWarnings = [];
  for (const violation of constitutional.violations) {
    suggestions.push({ type: 'warning', message: `This may conflict with "${violation.ruleTitle}".`, rule: violation.ruleTitle });
    ruleWarnings.push(`Potential conflict with "${violation.ruleTitle}" (severity: ${violation.severity})`);
  }

  if (content.length > 5000) {
    suggestions.push({ type: 'info', message: 'Long posts may be harder for members to read. Consider breaking it up.', rule: 'Readability' });
  }

  const capsRatio = (content.replace(/[^A-Z]/g, '').length) / (content.replace(/[^a-zA-Z]/g, '').length || 1);
  if (capsRatio > 0.5 && content.length > 10) {
    suggestions.push({ type: 'info', message: 'Excessive capitalization may be perceived as shouting.', rule: 'Tone' });
  }

  let rewrite = null;
  if (constitutional.violations.length > 0 || toxicity.isToxic) {
    let rewritten = content;
    if (capsRatio > 0.5 && content.length > 10) {
      rewritten = rewritten.charAt(0).toUpperCase() + rewritten.slice(1).toLowerCase();
    }
    for (const violation of constitutional.violations) {
      const firstSentence = rewritten.split(/[.!?]/)[0];
      if (firstSentence && firstSentence.toLowerCase().includes('stupid')) {
        rewritten = 'I understand this might be a sensitive topic. ' + rewritten;
        break;
      }
    }
    if (rewritten !== content) {
      rewrite = rewritten.substring(0, 300) + (rewritten.length > 300 ? '...' : '');
    }
  }

  if (content && content.trim().length < 20) {
    suggestions.push({ type: 'info', message: 'Consider adding more detail to help the community understand your perspective.', rule: 'Quality' });
  }

  return { suggestions, rewrite, ruleWarnings };
}

function analyzeConstitution(text) {
  const rules = text.split(/(?=#)/).map(s => s.trim()).filter(s => s.length > 0);
  const dimensions = [];
  const warnings = [];
  const suggestions = [];
  let totalScore = 0;

  const clarityIssues = [];
  const fairnessIssues = [];
  const enforceabilityIssues = [];

  for (const rule of rules) {
    const titleMatch = rule.match(/^#+\s*(.+)/m);
    const title = titleMatch ? titleMatch[1] : 'Untitled';
    const body = rule.replace(/^#+\s*.+/m, '').trim();

    if (!body || body.length < 10) {
      clarityIssues.push(`"${title}" lacks a clear description`);
    }

    if (body.length > 0 && body.length < 30) {
      clarityIssues.push(`"${title}" is very brief — consider adding more detail`);
    }

    const hasPurpose = /purpose/i.test(rule);
    if (!hasPurpose) {
      suggestions.push(`"${title}" could include a purpose statement explaining why this rule exists`);
    }

    const hasExamples = /example|e\.g\.|such as|for instance/i.test(rule);
    if (!hasExamples) {
      suggestions.push(`"${title}" could include examples of what is and is not allowed`);
    }

    const hasExceptions = /except|unless|however|but|exception/i.test(rule);
    if (!hasExceptions) {
      suggestions.push(`"${title}" could specify exceptions or edge cases`);
    }

    if (/everyone|all|every|always/i.test(body) && /reasonable|unless|except/i.test(body) === false) {
      fairnessIssues.push(`"${title}" uses absolute language ("always", "everyone") that may be hard to apply fairly`);
    }

    if (/vague|subjective|unclear|ambiguous/i.test(body)) {
      clarityIssues.push(`"${title}" uses self-referential vague language`);
    }

    if (body.length < 50) {
      enforceabilityIssues.push(`"${title}" may be hard to enforce — it is too brief to determine violations`);
    }
  }

  const clarity = clarityIssues.length === 0 ? 'Good' : clarityIssues.length <= 2 ? 'Needs improvement' : 'Needs work';
  const fairness = fairnessIssues.length === 0 ? 'Good' : fairnessIssues.length <= 1 ? 'Needs improvement' : 'Needs work';
  const enforceability = enforceabilityIssues.length === 0 ? 'Good' : enforceabilityIssues.length <= 2 ? 'Needs improvement' : 'Needs work';

  dimensions.push({ name: 'Clarity', score: clarity, reason: clarityIssues.length > 0 ? clarityIssues.slice(0, 3).join('; ') : 'Rules are clearly written and easy to understand.' });
  dimensions.push({ name: 'Fairness', score: fairness, reason: fairnessIssues.length > 0 ? fairnessIssues.slice(0, 3).join('; ') : 'Rules appear fair and equally applicable.' });
  dimensions.push({ name: 'Enforceability', score: enforceability, reason: enforceabilityIssues.length > 0 ? enforceabilityIssues.slice(0, 3).join('; ') : 'Rules have clear criteria for determining violations.' });

  const allIssues = clarityIssues.length + fairnessIssues.length + enforceabilityIssues.length;
  let overall;
  if (allIssues === 0) { overall = 'Excellent'; totalScore = 5; }
  else if (allIssues <= 2) { overall = 'Good'; totalScore = 4; }
  else if (allIssues <= 5) { overall = 'Needs improvement'; totalScore = 3; }
  else if (allIssues <= 8) { overall = 'Needs work'; totalScore = 2; }
  else { overall = 'Significant issues'; totalScore = 1; }

  if (clarityIssues.length > 0) warnings.push(...clarityIssues);
  if (fairnessIssues.length > 0) warnings.push(...fairnessIssues);
  if (enforceabilityIssues.length > 0) warnings.push(...enforceabilityIssues);

  const contradictions = [];
  const titles = rules.map(r => { const m = r.match(/^#+\s*(.+)/m); return m ? m[1].toLowerCase() : ''; });
  for (let i = 0; i < titles.length; i++) {
    for (let j = i + 1; j < titles.length; j++) {
      if (titles[i] && titles[j] && titles[i] === titles[j]) {
        contradictions.push(`Rule ${i + 1} and rule ${j + 1} appear to have the same title ("${titles[i]}")`);
      }
    }
  }
  if (contradictions.length > 0) warnings.push(...contradictions);

  return {
    overall,
    dimensions,
    warnings,
    suggestions,
    ruleCount: rules.length,
    score: totalScore,
  };
}

module.exports = { moderate, scoreToxicity, evaluateAgainstConstitution, getPrePublishSuggestions, analyzeConstitution };
