import { describe, it, expect } from 'vitest';

export type EnergyMode = 'high' | 'steady' | 'gentle';

export interface EnergyModeEffects {
  lowBatteryFilter: boolean;
  densityMode?: 'spacious' | 'compact';
  message: string;
}

export function applyEnergyMode(mode: EnergyMode): EnergyModeEffects {
  switch (mode) {
    case 'gentle':
      return {
        lowBatteryFilter: true,
        densityMode: 'compact',
        message: '✨ Gentle Mode active. Low visual noise, XS/S tasks prioritized. Go easy on yourself today.',
      };
    case 'high':
      return {
        lowBatteryFilter: false,
        densityMode: 'spacious',
        message: '🚀 High Energy Mode! Ready for deep work and tackling challenging goals.',
      };
    case 'steady':
    default:
      return {
        lowBatteryFilter: false,
        message: '🌱 Steady Mode active. One step at a time at your natural pace.',
      };
  }
}

describe('Contextual Energy Mode & Spoon Calibration', () => {
  it('automatically configures Gentle Mode for low spoon days', () => {
    const effects = applyEnergyMode('gentle');
    expect(effects.lowBatteryFilter).toBe(true);
    expect(effects.densityMode).toBe('compact');
    expect(effects.message).toContain('Gentle Mode active');
  });

  it('restores standard filters for Steady Mode', () => {
    const effects = applyEnergyMode('steady');
    expect(effects.lowBatteryFilter).toBe(false);
    expect(effects.message).toContain('Steady Mode active');
  });

  it('enables full capacity for High Energy Mode', () => {
    const effects = applyEnergyMode('high');
    expect(effects.lowBatteryFilter).toBe(false);
    expect(effects.densityMode).toBe('spacious');
    expect(effects.message).toContain('High Energy Mode');
  });
});
