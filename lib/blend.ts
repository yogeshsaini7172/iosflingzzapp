// QCS score blending utilities

export function blendScore(logicScore: number, aiScore: number | null): number {
  // Only blend if we have a valid AI score
  if (typeof aiScore === 'number' && aiScore > 0 && !isNaN(aiScore)) {
    return Math.round(logicScore * 0.6 + aiScore * 0.4);
  }
  // Fallback to pure logic score
  return Math.round(logicScore);
}

export function validateScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score || 0)));
}