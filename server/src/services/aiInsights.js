/**
 * aiInsights.js
 * ─────────────
 * Generates human-readable match explanations.
 * AI does NOT find matches — it explains them after the engine runs.
 *
 * Two modes (controlled by AI_MODE in .env):
 *   'openai' → calls GPT-4o with real profiles + score breakdown
 *   'mock'   → generates realistic insights from actual profile data (no API key needed)
 */

const { config } = require('../config/env');
const { scoreMatch, getMatchLabel, getAge } = require('./matchEngine');

// Only initialise the client if a key is available
let openai = null;
if (config.openaiApiKey && config.aiMode === 'openai') {
  const OpenAI = require('openai');
  openai = new OpenAI({ apiKey: config.openaiApiKey });
}

// ── Safe Field Helper ──────────────────────────────────────────────────────────
// Prevents "undefined" from appearing in any generated text output.
// Always call this before embedding a profile field in a string.

function safe(value, fallback = 'Not specified') {
  if (value === null || value === undefined || value === '') return fallback;
  return String(value);
}

// ── Breakdown Normaliser ───────────────────────────────────────────────────────
// The engine now returns different breakdown keys depending on gender.
// This normalises both into a common shape that buildPrompt and generateMock
// can read without caring about which scorer ran.
//
// Male breakdown keys:  children_preference, age_gap, height, income,
//                       family_values, location, lifestyle
// Female breakdown keys: children_preference, family_values,
//                        profession_compatibility, relocation_alignment,
//                        marriage_timeline, income, languages, lifestyle

function normaliseBreakdown(breakdown) {
  return {
    children_preference:      breakdown.children_preference      ?? 0,
    family_values:            breakdown.family_values            ?? 0,
    income:                   breakdown.income                   ?? 0,
    lifestyle:                breakdown.lifestyle                ?? 0,
    location:                 breakdown.location                 ?? 0,
    // Male-specific
    age_gap:                  breakdown.age_gap                  ?? null,
    height:                   breakdown.height                   ?? null,
    // Female-specific
    profession_compatibility: breakdown.profession_compatibility ?? null,
    relocation_alignment:     breakdown.relocation_alignment     ?? null,
    marriage_timeline:        breakdown.marriage_timeline        ?? null,
    languages:                breakdown.languages                ?? null,
  };
}

// ── JSON Parser (Crash-Safe) ───────────────────────────────────────────────────
// GPT sometimes wraps its JSON response in markdown code fences even when asked
// not to (e.g.  ```json { ... } ```). Stripping those before parsing prevents
// a SyntaxError that would silently fall through to the mock fallback —
// wasting an API call and burning credits.

function safeJsonParse(raw) {
  // Strip leading/trailing whitespace
  let text = raw.trim();
  // Remove markdown code block wrappers if present
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  return JSON.parse(text);
}

// ── Prompt Builder ─────────────────────────────────────────────────────────────

function buildPrompt(a, b, score, breakdown) {
  const nb = normaliseBreakdown(breakdown);
  const label = getMatchLabel(score);

  const fmt = (c) => `
Name: ${safe(c.first_name)} ${safe(c.last_name)} | Age: ${getAge(c.date_of_birth)} | City: ${safe(c.city)}, ${safe(c.state)}
Education: ${safe(c.education)} | Occupation: ${safe(c.occupation)} | Income: ${safe(c.annual_income, 'N/A')} LPA | Sector: ${safe(c.employed_in)}
Religion: ${safe(c.religion)} | Caste: ${safe(c.caste)} | Family Values: ${safe(c.family_values)}
Diet: ${safe(c.diet)} | Smoking: ${safe(c.smoking)} | Drinking: ${safe(c.drinking)}
Languages: ${(c.languages || []).join(', ') || 'Not specified'} | Wants Kids: ${safe(c.want_kids)}
Open to Relocate: ${safe(c.open_to_relocate)} | Marriage Timeline: ${safe(c.marriage_timeline)} | Personality: ${safe(c.personality_type)}
Interests: ${(c.interests || []).join(', ') || 'Not specified'}`.trim();

  // Build a dynamic score summary that works for both male and female breakdowns
  const scoreLines = [
    `Children Preference: ${nb.children_preference} | Family Values: ${nb.family_values} | Income: ${nb.income} | Lifestyle: ${nb.lifestyle}`,
    nb.age_gap    !== null ? `Age Gap: ${nb.age_gap}/15 | Height: ${nb.height}/10 | Location: ${nb.location}/10` : null,
    nb.profession_compatibility !== null
      ? `Profession Compatibility: ${nb.profession_compatibility}/15 | Relocation: ${nb.relocation_alignment}/10 | Timeline: ${nb.marriage_timeline}/10 | Languages: ${nb.languages}/10`
      : null,
  ].filter(Boolean).join('\n');

  return `You are an expert Indian matchmaking consultant with 20 years of experience.

=== PROFILE A (The Client) ===
${fmt(a)}

=== PROFILE B (Suggested Match) ===
${fmt(b)}

=== COMPATIBILITY SCORE: ${score}/100 — ${label} ===
${scoreLines}

Return ONLY valid JSON with this exact structure — no extra text, no markdown fences:
{
  "summary": "2-3 sentence overall assessment mentioning the score label",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "concerns": ["concern 1", "concern 2"],
  "recommendation": "one sentence for the matchmaker on next steps"
}`;
}

// ── Mock Insights Generator ────────────────────────────────────────────────────
// Reads real profile + score data to generate realistic template-based insights.
// Uses safe() on every field to prevent "undefined" appearing in output text.
// Handles both male and female scorer breakdown shapes via normaliseBreakdown().

function generateMock(a, b, score, breakdown) {
  const nb  = normaliseBreakdown(breakdown);
  const strengths = [];
  const concerns  = [];

  // Children preference (both scorers have this key)
  if (nb.children_preference >= 15)
    strengths.push(`Both share the same view on children — a critical alignment for long-term compatibility`);
  else if (nb.children_preference >= 10)
    strengths.push(`Both are open about children — flexible expectations are a green flag`);
  else
    concerns.push(`Different views on children (${safe(a.want_kids, 'unspecified')} vs ${safe(b.want_kids, 'unspecified')}) — needs an early conversation`);

  // Family values (both scorers have this key)
  const aVals = safe(a.family_values, null);
  const bVals = safe(b.family_values, null);
  if (nb.family_values >= 15 && aVals)
    strengths.push(`Matching ${aVals.toLowerCase()} family values reduces household friction`);
  else if (nb.family_values < 8 && aVals && bVals)
    concerns.push(`Different family values (${aVals} vs ${bVals}) — may need compromise`);

  // Languages (present in female scorer; compute from profiles for male scorer)
  const sharedLangs = (a.languages || []).filter(l => (b.languages || []).includes(l));
  if (sharedLangs.length > 0)
    strengths.push(`Shared language(s) — ${sharedLangs.join(', ')} — enables natural communication`);

  // Location / relocation
  if (nb.location === 10)
    strengths.push(`Both based in ${safe(a.city, 'the same city')} — no relocation discussions required`);
  else if (nb.relocation_alignment >= 10)
    strengths.push(`Both are open to relocation — geographic flexibility is a strong green flag`);
  else if (nb.location === 0 && nb.relocation_alignment !== null && nb.relocation_alignment < 6)
    concerns.push(`Different cities (${safe(a.city, 'unknown')} vs ${safe(b.city, 'unknown')}) — relocation willingness must be confirmed`);

  // Male-specific: age gap
  if (nb.age_gap !== null) {
    if (nb.age_gap >= 15)
      strengths.push(`Ideal age difference — ${safe(a.first_name)} is the right amount older for cultural compatibility`);
    else if (nb.age_gap < 7)
      concerns.push(`Age gap may raise family expectations — worth discussing early`);
  }

  // Female-specific: profession compatibility
  if (nb.profession_compatibility !== null) {
    if (nb.profession_compatibility >= 12)
      strengths.push(`Both work in the ${safe(a.employed_in)} sector — shared professional culture and work-life expectations`);
    else if (nb.profession_compatibility < 8)
      concerns.push(`Different employment sectors (${safe(a.employed_in, 'unspecified')} vs ${safe(b.employed_in, 'unspecified')}) — lifestyle pace may differ`);
  }

  // Female-specific: marriage timeline
  if (nb.marriage_timeline !== null) {
    if (nb.marriage_timeline >= 10)
      strengths.push(`Both share the same marriage urgency (${safe(a.marriage_timeline, 'similar timeline')}) — no pressure mismatch`);
    else if (nb.marriage_timeline < 6)
      concerns.push(`Different marriage timelines (${safe(a.marriage_timeline, 'unspecified')} vs ${safe(b.marriage_timeline, 'unspecified')}) — the most common early drop-off reason on matrimonial platforms`);
  }

  // Income (both scorers have this key)
  if (nb.income >= 8)
    strengths.push(`Compatible income levels — balanced financial expectations`);
  else {
    const aInc = safe(a.annual_income, 'unspecified');
    const bInc = safe(b.annual_income, 'unspecified');
    concerns.push(`Income gap (${aInc} vs ${bInc} LPA) — financial conversations recommended`);
  }

  // Lifestyle (both scorers have this key)
  if (nb.lifestyle >= 8)
    strengths.push(`Very compatible lifestyle (diet: ${safe(a.diet, 'similar')}/${safe(b.diet, 'similar')}, no major habit conflicts)`);
  else if (nb.lifestyle < 4)
    concerns.push(`Lifestyle differences in diet, smoking, or drinking should be discussed openly`);

  // Pad to minimums so output always looks complete
  if (strengths.length < 2) strengths.push(`Similar life stage and marriage goals`);
  if (concerns.length === 0) concerns.push(`Minor adjustment period expected — natural in any new relationship`);

  const label  = getMatchLabel(score);
  const level  = score >= 75 ? 'Strongly recommended' : score >= 55 ? 'Recommended' : 'Proceed cautiously';
  const action = score >= 75
    ? 'Schedule an introductory call at the earliest.'
    : score >= 55
    ? 'Share profiles and gauge initial interest before proceeding.'
    : 'Share profiles to get client feedback before investing further.';

  return {
    summary: `${safe(a.first_name)} and ${safe(b.first_name)} show ${score >= 70 ? 'strong' : score >= 50 ? 'moderate' : 'limited'} compatibility at ${score}/100 (${label}). They align on ${strengths.length} key dimensions. ${score >= 60 ? 'This is a promising match worth pursuing actively.' : 'There are compatibility gaps that need honest discussion first.'}`,
    strengths: strengths.slice(0, 4),
    concerns:  concerns.slice(0, 3),
    recommendation: `${level} — ${action}`,
    generated_by: 'mock',
  };
}

// ── Main Entry Point ───────────────────────────────────────────────────────────

async function generateInsights(customerA, customerB) {
  // Always compute score from the engine (not cached) for accuracy
  const { score, breakdown } = scoreMatch(customerA, customerB);

  // Use mock if AI_MODE is not 'openai' or key is missing
  if (!openai || config.aiMode !== 'openai') {
    return { ...generateMock(customerA, customerB, score, breakdown), score, breakdown };
  }

  try {
    const prompt = buildPrompt(customerA, customerB, score, breakdown);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }, // guarantees valid JSON back
      max_tokens: 500,
      temperature: 0.7,
    });

    // FIXED: use safeJsonParse() to strip markdown fences before parsing.
    // GPT occasionally wraps its response in ```json ... ``` even with json_object mode.
    const parsed = safeJsonParse(completion.choices[0].message.content);
    return { ...parsed, score, breakdown, generated_by: 'openai' };
  } catch (err) {
    // If OpenAI fails, fall back to mock gracefully — never crash the user's request
    console.error('[AI] OpenAI call failed, using mock fallback:', err.message);
    return { ...generateMock(customerA, customerB, score, breakdown), score, breakdown };
  }
}

module.exports = { generateInsights };
