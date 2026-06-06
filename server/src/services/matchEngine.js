/**
 * matchEngine.js
 * ──────────────
 * Pure matching logic — no Express, no HTTP, no DB calls.
 * Receives customer objects, returns ranked matches.
 *
 * Two phases:
 *   1. Hard Filters      — eliminates incompatible candidates (binary pass/fail)
 *                          All checks are BILATERAL (enforced in both directions).
 *   2. Gender Scorers    — two separate scorers for realistic Indian matrimonial logic
 *        2A. scoreMaleCustomer   — weights age gap, height, income direction, values
 *        2B. scoreFemaleCustomer — weights values, profession sector, relocation, timeline
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

// ── PHASE 2A: Male Customer Scorer ───────────────────────────────────────────
// customer = Male, candidate = Female. Total: 100 pts.
//
// Based on Indian matrimonial norms (Shaadi.com / Jeevansathi research):
// Males primarily seek: a younger partner, shared children vision, the male
// being taller, lifestyle harmony, and themselves being the primary earner.

function scoreMaleCustomer(male, female) {
  const breakdown = {
    children_preference: 0,  // max 20 — shared vision on family
    age_gap:             0,  // max 15 — female younger is the norm
    height:              0,  // max 10 — male taller is the norm
    income:              0,  // max 15 — male earns more is expected
    family_values:       0,  // max 15 — shared household outlook
    location:            0,  // max 10 — proximity
    lifestyle:           0,  // max 15 — diet, smoking, drinking
  };

  // ── Children Preference (20 pts) ─────────────────────────────
  const kc = male.want_kids;
  const kd = female.want_kids;
  if (kc === kd)                                           breakdown.children_preference = 20;
  else if (kc === 'Open' || kd === 'Open')                 breakdown.children_preference = 12;
  else if (kc === 'Already Has' || kd === 'Already Has')   breakdown.children_preference = 8;

  // ── Age Gap (15 pts) — female younger is the strong preference in Indian matrimony
  const maleAge   = getAge(male.date_of_birth);
  const femaleAge = getAge(female.date_of_birth);
  const ageDiff   = maleAge - femaleAge; // positive = male older
  if      (ageDiff >= 0 && ageDiff <= 5)  breakdown.age_gap = 15; // ideal range
  else if (ageDiff > 5  && ageDiff <= 10) breakdown.age_gap = 10; // wide but acceptable
  else if (ageDiff > 10)                  breakdown.age_gap = 4;  // large gap
  else if (ageDiff < 0  && ageDiff >= -2) breakdown.age_gap = 7;  // female slightly older — tolerable
  // female more than 2 yrs older = 0 pts

  // ── Height (10 pts) — male taller is the social norm ─────────
  const mH = male.height_cm   || 0;
  const fH = female.height_cm || 0;
  if (mH > 0 && fH > 0) {
    const hDiff = mH - fH; // positive = male taller
    if      (hDiff >= 8) breakdown.height = 10;
    else if (hDiff >= 4) breakdown.height = 7;
    else if (hDiff >= 0) breakdown.height = 4;
    // female taller = 0 pts
  }

  // ── Income (15 pts) — male is expected to be the primary earner ──
  const mInc = male.annual_income   || 0;
  const fInc = female.annual_income || 0;
  if (mInc > 0 && fInc > 0) {
    if      (mInc >= fInc)           breakdown.income = 15; // male earns same or more — ideal
    else if (fInc / mInc <= 1.5)    breakdown.income = 8;  // female earns slightly more — acceptable
    else if (fInc / mInc <= 2.5)    breakdown.income = 3;  // noticeable income gap
    // female earns > 2.5x male = 0 pts
  } else if (mInc > 0) {
    breakdown.income = 10; // female income unknown — give benefit of doubt
  }

  // ── Family Values (15 pts) ────────────────────────────────────
  const VALUES_ORDER = ['Traditional', 'Moderate', 'Liberal'];
  const vi = VALUES_ORDER.indexOf(male.family_values);
  const vj = VALUES_ORDER.indexOf(female.family_values);
  if (vi !== -1 && vj !== -1) {
    const valueDiff = Math.abs(vi - vj);
    if      (valueDiff === 0) breakdown.family_values = 15;
    else if (valueDiff === 1) breakdown.family_values = 8;
  }

  // ── Location (10 pts) ─────────────────────────────────────────
  if (male.city && female.city && male.city === female.city) {
    breakdown.location = 10;
  } else if (male.state && female.state && male.state === female.state) {
    breakdown.location = 6;
  } else if (male.open_to_relocate || female.open_to_relocate) {
    breakdown.location = 4;
  }

  // ── Lifestyle (15 pts) ────────────────────────────────────────
  // Diet (5 pts)
  const dietCompat = DIET_COMPAT[male.diet] || [];
  if (female.diet && dietCompat.includes(female.diet)) breakdown.lifestyle += 5;

  // Smoking (5 pts) — both never = 5, one never = 2
  if (male.smoking && female.smoking) {
    if      (male.smoking === 'Never' && female.smoking === 'Never') breakdown.lifestyle += 5;
    else if (male.smoking === 'Never' || female.smoking === 'Never') breakdown.lifestyle += 2;
  }

  // Drinking (5 pts) — same habit = 5; Never ↔ Socially = 2 (adjacent)
  if (male.drinking && female.drinking) {
    if (male.drinking === female.drinking) {
      breakdown.lifestyle += 5;
    } else if (
      (male.drinking === 'Never'    && female.drinking === 'Socially') ||
      (male.drinking === 'Socially' && female.drinking === 'Never')
    ) {
      breakdown.lifestyle += 2;
    }
  }

  const score = Math.min(100, Object.values(breakdown).reduce((a, b) => a + b, 0));
  return { score, breakdown };
}

// ── PHASE 2B: Female Customer Scorer ──────────────────────────────────────────
// customer = Female, candidate = Male. Total: 100 pts.
//
// Research: Women on matrimonial platforms (Jeevansathi user studies,
// matrimony.com compatibility reports) prioritise stability, shared values,
// professional alignment, and urgency/relocation match over age/height.

function scoreFemaleCustomer(female, male) {
  const breakdown = {
    children_preference:      0,  // max 15
    family_values:            0,  // max 20 — highest weight for female customers
    profession_compatibility: 0,  // max 15 — same employment sector
    relocation_alignment:     0,  // max 10 — both willing to move
    marriage_timeline:        0,  // max 10 — compatible urgency
    income:                   0,  // max 10 — male earns stably
    languages:                0,  // max 10 — shared communication
    lifestyle:                0,  // max 10 — diet, smoking, drinking
  };

  // ── Children Preference (15 pts) ─────────────────────────────
  const kc = female.want_kids;
  const kd = male.want_kids;
  if (kc === kd)                                          breakdown.children_preference = 15;
  else if (kc === 'Open' || kd === 'Open')                breakdown.children_preference = 10;
  else if (kc === 'Already Has' || kd === 'Already Has')  breakdown.children_preference = 6;

  // ── Family Values (20 pts) ─────────────────────────────────────
  // Highest weight — women prioritise values alignment more than any other factor
  const VALUES_ORDER = ['Traditional', 'Moderate', 'Liberal'];
  const vi = VALUES_ORDER.indexOf(female.family_values);
  const vj = VALUES_ORDER.indexOf(male.family_values);
  if (vi !== -1 && vj !== -1) {
    const valueDiff = Math.abs(vi - vj);
    if      (valueDiff === 0) breakdown.family_values = 20;
    else if (valueDiff === 1) breakdown.family_values = 10;
    // diff of 2 = 0 pts
  }

  // ── Profession Compatibility (15 pts) ─────────────────────────
  // Same employment sector signals shared work culture and lifestyle expectations.
  // e.g. Govt + Govt = job security, similar timings; Private + Private = growth mindset.
  const SECTOR_ORDER = ['Government', 'Private', 'Business', 'Not Working', 'Other'];
  const fSector = female.employed_in;
  const mSector = male.employed_in;
  if (fSector && mSector) {
    if (fSector === mSector) {
      breakdown.profession_compatibility = 15; // exact sector match
    } else {
      const fi = SECTOR_ORDER.indexOf(fSector);
      const mi = SECTOR_ORDER.indexOf(mSector);
      if (fi !== -1 && mi !== -1 && Math.abs(fi - mi) === 1) {
        breakdown.profession_compatibility = 8; // adjacent sectors — compatible outlook
      }
    }
  }

  // ── Relocation Alignment (10 pts) ─────────────────────────────
  if (female.open_to_relocate && male.open_to_relocate) {
    breakdown.relocation_alignment = 10; // both flexible
  } else if (female.open_to_relocate || male.open_to_relocate) {
    breakdown.relocation_alignment = 6;  // one is flexible
  } else {
    breakdown.relocation_alignment = 2;  // neither — not a dealbreaker, just lower score
  }

  // ── Marriage Timeline (10 pts) ─────────────────────────────────
  // Critical for female customers — urgency mismatch is the top reported dropout
  // reason on Indian matrimonial platforms.
  const ti = TIMELINE_ORDER.indexOf(female.marriage_timeline);
  const tj = TIMELINE_ORDER.indexOf(male.marriage_timeline);
  if (ti !== -1 && tj !== -1) {
    const timeDiff = Math.abs(ti - tj);
    if      (timeDiff === 0) breakdown.marriage_timeline = 10;
    else if (timeDiff === 1) breakdown.marriage_timeline = 6;
    else if (timeDiff === 2) breakdown.marriage_timeline = 2;
    // > 2 steps apart = 0 pts
  }

  // ── Income (10 pts) — he earns stably; she checks if he meets her expectations ──
  const mInc = male.annual_income   || 0;
  const fInc = female.annual_income || 0;
  if (mInc > 0) {
    if (fInc > 0) {
      if      (mInc >= fInc)        breakdown.income = 10; // he earns same or more
      else if (fInc / mInc <= 2)    breakdown.income = 6;  // she earns more, within 2x
      else                          breakdown.income = 2;  // large gap
    } else {
      breakdown.income = 7; // her income unknown — he earns, give partial credit
    }
  }

  // ── Languages (10 pts) ────────────────────────────────────────
  const fLangs = female.languages || [];
  const mLangs = male.languages   || [];
  const shared = fLangs.filter(l => mLangs.includes(l)).length;
  const maxPossible = Math.min(Math.max(fLangs.length, mLangs.length), 3);
  if (maxPossible > 0) {
    breakdown.languages = Math.min(10, Math.round((Math.min(shared, maxPossible) / maxPossible) * 10));
  }

  // ── Lifestyle (10 pts) ────────────────────────────────────────
  // Diet (4 pts)
  const dietCompat = DIET_COMPAT[female.diet] || [];
  if (male.diet && dietCompat.includes(male.diet)) breakdown.lifestyle += 4;

  // Smoking (3 pts)
  if (female.smoking && male.smoking) {
    if      (female.smoking === 'Never' && male.smoking === 'Never') breakdown.lifestyle += 3;
    else if (female.smoking === 'Never' || male.smoking === 'Never') breakdown.lifestyle += 1;
  }

  // Drinking (3 pts)
  if (female.drinking && male.drinking) {
    if (female.drinking === male.drinking) {
      breakdown.lifestyle += 3;
    } else if (
      (female.drinking === 'Never'    && male.drinking === 'Socially') ||
      (female.drinking === 'Socially' && male.drinking === 'Never')
    ) {
      breakdown.lifestyle += 1;
    }
  }

  const score = Math.min(100, Object.values(breakdown).reduce((a, b) => a + b, 0));
  return { score, breakdown };
}

// ── Phase 2 Router: scoreMatch ─────────────────────────────────────────────────
// Public API used by aiInsights.js and any caller that doesn't know the gender.
// Transparently routes to the correct gender-specific scorer.

function scoreMatch(customer, candidate) {
  if (customer.gender === 'Male') {
    return scoreMaleCustomer(customer, candidate);
  }
  return scoreFemaleCustomer(customer, candidate);
}

// ── Match Label ────────────────────────────────────────────────────────────────
// Maps a numeric score to a human-readable tier label.
// Used in the API response and by aiInsights.js for the summary line.

function getMatchLabel(score) {
  if (score >= 80) return 'Excellent Match';
  if (score >= 60) return 'Good Match';
  if (score >= 40) return 'Possible Match';
  return 'Low Compatibility';
}

// ── Interests Overlap ─────────────────────────────────────────────────────────
// Returns the count of shared interest tags between two profiles.
// Not added to the 100-pt score — used as a secondary sort tiebreaker only.

function interestsOverlap(a, b) {
  const ai = a.interests || [];
  const bi = b.interests || [];
  return ai.filter(i => bi.includes(i)).length;
}

// ── Main Engine Function ───────────────────────────────────────────────────────
// Takes one customer and an array of all other active customers.
// Returns top N matches sorted by score (desc), with interests overlap as tiebreaker.

function findMatches(customer, allCandidates, topN = 20) {
  const results = [];

  for (const candidate of allCandidates) {
    // Skip the customer themselves
    if (candidate.id === customer.id) continue;

    const filter = hardFilter(customer, candidate);
    if (!filter.passed) continue; // eliminated by hard filter

    const { score, breakdown } = scoreMatch(customer, candidate);
    const overlap = interestsOverlap(customer, candidate);
    const label   = getMatchLabel(score);

    results.push({
      candidate,
      score,
      breakdown,
      match_label:        label,   // e.g. "Excellent Match"
      interests_overlap:  overlap, // used as tiebreaker, also exposed to UI
    });
  }

  // Primary sort: score descending
  // Secondary sort: interests overlap descending (tiebreaker when scores are equal)
  results.sort((a, b) => b.score - a.score || b.interests_overlap - a.interests_overlap);

  return results.slice(0, topN);
}

module.exports = {
  findMatches,
  hardFilter,
  scoreMatch,
  scoreMaleCustomer,
  scoreFemaleCustomer,
  getMatchLabel,
  getAge,
};

