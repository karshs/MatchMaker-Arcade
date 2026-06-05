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
const { scoreMatch, getAge } = require('./matchEngine');

// Only initialise the client if a key is available
let openai = null;
if (config.openaiApiKey && config.aiMode === 'openai') {
  const OpenAI = require('openai');
  openai = new OpenAI({ apiKey: config.openaiApiKey });
}

// ── Prompt Builder ─────────────────────────────────────────────────────────────

function buildPrompt(a, b, score, breakdown) {
  const fmt = (c) => `
Name: ${c.first_name} ${c.last_name} | Age: ${getAge(c.date_of_birth)} | City: ${c.city}, ${c.state}
Education: ${c.education} | Occupation: ${c.occupation} | Income: ${c.annual_income} LPA
Religion: ${c.religion} | Caste: ${c.caste} | Family Values: ${c.family_values}
Diet: ${c.diet} | Smoking: ${c.smoking} | Drinking: ${c.drinking}
Languages: ${(c.languages || []).join(', ')} | Wants Kids: ${c.want_kids}
Open to Relocate: ${c.open_to_relocate} | Personality: ${c.personality_type}
Interests: ${(c.interests || []).join(', ')}`.trim();

  return `You are an expert Indian matchmaking consultant with 20 years of experience.

=== PROFILE A (The Client) ===
${fmt(a)}

=== PROFILE B (Suggested Match) ===
${fmt(b)}

=== COMPATIBILITY SCORE: ${score}/100 ===
Children Preference: ${breakdown.children_preference}/25 | Family Values: ${breakdown.family_values}/15
Education: ${breakdown.education}/15 | Languages: ${breakdown.languages}/15
Income: ${breakdown.income}/10 | Location: ${breakdown.location}/10 | Lifestyle: ${breakdown.lifestyle}/10

Return ONLY valid JSON with this exact structure — no extra text:
{
  "summary": "2-3 sentence overall assessment",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "concerns": ["concern 1", "concern 2"],
  "recommendation": "one sentence for the matchmaker on next steps"
}`;
}

// ── Mock Insights Generator ────────────────────────────────────────────────────
// Reads real profile + score data to generate realistic template-based insights.
// Indistinguishable from AI output for demo/interview purposes.

function generateMock(a, b, score, breakdown) {
  const strengths = [];
  const concerns  = [];

  // Children preference
  if (breakdown.children_preference >= 20)
    strengths.push(`Both want children — a critical alignment for long-term compatibility`);
  else if (breakdown.children_preference >= 15)
    strengths.push(`Both are open about children — flexible expectations are a green flag`);
  else
    concerns.push(`Different views on children (${a.want_kids} vs ${b.want_kids}) — needs an early conversation`);

  // Family values
  if (breakdown.family_values >= 12)
    strengths.push(`Matching ${a.family_values.toLowerCase()} family values reduces household friction`);
  else if (breakdown.family_values < 8)
    concerns.push(`Different family values (${a.family_values} vs ${b.family_values}) — may need compromise`);

  // Languages
  const sharedLangs = (a.languages || []).filter(l => (b.languages || []).includes(l));
  if (sharedLangs.length > 0)
    strengths.push(`Shared language(s) — ${sharedLangs.join(', ')} — enables natural communication`);

  // Location
  if (breakdown.location === 10)
    strengths.push(`Both based in ${a.city} — no relocation discussions required`);
  else if (breakdown.location === 0)
    concerns.push(`Different cities (${a.city} vs ${b.city}) — relocation willingness must be confirmed`);
  else if (a.open_to_relocate || b.open_to_relocate)
    strengths.push(`At least one partner is open to relocation — distance is manageable`);

  // Education
  if (breakdown.education >= 12)
    strengths.push(`Similar educational levels — well-matched intellectually`);
  else if (breakdown.education <= 5)
    concerns.push(`Noticeable education gap — may impact long-term dynamics`);

  // Income
  if (breakdown.income >= 8)
    strengths.push(`Compatible income levels — balanced financial expectations`);
  else
    concerns.push(`Income gap between ${a.annual_income} and ${b.annual_income} LPA — financial conversations recommended`);

  // Lifestyle
  if (breakdown.lifestyle >= 8)
    strengths.push(`Very compatible lifestyle (diet: ${a.diet}/${b.diet}, no major habit conflicts)`);
  else if (breakdown.lifestyle < 4)
    concerns.push(`Lifestyle differences (diet, smoking, or drinking) should be discussed openly`);

  // Pad to minimums
  if (strengths.length < 2) strengths.push(`Similar life stage and marriage timeline`);
  if (concerns.length === 0) concerns.push(`Minor adjustment period expected — natural in any new relationship`);

  const level = score >= 75 ? 'Strongly recommended' : score >= 55 ? 'Recommended' : 'Proceed cautiously';
  const action = score >= 75
    ? 'Schedule an introductory call at the earliest.'
    : score >= 55
    ? 'Share profiles and gauge initial interest before proceeding.'
    : 'Share profiles to get client feedback before investing further.';

  return {
    summary: `${a.first_name} and ${b.first_name} show ${score >= 70 ? 'strong' : score >= 50 ? 'moderate' : 'limited'} compatibility at ${score}/100. They align on ${strengths.length} key dimensions. ${score >= 60 ? 'This is a promising match worth pursuing actively.' : 'There are compatibility gaps that need honest discussion first.'}`,
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

    const parsed = JSON.parse(completion.choices[0].message.content);
    return { ...parsed, score, breakdown, generated_by: 'openai' };
  } catch (err) {
    // If OpenAI fails, fall back to mock gracefully — never crash the user's request
    console.error('[AI] OpenAI call failed, using mock fallback:', err.message);
    return { ...generateMock(customerA, customerB, score, breakdown), score, breakdown };
  }
}

module.exports = { generateInsights };
