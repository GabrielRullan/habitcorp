import { describe, it, expect } from 'vitest';
import { translations, SupportedLang } from '../src/client/i18n/translations';

describe('Multilingual i18n Suite (es, ca, en)', () => {
  const supportedLangs: SupportedLang[] = ['en', 'es', 'ca'];

  it('provides all 3 required languages: English, Spanish, Catalan', () => {
    expect(Object.keys(translations)).toEqual(expect.arrayContaining(['en', 'es', 'ca']));
  });

  it('guarantees key parity across en, es, and ca dictionaries', () => {
    const enKeys = Object.keys(translations.en).sort();
    const esKeys = Object.keys(translations.es).sort();
    const caKeys = Object.keys(translations.ca).sort();

    expect(esKeys).toEqual(enKeys);
    expect(caKeys).toEqual(enKeys);
  });

  it('ensures no empty translation strings exist in any dictionary', () => {
    supportedLangs.forEach((lang) => {
      const dict = translations[lang];
      Object.entries(dict).forEach(([key, val]) => {
        if (typeof val === 'string') {
          expect(val.trim().length, `Empty translation for [${lang}].${key}`).toBeGreaterThan(0);
        } else if (typeof val === 'function') {
          const sampleResult = (val as any)(3);
          expect(sampleResult.trim().length, `Empty function result for [${lang}].${key}`).toBeGreaterThan(0);
        }
      });
    });
  });

  it('has accurate native language names and badges', () => {
    // Branding & core UI checks
    expect(translations.en.tagline).toBe('The boring cousin of Habitica');
    expect(translations.es.tagline).toBe('El primo aburrido de Habitica');
    expect(translations.ca.tagline).toBe("El cosí avorrit d'Habitica");

    // Navigation and tabs
    expect(translations.en.viewAgendaGrid).toBe('Agenda Grid');
    expect(translations.es.viewAgendaGrid).toBe('Cuadrícula de Agenda');
    expect(translations.ca.viewAgendaGrid).toBe("Graella d'Agenda");

    expect(translations.en.viewHabitsTasks).toBe('Habits + Tasks');
    expect(translations.es.viewHabitsTasks).toBe('Hábitos + Tareas');
    expect(translations.ca.viewHabitsTasks).toBe('Hàbits + Tasques');

    // Time-of-day filters
    expect(translations.en.timeFilterMorning).toBe('Morning');
    expect(translations.es.timeFilterMorning).toBe('Mañana');
    expect(translations.ca.timeFilterMorning).toBe('Matí');

    expect(translations.en.timeFilterWorkday).toBe('Workday');
    expect(translations.es.timeFilterWorkday).toBe('Jornada');
    expect(translations.ca.timeFilterWorkday).toBe('Jornada laboral');

    expect(translations.en.timeFilterEvening).toBe('Evening');
    expect(translations.es.timeFilterEvening).toBe('Tarde/Noche');
    expect(translations.ca.timeFilterEvening).toBe('Vespre');

    // Ghosts
    expect(translations.en.agendaGhosts).toBe('Ghosts');
    expect(translations.es.agendaGhosts).toBe('Fantasmas');
    expect(translations.ca.agendaGhosts).toBe('Fantasmes');
  });

  it('correctly executes dynamic pluralized translation functions', () => {
    expect(translations.en.eventGhostsAttached(2)).toBe('2 Ghosts Attached');
    expect(translations.es.eventGhostsAttached(2)).toBe('2 Fantasmas asignados');
    expect(translations.ca.eventGhostsAttached(2)).toBe('2 Fantasmes assignats');

    expect(translations.en.eventSelectedCount(1)).toBe('1 selected');
    expect(translations.es.eventSelectedCount(1)).toBe('1 seleccionados');
    expect(translations.ca.eventSelectedCount(1)).toBe('1 seleccionats');
  });
});
