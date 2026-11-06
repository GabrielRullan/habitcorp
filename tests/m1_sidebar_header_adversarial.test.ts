import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { Sidebar, SidebarProps } from '../src/client/components/Sidebar';
import { I18nProvider } from '../src/client/i18n/I18nContext';

describe('Milestone 1 Adversarial Challenge: Header & Sidebar Reorganization (Requirement R1)', () => {
  const defaultProps: SidebarProps = {
    onOpenGoblin: vi.fn(),
    onOpenAgentApi: vi.fn(),
    onOpenPomodoro: vi.fn(),
    onOpenCalendars: vi.fn(),
    onOpenSpotlight: vi.fn(),
    onOpenBrainDump: vi.fn(),
    onOpenShutdown: vi.fn(),
    soundEnabled: true,
    onToggleSound: vi.fn(),
    showTutorials: true,
    onOpenTutorial: vi.fn(),
    theme: 'light',
    onCycleTheme: vi.fn(),
    auth: null,
    onOpenAuth: vi.fn(),
    onLogout: vi.fn(),
  };

  const renderSidebar = (props: Partial<SidebarProps> = {}) => {
    const combinedProps = { ...defaultProps, ...props };
    return renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        null,
        React.createElement(Sidebar, combinedProps)
      )
    );
  };

  describe('Adversarial Task 1: Strict Inspection of `<header>` in src/client/App.tsx', () => {
    const appTsxPath = path.resolve(__dirname, '../src/client/App.tsx');
    const appTsxContent = fs.readFileSync(appTsxPath, 'utf8');

    it('contains exactly one `<header>` element in App.tsx', () => {
      const headerMatches = appTsxContent.match(/<header[\s>]/g);
      expect(headerMatches).not.toBeNull();
      expect(headerMatches?.length).toBe(1);
    });

    // Extract the exact header block
    const headerMatch = appTsxContent.match(/<header[^>]*>([\s\S]*?)<\/header>/);
    const headerContent = headerMatch ? headerMatch[1] : '';

    it('found and extracted the <header> block', () => {
      expect(headerMatch).not.toBeNull();
      expect(headerContent.length).toBeGreaterThan(0);
    });

    it('verifies NO language picker leaked or remained inside <header>', () => {
      expect(headerContent).not.toMatch(/LanguagePicker/i);
      expect(headerContent).not.toMatch(/Select language/i);
      expect(headerContent).not.toMatch(/locale/i);
    });

    it('verifies NO login or auth profile buttons leaked or remained inside <header>', () => {
      expect(headerContent).not.toMatch(/auth/i);
      expect(headerContent).not.toMatch(/login/i);
      expect(headerContent).not.toMatch(/logout/i);
      expect(headerContent).not.toMatch(/logInSignUp/i);
      expect(headerContent).not.toMatch(/setAuthModalOpen/i);
      expect(headerContent).not.toMatch(/handleLogout/i);
    });

    it('verifies NO theme switcher leaked or remained inside <header>', () => {
      expect(headerContent).not.toMatch(/cycleTheme/i);
      expect(headerContent).not.toMatch(/onCycleTheme/i);
      expect(headerContent).not.toMatch(/Toggle Color Theme/i);
      expect(headerContent).not.toMatch(/theme/i);
    });

    it('verifies NO tools (Pomodoro, Calendar, Spotlight, BrainDump, Shutdown, Chimes, Tutorial) leaked inside <header>', () => {
      // Pomodoro
      expect(headerContent).not.toMatch(/setShowPomodoro/i);
      expect(headerContent).not.toMatch(/Pomodoro Focus Timer/i);
      expect(headerContent).not.toMatch(/onOpenPomodoro/i);

      // Calendar
      expect(headerContent).not.toMatch(/setCalendarModalOpen/i);
      expect(headerContent).not.toMatch(/Calendars and Ghosts/i);
      expect(headerContent).not.toMatch(/onOpenCalendars/i);

      // Spotlight
      expect(headerContent).not.toMatch(/setSpotlightOpen/i);
      expect(headerContent).not.toMatch(/Spotlight Single-Task/i);
      expect(headerContent).not.toMatch(/onOpenSpotlight/i);

      // Brain Dump
      expect(headerContent).not.toMatch(/setBrainDumpOpen/i);
      expect(headerContent).not.toMatch(/Brain Dump Offloader/i);
      expect(headerContent).not.toMatch(/onOpenBrainDump/i);

      // Daily Shutdown
      expect(headerContent).not.toMatch(/setDailyShutdownOpen/i);
      expect(headerContent).not.toMatch(/Evening Daily Shutdown/i);
      expect(headerContent).not.toMatch(/onOpenShutdown/i);

      // Audio chimes
      expect(headerContent).not.toMatch(/setSoundEnabled/i);
      expect(headerContent).not.toMatch(/Toggle Audio Feedback/i);
      expect(headerContent).not.toMatch(/playPeacefulChime/i);

      // Tutorial
      expect(headerContent).not.toMatch(/setTutorialOpen/i);
      expect(headerContent).not.toMatch(/Guide and Tutorial/i);
      expect(headerContent).not.toMatch(/onOpenTutorial/i);

      // Goblin Brain
      expect(headerContent).not.toMatch(/setGoblinModalOpen/i);
      expect(headerContent).not.toMatch(/Goblin Brain/i);

      // Agent REST API
      expect(headerContent).not.toMatch(/setAgentModalOpen/i);
      expect(headerContent).not.toMatch(/Agent REST API/i);
    });

    it('verifies <header> exclusively contains Brand, 3 View Modes, Search and Add', () => {
      // Brand
      expect(headerContent).toContain('HabitCorpIcon');
      expect(headerContent).toContain('t.brandName');
      expect(headerContent).toContain('t.tagline');

      // 3 View Modes
      expect(headerContent).toContain("setViewMode('habits_tasks')");
      expect(headerContent).toContain("setViewMode('tasks_agenda')");
      expect(headerContent).toContain("setViewMode('agenda')");

      // Search & Add
      expect(headerContent).toContain('searchQuery');
      expect(headerContent).toContain('setTaskModalOpen(true)');
    });
  });

  describe('Adversarial Task 2: Strict Verification of Sidebar.tsx', () => {
    it('verifies Goblin Brain action trigger attributes and styling', () => {
      const html = renderSidebar();
      expect(html).toContain('aria-label="Goblin Brain Demolisher"');
      expect(html).toContain('Goblin Brain');
      expect(html).toContain('Micro-step Demolisher');
      expect(html).toContain('👺');
      expect(html).toContain('bg-emerald-50/80');
    });

    it('verifies Agent REST API trigger attributes and styling', () => {
      const html = renderSidebar();
      expect(html).toContain('aria-label="Agent REST API"');
      expect(html).toContain('OpenAPI / Agents');
      expect(html).toContain('bg-indigo-50/70');
    });

    it('verifies all 7 tool triggers are present with their keyboard shortcuts and aria-labels', () => {
      const html = renderSidebar();

      // Pomodoro ('p')
      expect(html).toContain('aria-label="Pomodoro Focus Timer"');
      expect(html).toMatch(/(?:'p'|&#x27;p&#x27;)/);

      // Calendars & Ghosts
      expect(html).toContain('aria-label="Calendars and Ghosts"');

      // Spotlight ('s')
      expect(html).toContain('aria-label="Spotlight Single-Task Isolation"');
      expect(html).toMatch(/(?:'s'|&#x27;s&#x27;)/);

      // Brain Dump ('b')
      expect(html).toContain('aria-label="Brain Dump Offloader"');
      expect(html).toMatch(/(?:'b'|&#x27;b&#x27;)/);

      // Daily Shutdown ('d')
      expect(html).toContain('aria-label="Evening Daily Shutdown Ritual"');
      expect(html).toMatch(/(?:'d'|&#x27;d&#x27;)/);

      // Audio Feedback Chimes
      expect(html).toContain('aria-label="Toggle Audio Feedback"');

      // Tutorial ('?')
      expect(html).toContain('aria-label="Guide and Tutorial"');
      expect(html).toMatch(/(?:\'\?\'|&#x27;\?&#x27;)/);
    });

    it('verifies System Color Selector exists and displays exact mode representations', () => {
      const htmlLight = renderSidebar({ theme: 'light' });
      expect(htmlLight).toContain('aria-label="Toggle Color Theme"');
      expect(htmlLight).toContain('light Mode');
      expect(htmlLight).toMatch(/(?:'t'|&#x27;t&#x27;)/);

      const htmlDark = renderSidebar({ theme: 'dark' });
      expect(htmlDark).toContain('aria-label="Toggle Color Theme"');
      expect(htmlDark).toContain('dark Mode');
      expect(htmlDark).toMatch(/(?:'t'|&#x27;t&#x27;)/);

      const htmlSystem = renderSidebar({ theme: 'system' });
      expect(htmlSystem).toContain('aria-label="Toggle Color Theme"');
      expect(htmlSystem).toContain('system Mode');
      expect(htmlSystem).toMatch(/(?:'t'|&#x27;t&#x27;)/);
    });

    it('verifies LanguagePicker is rendered in the sidebar footer', () => {
      const html = renderSidebar();
      expect(html).toContain('aria-label="Select language"');
    });

    it('verifies unauthenticated user state shows Log In / Sign Up button', () => {
      const html = renderSidebar({ auth: null });
      expect(html).toContain('Log In / Sign Up');
      expect(html).not.toContain('Account menu');
    });

    it('verifies authenticated user state shows @username and Account menu trigger', () => {
      const html = renderSidebar({
        auth: { username: 'zen_master', email: 'zen@example.com' },
      });
      expect(html).toContain('@zen_master');
      expect(html).toContain('aria-label="Account menu"');
      expect(html).not.toContain('Log In / Sign Up');
    });
  });

  describe('Adversarial Task 3: Exclusive System Color Selector & Goblin Brain Handler in App.tsx', () => {
    const appTsxPath = path.resolve(__dirname, '../src/client/App.tsx');
    const appTsxContent = fs.readFileSync(appTsxPath, 'utf8');

    it('confirms Goblin Brain sidebar handler invokes setGoblinTask(null)', () => {
      // Regex check for onOpenGoblin in Sidebar invocation
      const goblinHandlerMatch = appTsxContent.match(/onOpenGoblin=\{?\(\)\s*=>\s*\{([\s\S]*?)\}\}?/);
      expect(goblinHandlerMatch).not.toBeNull();
      const handlerBody = goblinHandlerMatch ? goblinHandlerMatch[1] : '';
      expect(handlerBody).toContain('setGoblinTask(null)');
      expect(handlerBody).toContain('setGoblinModalOpen(true)');
    });

    it('confirms cycleTheme cycles light -> dark -> system -> light', () => {
      const cycleThemeMatch = appTsxContent.match(/const cycleTheme = \(\) => \{([\s\S]*?)\};/);
      expect(cycleThemeMatch).not.toBeNull();
      const cycleBody = cycleThemeMatch ? cycleThemeMatch[1] : '';
      expect(cycleBody).toMatch(/prev === ['"]light['"]\)\s*return\s*['"]dark['"]/);
      expect(cycleBody).toMatch(/prev === ['"]dark['"]\)\s*return\s*['"]system['"]/);
      expect(cycleBody).toMatch(/return\s*['"]light['"]/);
    });

    it('confirms System Color Selector is mounted EXCLUSIVELY in Sidebar', () => {
      // Check that onCycleTheme is passed only to Sidebar in App.tsx
      const onCycleThemeMatches = appTsxContent.match(/onCycleTheme=/g);
      expect(onCycleThemeMatches).not.toBeNull();
      expect(onCycleThemeMatches?.length).toBe(1);

      // Check that Toggle Color Theme aria-label does NOT exist in App.tsx
      expect(appTsxContent).not.toContain('aria-label="Toggle Color Theme"');
    });
  });
});
