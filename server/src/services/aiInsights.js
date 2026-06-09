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
let genai = null;
if (config.geminiApiKey && config.aiMode === 'gemini') {
  const { GoogleGenAI } = require('@google/genai');
  genai = new GoogleGenAI({ apiKey: config.geminiApiKey });
}

function safe(value, fallback = 'Not specified') {
  if (value === null || value === undefined || value === '') return fallback;
  return String(value);
}

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

// Reads real profile + score data to generate realistic template-based insights.
// Uses safe() on every field to prevent "undefined" appearing in output text.
// Handles both male and female scorer breakdown shapes via normaliseBreakdown().

function generateMock(a, b, score, breakdown) {
  const isGoodMatch = score >= 70;
  
  return {
    summary: `AI Insights are currently unavailable (OpenAI key missing or disabled). Based on the raw algorithm, ${safe(a.first_name)} and ${safe(b.first_name)} have a compatibility score of ${Math.round(score)}%.`,
    strengths: [
      isGoodMatch ? 'Strong overall algorithmic compatibility.' : 'Some shared baseline traits.',
      'Profile data verified and active.'
    ],
    concerns: [
      !isGoodMatch ? 'Algorithmic score suggests potential mismatches.' : 'No critical concerns flagged by algorithm.',
      'Manual review recommended without AI assistance.'
    ],
    recommendation: isGoodMatch 
      ? 'Strongly recommended: Proceed with sharing profiles.' 
      : 'Proceed cautiously: Review full breakdown before sharing.',
    generated_by: 'mock'
  };
}

async function generateInsights(customerA, customerB) {
  // Always compute score from the engine (not cached) for accuracy
  const { score, breakdown } = scoreMatch(customerA, customerB);

  // Use mock if AI_MODE is not 'gemini' or key is missing
  if (!genai || config.aiMode !== 'gemini') {
    return { ...generateMock(customerA, customerB, score, breakdown), score, breakdown };
  }

  try {
    const prompt = buildPrompt(customerA, customerB, score, breakdown);

    const response = await genai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      }
    });

    const parsed = safeJsonParse(response.text);
    return { ...parsed, score, breakdown, generated_by: 'gemini' };
  } catch (err) {
    // If Gemini fails, fall back to mock gracefully — never crash the user's request
    console.error('[AI] Gemini call failed, using mock fallback:', err.message);
    return { ...generateMock(customerA, customerB, score, breakdown), score, breakdown };
  }
}

module.exports = { generateInsights };
