import { describe, it, expect } from 'vitest';
import { analyzeBodyShape } from './bodyshape.analyzer';

describe('analyzeBodyShape (explainable classification)', () => {
  it('classifies a balanced, defined-waist figure as Hourglass', () => {
    const r = analyzeBodyShape({ bustCm: 90, waistCm: 68, hipCm: 92 });
    expect(r.key).toBe('HOURGLASS');
    expect(r.reason).toMatch(/Hourglass/i);
  });

  it('classifies wider hips as Pear', () => {
    const r = analyzeBodyShape({ bustCm: 84, waistCm: 70, hipCm: 100 });
    expect(r.key).toBe('PEAR');
    expect(r.ratios.bustToHip).toBeLessThan(1);
  });

  it('classifies broader shoulders/bust as Inverted Triangle', () => {
    const r = analyzeBodyShape({ bustCm: 100, waistCm: 78, hipCm: 90, shoulderCm: 44 });
    expect(r.key).toBe('INVERTED_TRIANGLE');
  });

  it('classifies a widest-waist figure as Apple', () => {
    const r = analyzeBodyShape({ bustCm: 92, waistCm: 96, hipCm: 94 });
    expect(r.key).toBe('APPLE');
  });

  it('classifies similar measurements with little waist definition as Rectangle', () => {
    const r = analyzeBodyShape({ bustCm: 90, waistCm: 86, hipCm: 91 });
    expect(r.key).toBe('RECTANGLE');
  });

  it('always returns ratios and a human-readable reason', () => {
    const r = analyzeBodyShape({ bustCm: 88, waistCm: 70, hipCm: 96 });
    expect(r.ratios.waistToBust).toBeGreaterThan(0);
    expect(typeof r.reason).toBe('string');
    expect(r.reason.length).toBeGreaterThan(10);
  });
});
