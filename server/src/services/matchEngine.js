/**
 * matchEngine.js
 * ──────────────
 * Pure matching logic — no Express, no HTTP, no DB calls.
 * Receives customer objects, returns ranked matches.
 *
 * Two phases:
 *   1. Hard Filters  — eliminates incompatible candidates (binary pass/fail)
 *                      All checks are now BILATERAL (enforced in both directions).
 *   2. Scorer        — awards 0-100 points (gender-specific scorers — see Phase 2A/2B)
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
// Higher number = more qualified. Used in scoring, not filtering.

const EDU_RANK = {
  'Below 10th': 0, '10th': 1, '12th': 2, 'Diploma': 3,
  'B.Sc': 4, 'B.Com': 4, 'BBA': 4, 'B.Arch': 4, 'LLB': 4,
  'B.Tech': 5, 'B.E.': 5, 'MBBS': 6,
  'M.Sc': 6, 'M.Tech': 6, 'MBA': 7, 'CA': 7, 'Ph.D': 8,
};

// ── Marriage Timeline Order ────────────────────────────────────────────────────
// Used to score urgency alignment in Phase 2B (female customer scorer).

const TIMELINE_ORDER = [
  'Within 6 months', '6-12 months', '1-2 years', 'After 2 years', 'Not Sure',
];

// ── Diet Compatibility Map ─────────────────────────────────────────────────────

const DIET_COMPAT = {
  Jain:             ['Jain', 'Vegetarian'],
  Vegetarian:       ['Jain', 'Vegetarian'],
  Eggetarian:       ['Eggetarian', 'Vegetarian'],
  'Non-Vegetarian': ['Non-Vegetarian', 'Eggetarian'],
  Vegan:            ['Vegan', 'Vegetarian'],
};

// ── PHASE 1: Hard Filters ──────────────────────────────────────────────────────
// Returns { passed: boolean, reason: string }
// FIXED: All preference checks are now bilateral — candidate's preferences
// are enforced just as strictly as the customer's.

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

  // 4. Religion — BILATERAL: both parties' preferences must be satisfied
  if (customer.pref_religion && customer.pref_religion.length > 0) {
    if (!customer.pref_religion.includes(candidate.religion)) {
      return { passed: false, reason: 'Religion mismatch (customer preference)' };
    }
  }
  if (candidate.pref_religion && candidate.pref_religion.length > 0) {
    if (!candidate.pref_religion.includes(customer.religion)) {
      return { passed: false, reason: 'Religion mismatch (candidate preference)' };
    }
  }

  // 5. Caste — BILATERAL
  if (customer.pref_caste && customer.pref_caste.length > 0) {
    if (!customer.pref_caste.includes(candidate.caste)) {
      return { passed: false, reason: 'Caste mismatch (customer preference)' };
    }
  }
  if (candidate.pref_caste && candidate.pref_caste.length > 0) {
    if (!candidate.pref_caste.includes(customer.caste)) {
      return { passed: false, reason: 'Caste mismatch (candidate preference)' };
    }
  }

  // 6. Want kids — hard mismatch only when one is Yes and other is No
  const kidsMismatch =
    (customer.want_kids === 'Yes' && candidate.want_kids === 'No') ||
    (customer.want_kids === 'No'  && candidate.want_kids === 'Yes');
  if (kidsMismatch) {
    return { passed: false, reason: 'Children preference mismatch' };
  }

  // 7. Diet — BILATERAL: Jain/Veg cannot be matched with Non-Veg from either side
  const strictVeg = ['Vegetarian', 'Jain'];
  if (strictVeg.includes(customer.diet) && candidate.diet === 'Non-Vegetarian') {
    return { passed: false, reason: 'Diet incompatibility (customer is strict veg)' };
  }
  if (strictVeg.includes(candidate.diet) && customer.diet === 'Non-Vegetarian') {
    return { passed: false, reason: 'Diet incompatibility (candidate is strict veg)' };
  }

  // 8. NEW: Income floor — typically the female specifies pref_income_min
  //    Identify which party is male and check against the female's stated minimum
  const male   = customer.gender === 'Male' ? customer : candidate;
  const female = customer.gender === 'Female' ? customer : candidate;
  if (female.pref_income_min && male.annual_income
      && male.annual_income < female.pref_income_min) {
    return { passed: false, reason: 'Male income below female minimum preference' };
  }

  return { passed: true };
}

// ── PHASE 2: Scorer (placeholder — gender-specific scorers added in next commits) ──

function scoreMatch(customer, candidate) {
  // Temporary flat scorer kept for backward compatibility during refactor.
  // Will be replaced by scoreMaleCustomer / scoreFemaleCustomer routing.
  const breakdown = {
    children_preference: 0,  // max 25
    family_values:       0,  // max 15
    education:           0,  // max 15
    languages:           0,  // max 15 — FIXED: now capped correctly
    income:              0,  // max 10
    location:            0,  // max 10
    lifestyle:           0,  // max 10
  };

  // Children Preference (25 pts)
  const kc = customer.want_kids;
  const kd = candidate.want_kids;
  if (kc === kd)                                        breakdown.children_preference = 25;
  else if (kc === 'Open' || kd === 'Open')              breakdown.children_preference = 15;
  else if (kc === 'Already Has' || kd === 'Already Has') breakdown.children_preference = 10;

  // Family Values (15 pts) — FIXED: guard against indexOf returning -1
  const VALUES_ORDER = ['Traditional', 'Moderate', 'Liberal'];
  const vi = VALUES_ORDER.indexOf(customer.family_values);
  const vj = VALUES_ORDER.indexOf(candidate.family_values);
  if (vi !== -1 && vj !== -1) {
    const valueDiff = Math.abs(vi - vj);
    if (valueDiff === 0)      breakdown.family_values = 15;
    else if (valueDiff === 1) breakdown.family_values = 8;
  }

  // Education (15 pts)
  const ei = EDU_RANK[customer.education] ?? 4;
  const ej = EDU_RANK[candidate.education] ?? 4;
  const eduDiff = Math.abs(ei - ej);
  if (eduDiff === 0)      breakdown.education = 15;
  else if (eduDiff === 1) breakdown.education = 10;
  else if (eduDiff === 2) breakdown.education = 5;

  // Languages (15 pts) — FIXED: cap shared at maxPossible before math to prevent overflow
  const custLangs = customer.languages || [];
  const candLangs = candidate.languages || [];
  const shared    = custLangs.filter(l => candLangs.includes(l)).length;
  const maxPossible = Math.min(Math.max(custLangs.length, candLangs.length), 3);
  if (maxPossible > 0) {
    breakdown.languages = Math.min(15, Math.round((Math.min(shared, maxPossible) / maxPossible) * 15));
  }

  // Income (10 pts)
  const inc1 = customer.annual_income || 0;
  const inc2 = candidate.annual_income || 0;
  if (inc1 > 0 && inc2 > 0) {
    const ratio = Math.max(inc1, inc2) / Math.min(inc1, inc2);
    if (ratio <= 1.5)      breakdown.income = 10;
    else if (ratio <= 2.5) breakdown.income = 5;
    else if (ratio <= 4)   breakdown.income = 2;
  }

  // Location (10 pts) — FIXED: guard against undefined city/state
  if (customer.city && candidate.city && customer.city === candidate.city) {
    breakdown.location = 10;
  } else if (customer.state && candidate.state && customer.state === candidate.state) {
    breakdown.location = 6;
  } else if (customer.open_to_relocate || candidate.open_to_relocate) {
    breakdown.location = 4;
  }

  // Lifestyle (10 pts) — FIXED: guard against undefined smoking/drinking
  const dietCompat = DIET_COMPAT[customer.diet] || [];
  if (candidate.diet && dietCompat.includes(candidate.diet)) breakdown.lifestyle += 4;

  if (customer.smoking && candidate.smoking) {
    if (customer.smoking === 'Never' && candidate.smoking === 'Never') breakdown.lifestyle += 3;
    else if (customer.smoking === 'Never' || candidate.smoking === 'Never') breakdown.lifestyle += 1;
  }

  if (customer.drinking && candidate.drinking) {
    if (customer.drinking === candidate.drinking) {
      breakdown.lifestyle += 3;
    } else if (
      (customer.drinking === 'Never' && candidate.drinking === 'Socially') ||
      (customer.drinking === 'Socially' && candidate.drinking === 'Never')
    ) {
      breakdown.lifestyle += 1;
    }
  }

  const score = Object.values(breakdown).reduce((a, b) => a + b, 0);
  return { score, breakdown };
}

// ── Main Engine Function ───────────────────────────────────────────────────────

function findMatches(customer, allCandidates, topN = 20) {
  const results = [];

  for (const candidate of allCandidates) {
    if (candidate.id === customer.id) continue;

    const filter = hardFilter(customer, candidate);
    if (!filter.passed) continue;

    const { score, breakdown } = scoreMatch(customer, candidate);
    results.push({ candidate, score, breakdown });
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, topN);
}

module.exports = { findMatches, hardFilter, scoreMatch, getAge };
