/**
 * matchEngine.js
 * ──────────────
 * Pure matching logic — no Express, no HTTP, no DB calls.
 * Receives customer objects, returns ranked matches.
 *
 * Two phases:
 *   1. Hard Filters  — eliminates incompatible candidates (binary pass/fail)
 *   2. Scorer        — awards 0-100 points across 7 dimensions
 */

// ── Age Helper ─────────────────────────────────────────────────────────────────

function getAge(dob) {
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

// ── Education Rank Map ─────────────────────────────────────────────────────────
// Used to compare education levels numerically (higher = more qualified)

const EDU_RANK = {
  'Below 10th': 0, '10th': 1, '12th': 2, 'Diploma': 3,
  'B.Sc': 4, 'B.Com': 4, 'BBA': 4, 'B.Arch': 4, 'LLB': 4,
  'B.Tech': 5, 'B.E.': 5, 'MBBS': 6,
  'M.Sc': 6, 'M.Tech': 6, 'MBA': 7, 'CA': 7, 'Ph.D': 8,
};

// ── PHASE 1: Hard Filters ──────────────────────────────────────────────────────
// Returns { passed: boolean, reason: string }
// If any filter fails, the candidate is removed from scoring entirely.

function hardFilter(customer, candidate) {
  const custAge = getAge(customer.date_of_birth);
  const candAge = getAge(candidate.date_of_birth);

  // 1. Must be opposite gender
  if (customer.gender === candidate.gender) {
    return { passed: false, reason: 'Same gender' };
  }

  // 2. Candidate's age must fall within customer's preferred range
  if (customer.pref_age_min && candAge < customer.pref_age_min) {
    return { passed: false, reason: 'Candidate too young for customer preference' };
  }
  if (customer.pref_age_max && candAge > customer.pref_age_max) {
    return { passed: false, reason: 'Candidate too old for customer preference' };
  }

  // 3. Customer's age must fall within candidate's preferred range (mutual)
  if (candidate.pref_age_min && custAge < candidate.pref_age_min) {
    return { passed: false, reason: 'Customer too young for candidate preference' };
  }
  if (candidate.pref_age_max && custAge > candidate.pref_age_max) {
    return { passed: false, reason: 'Customer too old for candidate preference' };
  }

  // 4. Religion preference — only filter if the customer has a preference set
  if (customer.pref_religion && customer.pref_religion.length > 0) {
    if (!customer.pref_religion.includes(candidate.religion)) {
      return { passed: false, reason: 'Religion mismatch' };
    }
  }

  // 5. Caste preference — only filter if set
  if (customer.pref_caste && customer.pref_caste.length > 0) {
    if (!customer.pref_caste.includes(candidate.caste)) {
      return { passed: false, reason: 'Caste mismatch' };
    }
  }

  // 6. Want kids — hard mismatch if one is Yes and other is No
  const kidsMismatch =
    (customer.want_kids === 'Yes' && candidate.want_kids === 'No') ||
    (customer.want_kids === 'No'  && candidate.want_kids === 'Yes');
  if (kidsMismatch) {
    return { passed: false, reason: 'Children preference mismatch' };
  }

  // 7. Diet — Jain / Vegetarian vs Non-Vegetarian is a common dealbreaker in India
  const strictVeg = ['Vegetarian', 'Jain'];
  if (strictVeg.includes(customer.diet) && candidate.diet === 'Non-Vegetarian') {
    return { passed: false, reason: 'Diet incompatibility' };
  }

  return { passed: true };
}

// ── PHASE 2: Compatibility Scorer ─────────────────────────────────────────────
// Returns { score: number (0-100), breakdown: object }

function scoreMatch(customer, candidate) {
  const breakdown = {
    children_preference: 0,   // max 25
    family_values:       0,   // max 15
    education:           0,   // max 15
    languages:           0,   // max 15
    income:              0,   // max 10
    location:            0,   // max 10
    lifestyle:           0,   // max 10
  };

  // ── Children Preference (25 pts) ─────────────────────────────
  const kc = customer.want_kids;
  const kd = candidate.want_kids;
  if (kc === kd)                                  breakdown.children_preference = 25;
  else if (kc === 'Open' || kd === 'Open')        breakdown.children_preference = 15;
  else if (kc === 'Already Has' || kd === 'Already Has') breakdown.children_preference = 10;

  // ── Family Values (15 pts) ────────────────────────────────────
  const VALUES_ORDER = ['Traditional', 'Moderate', 'Liberal'];
  const vi = VALUES_ORDER.indexOf(customer.family_values);
  const vj = VALUES_ORDER.indexOf(candidate.family_values);
  const valueDiff = Math.abs(vi - vj);
  if (valueDiff === 0)      breakdown.family_values = 15;
  else if (valueDiff === 1) breakdown.family_values = 8;
  // diff of 2 = 0 points (Traditional vs Liberal)

  // ── Education (15 pts) ────────────────────────────────────────
  const ei = EDU_RANK[customer.education] ?? 4;
  const ej = EDU_RANK[candidate.education] ?? 4;
  const eduDiff = Math.abs(ei - ej);
  if (eduDiff === 0)      breakdown.education = 15;
  else if (eduDiff === 1) breakdown.education = 10;
  else if (eduDiff === 2) breakdown.education = 5;

  // ── Languages (15 pts) ────────────────────────────────────────
  // Points proportional to how many languages they share
  const custLangs = customer.languages || [];
  const candLangs = candidate.languages || [];
  const shared = custLangs.filter(l => candLangs.includes(l)).length;
  const maxPossible = Math.min(Math.max(custLangs.length, candLangs.length), 3);
  if (maxPossible > 0) {
    breakdown.languages = Math.round((shared / maxPossible) * 15);
  }

  // ── Income Compatibility (10 pts) ─────────────────────────────
  const inc1 = customer.annual_income || 0;
  const inc2 = candidate.annual_income || 0;
  if (inc1 > 0 && inc2 > 0) {
    const ratio = Math.max(inc1, inc2) / Math.min(inc1, inc2);
    if (ratio <= 1.5)      breakdown.income = 10;
    else if (ratio <= 2.5) breakdown.income = 5;
    else if (ratio <= 4)   breakdown.income = 2;
  }

  // ── Location (10 pts) ─────────────────────────────────────────
  if (customer.city === candidate.city) {
    breakdown.location = 10;
  } else if (customer.state === candidate.state) {
    breakdown.location = 6;
  } else if (customer.open_to_relocate || candidate.open_to_relocate) {
    breakdown.location = 4; // at least one is willing to move
  }

  // ── Lifestyle (10 pts) ────────────────────────────────────────
  // Diet (4 pts) — award points for compatible diets
  const DIET_COMPAT = {
    Jain: ['Jain', 'Vegetarian'],
    Vegetarian: ['Jain', 'Vegetarian'],
    Eggetarian: ['Eggetarian', 'Vegetarian'],
    'Non-Vegetarian': ['Non-Vegetarian', 'Eggetarian'],
    Vegan: ['Vegan', 'Vegetarian'],
  };
  const dietCompat = DIET_COMPAT[customer.diet] || [];
  if (dietCompat.includes(candidate.diet)) breakdown.lifestyle += 4;

  // Smoking (3 pts) — both never = 3, at least one never = 1
  if (customer.smoking === 'Never' && candidate.smoking === 'Never') breakdown.lifestyle += 3;
  else if (customer.smoking === 'Never' || candidate.smoking === 'Never') breakdown.lifestyle += 1;

  // Drinking (3 pts) — same drinking habit = 3, adjacent = 1
  if (customer.drinking === candidate.drinking) breakdown.lifestyle += 3;
  else if (
    (customer.drinking === 'Never' && candidate.drinking === 'Socially') ||
    (customer.drinking === 'Socially' && candidate.drinking === 'Never')
  ) breakdown.lifestyle += 1;

  // Final score = sum of all dimensions
  const score = Object.values(breakdown).reduce((a, b) => a + b, 0);

  return { score, breakdown };
}

// ── Main Engine Function ───────────────────────────────────────────────────────
// Takes one customer and an array of all other active customers.
// Returns top matches sorted by score descending.

function findMatches(customer, allCandidates, topN = 20) {
  const results = [];

  for (const candidate of allCandidates) {
    // Skip the customer themselves
    if (candidate.id === customer.id) continue;

    const filter = hardFilter(customer, candidate);
    if (!filter.passed) continue; // eliminated

    const { score, breakdown } = scoreMatch(customer, candidate);
    results.push({ candidate, score, breakdown });
  }

  // Sort by score descending, return top N
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, topN);
}

module.exports = { findMatches, hardFilter, scoreMatch, getAge };
