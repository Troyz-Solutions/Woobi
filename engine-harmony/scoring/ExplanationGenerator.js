/**
 * Engine Harmony - Stylist Explanation & Feedback Generator
 */

/**
 * Generates an articulate, human-readable styling rationale.
 * @param {Object} scoreReport Report from HarmonyScorer
 * @param {Object} outfit The outfit ensemble
 * @returns {Object} Explanation summary and stylist tips
 */
export function generateStylistExplanation(scoreReport, outfit) {
  if (!scoreReport || typeof scoreReport !== 'object') {
    return {
      summary: 'Standard everyday ensemble',
      strengths: [],
      tips: []
    };
  }

  const { totalScore, subScores, dominantHarmony, feedback = [] } = scoreReport;

  const strengths = [];
  const tips = [];

  // Color strengths / tips
  if (subScores.color >= 90) {
    strengths.push(`Superb color palette: refined ${dominantHarmony.replace(/_/g, ' ')} harmony`);
  } else if (subScores.color < 70) {
    tips.push('Color combination creates minor visual clash; try anchoring with neutral basics');
  }

  // Formality strengths / tips
  if (subScores.formality >= 90) {
    strengths.push('Cohesive formality profile across all ensemble pieces');
  } else if (subScores.formality < 65) {
    tips.push('Formality clash detected between casual and formal elements');
  }

  // Pattern / Texture strengths
  if (subScores.patternTexture >= 90) {
    strengths.push('Sophisticated pattern and fabric texture interplay');
  } else if (subScores.patternTexture < 65) {
    tips.push('Competing loud prints or mismatched fabric weights');
  }

  // Silhouette
  if (subScores.silhouette >= 90) {
    strengths.push('Flawless proportion balance between upper and lower body');
  }

  // Generate headline summary
  let summary = '';
  if (totalScore >= 90) {
    summary = 'Editorial Excellence: A flawlessly harmonized outfit combining refined color synergy, balanced proportions, and sharp style coherence.';
  } else if (totalScore >= 75) {
    summary = 'Harmonious Look: A well-curated, versatile ensemble with pleasing tonal balance and consistent formality.';
  } else if (totalScore >= 60) {
    summary = 'Everyday Casual: A functional combination suitable for relaxed settings, though could benefit from sharper tonal or textural definition.';
  } else {
    summary = 'Stylistic Tension: Notable clash in color, formality, or pattern hierarchy; consider swapping one piece for a neutral anchor.';
  }

  return {
    summary,
    strengths: strengths.length > 0 ? strengths : [feedback[0] || 'Balanced daily staple'],
    tips: tips.length > 0 ? tips : ['Outfit is well-balanced with no critical styling conflicts']
  };
}

