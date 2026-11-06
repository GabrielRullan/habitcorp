import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Sidebar } from '../src/client/components/Sidebar';
import { I18nProvider } from '../src/client/i18n/I18nContext';

describe('Adversarial Stress Test: Milestone 1 Keyboard Shortcuts & Responsive Layout', () => {
  // Read App.tsx and Sidebar.tsx directly for empirical AST/source verification
  const appPath = path.resolve(__dirname, '../src/client/App.tsx');
  const appSource = fs.readFileSync(appPath, 'utf-8');

  const sidebarPath = path.resolve(__dirname, '../src/client/components/Sidebar.tsx');
  const sidebarSource = fs.readFileSync(sidebarPath, 'utf-8');

  // =========================================================================
  // SUITE 1: KEYBOARD SHORTCUTS DISPATCH HARNESS & MODIFIER ADVERSARIAL MATRIX
  // =========================================================================
  describe('1. Global Keyboard Shortcuts Adversarial Stress Harness', () => {
    // Simulator recreating the exact dispatcher function in App.tsx:326-384
    function createShortcutDispatcher() {
      const state = {
        taskModalOpen: false,
        editingTask: null as any,
        defaultTaskType: 'daily' as string,
        meetingModalOpen: false,
        calendarModalOpen: false,
        projectModalOpen: false,
        agentModalOpen: false,
        spotlightOpen: false,
        brainDumpOpen: false,
        tutorialOpen: false,
        goblinModalOpen: false,
        dailyShutdownOpen: false,
        themeCycles: 0,
        showPomodoro: false,
      };

      const setTaskModalOpen = vi.fn((v: boolean) => { state.taskModalOpen = v; });
      const setEditingTask = vi.fn((v: any) => { state.editingTask = v; });
      const setDefaultTaskType = vi.fn((v: string) => { state.defaultTaskType = v; });
      const setMeetingModalOpen = vi.fn((v: boolean) => { state.meetingModalOpen = v; });
      const setCalendarModalOpen = vi.fn((v: boolean) => { state.calendarModalOpen = v; });
      const setProjectModalOpen = vi.fn((v: boolean) => { state.projectModalOpen = v; });
      const setAgentModalOpen = vi.fn((v: boolean) => { state.agentModalOpen = v; });
      const setSpotlightOpen = vi.fn((v: boolean) => { state.spotlightOpen = v; });
      const setBrainDumpOpen = vi.fn((v: boolean) => { state.brainDumpOpen = v; });
      const setTutorialOpen = vi.fn((v: boolean) => { state.tutorialOpen = v; });
      const setGoblinModalOpen = vi.fn((v: boolean) => { state.goblinModalOpen = v; });
      const setDailyShutdownOpen = vi.fn((v: boolean) => { state.dailyShutdownOpen = v; });
      const cycleTheme = vi.fn(() => { state.themeCycles++; });
      const setShowPomodoro = vi.fn((updater: (prev: boolean) => boolean) => {
        state.showPomodoro = updater(state.showPomodoro);
      });

      const handleKeyDown = (e: {
        key: string;
        ctrlKey?: boolean;
        metaKey?: boolean;
        altKey?: boolean;
        shiftKey?: boolean;
        target?: {
          tagName?: string;
          isContentEditable?: boolean;
        } | null;
        preventDefault?: () => void;
      }) => {
        const target = e.target as any;
        if (
          target &&
          (target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.tagName === 'SELECT' ||
            target.isContentEditable)
        ) {
          return;
        }

        if (e.key === 'Escape') {
          setTaskModalOpen(false);
          setMeetingModalOpen(false);
          setCalendarModalOpen(false);
          setProjectModalOpen(false);
          setAgentModalOpen(false);
          setSpotlightOpen(false);
          setBrainDumpOpen(false);
          setTutorialOpen(false);
          setGoblinModalOpen(false);
          setDailyShutdownOpen(false);
          return;
        }

        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
          e.preventDefault?.();
          setBrainDumpOpen(true);
          return;
        }

        if (e.ctrlKey || e.metaKey || e.altKey) return;

        if (e.key === 'c' || e.key === 'C') {
          e.preventDefault?.();
          setEditingTask(null);
          setDefaultTaskType('todo');
          setTaskModalOpen(true);
        } else if (e.key === 's' || e.key === 'S') {
          e.preventDefault?.();
          setSpotlightOpen(true);
        } else if (e.key === 'b' || e.key === 'B') {
          e.preventDefault?.();
          setBrainDumpOpen(true);
        } else if (e.key === 'd' || e.key === 'D') {
          e.preventDefault?.();
          setDailyShutdownOpen(true);
        } else if (e.key === 't' || e.key === 'T') {
          e.preventDefault?.();
          cycleTheme();
        } else if (e.key === 'p' || e.key === 'P') {
          e.preventDefault?.();
          setShowPomodoro((prev) => !prev);
        } else if (e.key === '?') {
          e.preventDefault?.();
          setTutorialOpen(true);
        }
      };

      return {
        state,
        handleKeyDown,
        spies: {
          setTaskModalOpen,
          setEditingTask,
          setDefaultTaskType,
          setSpotlightOpen,
          setBrainDumpOpen,
          setDailyShutdownOpen,
          setTutorialOpen,
          cycleTheme,
          setShowPomodoro,
          setMeetingModalOpen,
          setCalendarModalOpen,
          setProjectModalOpen,
          setAgentModalOpen,
          setGoblinModalOpen,
        },
      };
    }

    it('triggers quick task creation on "c" and "C" (case-insensitive) with defaultType reset', () => {
      const { state, handleKeyDown, spies } = createShortcutDispatcher();
      const preventDefault1 = vi.fn();
      state.editingTask = { id: 'existing_task', title: 'Editing' };
      state.defaultTaskType = 'habit';

      // Test lowercase 'c'
      handleKeyDown({ key: 'c', preventDefault: preventDefault1 });
      expect(preventDefault1).toHaveBeenCalledTimes(1);
      expect(spies.setEditingTask).toHaveBeenCalledWith(null);
      expect(spies.setDefaultTaskType).toHaveBeenCalledWith('todo');
      expect(spies.setTaskModalOpen).toHaveBeenCalledWith(true);
      expect(state.taskModalOpen).toBe(true);

      // Reset and test uppercase 'C' (CapsLock active)
      state.taskModalOpen = false;
      const preventDefault2 = vi.fn();
      handleKeyDown({ key: 'C', preventDefault: preventDefault2 });
      expect(preventDefault2).toHaveBeenCalledTimes(1);
      expect(spies.setTaskModalOpen).toHaveBeenCalledWith(true);
      expect(state.taskModalOpen).toBe(true);
    });

    it('triggers Spotlight on "s" and "S" with preventDefault', () => {
      const { state, handleKeyDown, spies } = createShortcutDispatcher();
      const pd = vi.fn();
      handleKeyDown({ key: 's', preventDefault: pd });
      expect(pd).toHaveBeenCalled();
      expect(spies.setSpotlightOpen).toHaveBeenCalledWith(true);
      expect(state.spotlightOpen).toBe(true);

      state.spotlightOpen = false;
      handleKeyDown({ key: 'S' });
      expect(state.spotlightOpen).toBe(true);
    });

    it('triggers Brain Dump on "b", "B", and "Ctrl+K" / "Cmd+K"', () => {
      const { state, handleKeyDown, spies } = createShortcutDispatcher();

      // Lowercase 'b'
      const pdB = vi.fn();
      handleKeyDown({ key: 'b', preventDefault: pdB });
      expect(pdB).toHaveBeenCalled();
      expect(spies.setBrainDumpOpen).toHaveBeenCalledWith(true);
      expect(state.brainDumpOpen).toBe(true);

      // Reset
      state.brainDumpOpen = false;

      // Uppercase 'B'
      handleKeyDown({ key: 'B' });
      expect(state.brainDumpOpen).toBe(true);

      // Reset
      state.brainDumpOpen = false;

      // Ctrl+K
      const pdCtrlK = vi.fn();
      handleKeyDown({ key: 'k', ctrlKey: true, preventDefault: pdCtrlK });
      expect(pdCtrlK).toHaveBeenCalled();
      expect(state.brainDumpOpen).toBe(true);

      // Reset
      state.brainDumpOpen = false;

      // Cmd+K (macOS metaKey)
      const pdMetaK = vi.fn();
      handleKeyDown({ key: 'K', metaKey: true, preventDefault: pdMetaK });
      expect(pdMetaK).toHaveBeenCalled();
      expect(state.brainDumpOpen).toBe(true);
    });

    it('triggers Daily Shutdown ritual on "d" and "D"', () => {
      const { state, handleKeyDown, spies } = createShortcutDispatcher();
      const pd = vi.fn();
      handleKeyDown({ key: 'd', preventDefault: pd });
      expect(pd).toHaveBeenCalled();
      expect(spies.setDailyShutdownOpen).toHaveBeenCalledWith(true);
      expect(state.dailyShutdownOpen).toBe(true);

      state.dailyShutdownOpen = false;
      handleKeyDown({ key: 'D' });
      expect(state.dailyShutdownOpen).toBe(true);
    });

    it('cycles system color theme on "t" and "T"', () => {
      const { state, handleKeyDown, spies } = createShortcutDispatcher();
      const pd = vi.fn();
      handleKeyDown({ key: 't', preventDefault: pd });
      expect(pd).toHaveBeenCalled();
      expect(spies.cycleTheme).toHaveBeenCalledTimes(1);
      expect(state.themeCycles).toBe(1);

      handleKeyDown({ key: 'T' });
      expect(spies.cycleTheme).toHaveBeenCalledTimes(2);
      expect(state.themeCycles).toBe(2);
    });

    it('toggles Pomodoro timer on "p" and "P"', () => {
      const { state, handleKeyDown, spies } = createShortcutDispatcher();
      expect(state.showPomodoro).toBe(false);

      const pd = vi.fn();
      handleKeyDown({ key: 'p', preventDefault: pd });
      expect(pd).toHaveBeenCalled();
      expect(spies.setShowPomodoro).toHaveBeenCalledTimes(1);
      expect(state.showPomodoro).toBe(true);

      handleKeyDown({ key: 'P' });
      expect(spies.setShowPomodoro).toHaveBeenCalledTimes(2);
      expect(state.showPomodoro).toBe(false);
    });

    it('triggers Guide & Tutorial modal on "?" (including with shiftKey)', () => {
      const { state, handleKeyDown, spies } = createShortcutDispatcher();
      const pd = vi.fn();
      // On US keyboards '?' requires Shift
      handleKeyDown({ key: '?', shiftKey: true, preventDefault: pd });
      expect(pd).toHaveBeenCalled();
      expect(spies.setTutorialOpen).toHaveBeenCalledWith(true);
      expect(state.tutorialOpen).toBe(true);
    });

    it('dismisses all 10 open modals on "Escape" key', () => {
      const { state, handleKeyDown, spies } = createShortcutDispatcher();
      // Open all modals simultaneously
      state.taskModalOpen = true;
      state.meetingModalOpen = true;
      state.calendarModalOpen = true;
      state.projectModalOpen = true;
      state.agentModalOpen = true;
      state.spotlightOpen = true;
      state.brainDumpOpen = true;
      state.tutorialOpen = true;
      state.goblinModalOpen = true;
      state.dailyShutdownOpen = true;

      handleKeyDown({ key: 'Escape' });

      expect(spies.setTaskModalOpen).toHaveBeenCalledWith(false);
      expect(spies.setMeetingModalOpen).toHaveBeenCalledWith(false);
      expect(spies.setCalendarModalOpen).toHaveBeenCalledWith(false);
      expect(spies.setProjectModalOpen).toHaveBeenCalledWith(false);
      expect(spies.setAgentModalOpen).toHaveBeenCalledWith(false);
      expect(spies.setSpotlightOpen).toHaveBeenCalledWith(false);
      expect(spies.setBrainDumpOpen).toHaveBeenCalledWith(false);
      expect(spies.setTutorialOpen).toHaveBeenCalledWith(false);
      expect(spies.setGoblinModalOpen).toHaveBeenCalledWith(false);
      expect(spies.setDailyShutdownOpen).toHaveBeenCalledWith(false);

      expect(state.taskModalOpen).toBe(false);
      expect(state.meetingModalOpen).toBe(false);
      expect(state.calendarModalOpen).toBe(false);
      expect(state.projectModalOpen).toBe(false);
      expect(state.agentModalOpen).toBe(false);
      expect(state.spotlightOpen).toBe(false);
      expect(state.brainDumpOpen).toBe(false);
      expect(state.tutorialOpen).toBe(false);
      expect(state.goblinModalOpen).toBe(false);
      expect(state.dailyShutdownOpen).toBe(false);
    });

    it('strictly suppresses all hotkeys when typing in INPUT, TEXTAREA, SELECT, or contentEditable', () => {
      const testedKeys = ['c', 's', 'b', 'd', 't', 'p', '?', 'k'];
      const textTargets = [
        { tagName: 'INPUT' },
        { tagName: 'TEXTAREA' },
        { tagName: 'SELECT' },
        { isContentEditable: true },
      ];

      for (const target of textTargets) {
        for (const key of testedKeys) {
          const { state, handleKeyDown, spies } = createShortcutDispatcher();
          const pd = vi.fn();

          handleKeyDown({
            key,
            target: target as any,
            preventDefault: pd,
          });

          // PreventDefault must NOT be called when typing in inputs
          expect(pd).not.toHaveBeenCalled();

          // No modals should open
          expect(state.taskModalOpen).toBe(false);
          expect(state.spotlightOpen).toBe(false);
          expect(state.brainDumpOpen).toBe(false);
          expect(state.dailyShutdownOpen).toBe(false);
          expect(state.tutorialOpen).toBe(false);
          expect(state.themeCycles).toBe(0);
          expect(state.showPomodoro).toBe(false);
        }
      }
    });

    it('strictly blocks system hotkey collisions (Ctrl, Cmd, Alt) for single-letter shortcuts', () => {
      const keys = ['c', 's', 'b', 'd', 't', 'p'];
      const modifiers = [
        { ctrlKey: true },
        { metaKey: true },
        { altKey: true },
        { ctrlKey: true, altKey: true },
        { metaKey: true, altKey: true },
      ];

      for (const key of keys) {
        for (const mod of modifiers) {
          const { state, handleKeyDown } = createShortcutDispatcher();
          const pd = vi.fn();

          handleKeyDown({
            key,
            ...mod,
            preventDefault: pd,
          });

          // System actions like Ctrl+C (copy), Ctrl+S (save), Ctrl+P (print), Ctrl+T (tab)
          // must never be intercepted or prevented!
          expect(pd).not.toHaveBeenCalled();
          expect(state.taskModalOpen).toBe(false);
          expect(state.spotlightOpen).toBe(false);
          expect(state.brainDumpOpen).toBe(false);
          expect(state.dailyShutdownOpen).toBe(false);
          expect(state.themeCycles).toBe(0);
          expect(state.showPomodoro).toBe(false);
        }
      }
    });
  });

  // =========================================================================
  // SUITE 2: SOURCE CODE VERIFICATION OF App.tsx KEYBOARD LISTENER
  // =========================================================================
  describe('2. Source Code Conformance in src/client/App.tsx', () => {
    it('verifies App.tsx registers keydown event listener with window unmount cleanup', () => {
      expect(appSource).toContain("window.addEventListener('keydown', handleKeyDown)");
      expect(appSource).toContain("window.removeEventListener('keydown', handleKeyDown)");
      // Verify empty dependency array to prevent repeated listener recreation
      expect(appSource).toMatch(/window\.addEventListener\('keydown',\s*handleKeyDown\);\s*return\s*\(\)\s*=>\s*window\.removeEventListener\('keydown',\s*handleKeyDown\);\s*},\s*\[\]\);/);
    });

    it('verifies all 8 required shortcuts and Escape are explicitly present in App.tsx', () => {
      expect(appSource).toMatch(/e\.key === 'c' \|\| e\.key === 'C'/);
      expect(appSource).toMatch(/e\.key === 's' \|\| e\.key === 'S'/);
      expect(appSource).toMatch(/e\.key === 'b' \|\| e\.key === 'B'/);
      expect(appSource).toMatch(/e\.key === 'd' \|\| e\.key === 'D'/);
      expect(appSource).toMatch(/e\.key === 't' \|\| e\.key === 'T'/);
      expect(appSource).toMatch(/e\.key === 'p' \|\| e\.key === 'P'/);
      expect(appSource).toMatch(/e\.key === '\?'/);
      expect(appSource).toMatch(/e\.key === 'Escape'/);
    });

    it('verifies input and editable tag guard in App.tsx', () => {
      expect(appSource).toContain("target.tagName === 'INPUT'");
      expect(appSource).toContain("target.tagName === 'TEXTAREA'");
      expect(appSource).toContain("target.tagName === 'SELECT'");
      expect(appSource).toContain('target.isContentEditable');
    });

    it('verifies modifier guard in App.tsx', () => {
      expect(appSource).toContain('if (e.ctrlKey || e.metaKey || e.altKey) return;');
    });
  });

  // =========================================================================
  // SUITE 3: RESPONSIVE LAYOUT VERIFICATION (< md vs >= md)
  // =========================================================================
  describe('3. Responsive Layout Classes & Mobile/Desktop Ergonomics', () => {
    it('ensures Sidebar has strictly "hidden md:flex" preventing mobile layout breakage', () => {
      // In Sidebar.tsx:
      expect(sidebarSource).toContain('hidden md:flex');

      // Render actual Sidebar element
      const defaultProps = {
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
        theme: 'light' as const,
        onCycleTheme: vi.fn(),
        auth: null,
        onOpenAuth: vi.fn(),
        onLogout: vi.fn(),
      };

      const html = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          null,
          React.createElement(Sidebar, defaultProps)
        )
      );

      // Top level <aside> must contain hidden md:flex
      expect(html).toMatch(/<aside[^>]*class="[^"]*hidden md:flex/);
      // Must have aria-label="Sidebar Navigation"
      expect(html).toContain('aria-label="Sidebar Navigation"');
      // Must be sticky top-0 h-screen
      expect(html).toContain('sticky');
      expect(html).toContain('h-screen');
    });

    it('ensures App.tsx container has responsive padding-bottom pb-16 md:pb-0 for mobile nav', () => {
      expect(appSource).toContain('pb-16 md:pb-0');
    });

    it('ensures mobile navigation bar has md:hidden and fixed bottom-0', () => {
      expect(appSource).toContain('md:hidden fixed bottom-0 left-0 right-0 h-16');
    });

    it('verifies header bar is stripped of redundant tools and retains only Brand, View Modes, and Search/Add', () => {
      // Extract header content between <header and </header>
      const headerMatch = appSource.match(/<header[\s\S]*?<\/header>/);
      expect(headerMatch).not.toBeNull();
      const headerContent = headerMatch![0];

      // Must contain Brand
      expect(headerContent).toContain('HabitCorpIcon');
      expect(headerContent).toContain('{t.brandName}');

      // Must contain the 3 View Mode buttons
      expect(headerContent).toContain('viewHabitsTasks');
      expect(headerContent).toContain('viewTasksAgenda');
      expect(headerContent).toContain('viewAgendaGrid');

      // Must contain Search and Add button
      expect(headerContent).toContain('searchPlaceholder');
      expect(headerContent).toContain('setTaskModalOpen(true)');

      // MUST NOT contain Pomodoro, Theme, Audio, Tutorial, LanguagePicker, or Auth in header
      expect(headerContent).not.toContain('setShowPomodoro');
      expect(headerContent).not.toContain('cycleTheme');
      expect(headerContent).not.toContain('soundEnabled');
      expect(headerContent).not.toContain('setTutorialOpen');
      expect(headerContent).not.toContain('LanguagePicker');
      expect(headerContent).not.toContain('onOpenAuth');
      expect(headerContent).not.toContain('handleLogout');
    });

    it('verifies Sidebar is correctly mounted in App.tsx with all required props', () => {
      expect(appSource).toContain('<Sidebar');
      expect(appSource).toContain('onOpenGoblin=');
      expect(appSource).toContain('onOpenAgentApi=');
      expect(appSource).toContain('onOpenPomodoro=');
      expect(appSource).toContain('onOpenCalendars=');
      expect(appSource).toContain('onOpenSpotlight=');
      expect(appSource).toContain('onOpenBrainDump=');
      expect(appSource).toContain('onOpenShutdown=');
      expect(appSource).toContain('soundEnabled=');
      expect(appSource).toContain('onToggleSound=');
      expect(appSource).toContain('onOpenTutorial=');
      expect(appSource).toContain('theme=');
      expect(appSource).toContain('onCycleTheme=');
      expect(appSource).toContain('auth=');
      expect(appSource).toContain('onOpenAuth=');
      expect(appSource).toContain('onLogout=');
    });
  });
});
