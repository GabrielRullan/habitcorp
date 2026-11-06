import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { Sidebar, SidebarProps } from '../src/client/components/Sidebar';
import { GoblinBrainModal } from '../src/client/components/GoblinBrainModal';
import { Task } from '../src/client/types';
import { I18nProvider } from '../src/client/i18n/I18nContext';

describe('Milestone 1 — Requirement R1: Header & Sidebar Navigation Reorganization', () => {
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

  it('renders a desktop-only responsive sidebar with proper styling classes', () => {
    const html = renderSidebar();
    expect(html).toContain('hidden md:flex');
    expect(html).toContain('aria-label="Sidebar Navigation"');
    expect(html).toContain('border-r');
  });

  it('includes Goblin Brain action trigger in the sidebar', () => {
    const html = renderSidebar();
    expect(html).toContain('Goblin Brain');
    expect(html).toContain('aria-label="Goblin Brain Demolisher"');
  });

  it('includes Agent REST API action trigger in the sidebar', () => {
    const html = renderSidebar();
    expect(html).toContain('aria-label="Agent REST API"');
  });

  it('includes all 7 required tool triggers in the sidebar', () => {
    const html = renderSidebar();

    // 1. Pomodoro Focus Timer
    expect(html).toContain('aria-label="Pomodoro Focus Timer"');
    // 2. Calendars & Ghosts
    expect(html).toContain('aria-label="Calendars and Ghosts"');
    // 3. Spotlight Single-Task Isolation
    expect(html).toContain('aria-label="Spotlight Single-Task Isolation"');
    // 4. Brain Dump Offloader
    expect(html).toContain('aria-label="Brain Dump Offloader"');
    // 5. Evening Daily Shutdown Ritual
    expect(html).toContain('aria-label="Evening Daily Shutdown Ritual"');
    // 6. Audio Feedback Chime Toggle
    expect(html).toContain('aria-label="Toggle Audio Feedback"');
    // 7. Tutorial Walkthrough
    expect(html).toContain('aria-label="Guide and Tutorial"');
  });

  it('reflects chime audio feedback status accurately', () => {
    const htmlActive = renderSidebar({ soundEnabled: true });
    expect(htmlActive).toContain('Chimes Active');

    const htmlMuted = renderSidebar({ soundEnabled: false });
    expect(htmlMuted).toContain('Chimes Muted');
  });

  it('includes the System Color Selector exclusively in the sidebar', () => {
    const htmlLight = renderSidebar({ theme: 'light' });
    expect(htmlLight).toContain('aria-label="Toggle Color Theme"');
    expect(htmlLight).toContain('light Mode');

    const htmlDark = renderSidebar({ theme: 'dark' });
    expect(htmlDark).toContain('dark Mode');

    const htmlSystem = renderSidebar({ theme: 'system' });
    expect(htmlSystem).toContain('system Mode');
  });

  it('renders LanguagePicker in the sidebar footer', () => {
    const html = renderSidebar();
    expect(html).toContain('aria-label="Select language"');
  });

  it('renders login button when unauthenticated', () => {
    const html = renderSidebar({ auth: null });
    expect(html).toContain('Log In / Sign Up');
  });

  it('renders user profile button when authenticated', () => {
    const html = renderSidebar({
      auth: {
        username: 'test_pilot',
        apiKey: 'key_12345',
        email: 'pilot@example.com',
      },
    });
    expect(html).toContain('@test_pilot');
    expect(html).toContain('aria-label="Account menu"');
  });

  it('conditionally hides tutorial button if showTutorials is false', () => {
    const htmlWithTutorial = renderSidebar({ showTutorials: true });
    expect(htmlWithTutorial).toContain('aria-label="Guide and Tutorial"');

    const htmlWithoutTutorial = renderSidebar({ showTutorials: false });
    expect(htmlWithoutTutorial).not.toContain('aria-label="Guide and Tutorial"');
  });
});

describe('Requirement R1 Behavioral Wiring: Sidebar Action Triggers & Handlers', () => {
  const sidebarSource = fs.readFileSync(
    path.resolve(__dirname, '../src/client/components/Sidebar.tsx'),
    'utf-8'
  );

  it('attaches onOpenGoblin directly to the Goblin Brain button', () => {
    const goblinBtnMatch = sidebarSource.match(
      /<button[\s\S]*?aria-label="Goblin Brain Demolisher"[\s\S]*?>/i
    );
    expect(goblinBtnMatch).not.toBeNull();
    expect(goblinBtnMatch![0]).toContain('onClick={onOpenGoblin}');
  });

  it('attaches onOpenAgentApi directly to the Agent REST API button', () => {
    const agentBtnMatch = sidebarSource.match(
      /<button[\s\S]*?aria-label="Agent REST API"[\s\S]*?>/i
    );
    expect(agentBtnMatch).not.toBeNull();
    expect(agentBtnMatch![0]).toContain('onClick={onOpenAgentApi}');
  });

  it('attaches all required tool handlers to their respective buttons', () => {
    const tools = [
      { label: 'Pomodoro Focus Timer', handler: 'onClick={onOpenPomodoro}' },
      { label: 'Calendars and Ghosts', handler: 'onClick={onOpenCalendars}' },
      { label: 'Spotlight Single-Task Isolation', handler: 'onClick={onOpenSpotlight}' },
      { label: 'Brain Dump Offloader', handler: 'onClick={onOpenBrainDump}' },
      { label: 'Evening Daily Shutdown Ritual', handler: 'onClick={onOpenShutdown}' },
      { label: 'Toggle Audio Feedback', handler: 'onClick={onToggleSound}' },
      { label: 'Toggle Color Theme', handler: 'onClick={onCycleTheme}' },
    ];

    for (const tool of tools) {
      const match = sidebarSource.match(
        new RegExp(`<button[\\s\\S]*?aria-label="${tool.label}"[\\s\\S]*?>`, 'i')
      );
      expect(match, `Button with label "${tool.label}" should exist`).not.toBeNull();
      expect(match![0], `Button "${tool.label}" must have ${tool.handler}`).toContain(tool.handler);
    }
  });
});

describe('Sidebar Goblin Brain Navigation Integration', () => {
  it('invoking onOpenGoblin transitions state and renders a functional GoblinBrainModal', () => {
    let goblinModalOpen = false;
    let goblinTask: Task | null = null;

    // Simulated App.tsx handler
    const onOpenGoblin = () => {
      goblinTask = null;
      goblinModalOpen = true;
    };

    // Before click: modal is closed
    const initialHtml = renderToStaticMarkup(
      React.createElement(GoblinBrainModal, {
        isOpen: goblinModalOpen,
        onClose: () => {
          goblinModalOpen = false;
        },
        task: goblinTask,
        onApplySubtasks: vi.fn(),
      })
    );
    expect(initialHtml).toBe('');

    // Trigger onOpenGoblin from sidebar
    onOpenGoblin();
    expect(goblinModalOpen).toBe(true);

    // After click: modal MUST render non-empty HTML containing Goblin Brain dialog
    const openHtml = renderToStaticMarkup(
      React.createElement(GoblinBrainModal, {
        isOpen: goblinModalOpen,
        onClose: () => {
          goblinModalOpen = false;
        },
        task: goblinTask,
        onApplySubtasks: vi.fn(),
      })
    );

    expect(openHtml).not.toBe('');
    expect(openHtml).toContain('Goblin Brain');
    expect(openHtml).toContain('Wall of Awful');
  });
});
