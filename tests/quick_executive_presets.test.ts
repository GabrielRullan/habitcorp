import { describe, it, expect } from 'vitest';

export function getQuickPresetSettings(preset: '15m_xs' | '30m_s' | 'today' | 'tomorrow', baseDate: Date = new Date()) {
  const todayStr = baseDate.toISOString().slice(0, 10);
  const tomorrow = new Date(baseDate);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

  switch (preset) {
    case '15m_xs':
      return { difficulty: 'trivial', scheduledDuration: 15 };
    case '30m_s':
      return { difficulty: 'easy', scheduledDuration: 30 };
    case 'today':
      return { scheduledDate: todayStr, dueDate: todayStr, enableAgenda: true };
    case 'tomorrow':
      return { scheduledDate: tomorrowStr, dueDate: tomorrowStr, enableAgenda: true };
  }
}

describe('Quick Executive Preset Chips', () => {
  it('correctly configures 15m XS spoon preset', () => {
    const res = getQuickPresetSettings('15m_xs');
    expect(res.difficulty).toBe('trivial');
    expect(res.scheduledDuration).toBe(15);
  });

  it('correctly configures 30m S spoon preset', () => {
    const res = getQuickPresetSettings('30m_s');
    expect(res.difficulty).toBe('easy');
    expect(res.scheduledDuration).toBe(30);
  });

  it('correctly calculates tomorrow even across month boundaries', () => {
    const endOfMonth = new Date('2026-10-31T12:00:00Z');
    const res = getQuickPresetSettings('tomorrow', endOfMonth);
    expect(res.scheduledDate).toBe('2026-11-01');
    expect(res.enableAgenda).toBe(true);
  });
});
