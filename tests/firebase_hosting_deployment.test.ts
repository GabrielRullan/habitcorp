import { describe, it, expect, vi, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { fetchJson } from '../src/client/apiHelper';
import { I18nProvider } from '../src/client/i18n/I18nContext';
import { App } from '../src/client/App';
import { TaskModal } from '../src/client/components/TaskModal';

const ROOT_DIR = path.resolve(__dirname, '..');

describe('Firebase Hosting & habits.balears.tech Deployment Verification', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Firebase & GitHub Actions Configuration Integrity', () => {
    it('configures .firebaserc with habitcorp-app default project', () => {
      const firebasercPath = path.join(ROOT_DIR, '.firebaserc');
      expect(fs.existsSync(firebasercPath)).toBe(true);
      const rc = JSON.parse(fs.readFileSync(firebasercPath, 'utf8'));
      expect(rc?.projects?.default).toBe('habitcorp-app');
    });

    it('configures firebase.json to serve dist/client with SPA index.html rewrite', () => {
      const firebaseJsonPath = path.join(ROOT_DIR, 'firebase.json');
      expect(fs.existsSync(firebaseJsonPath)).toBe(true);
      const config = JSON.parse(fs.readFileSync(firebaseJsonPath, 'utf8'));
      expect(config?.hosting?.public).toBe('dist/client');
      expect(config?.hosting?.rewrites).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            source: '**',
            destination: '/index.html',
          }),
        ])
      );
    });

    it('includes GitHub Actions workflows for PR previews and main branch live deploys', () => {
      const mergeWorkflowPath = path.join(ROOT_DIR, '.github', 'workflows', 'firebase-hosting-merge.yml');
      const prWorkflowPath = path.join(ROOT_DIR, '.github', 'workflows', 'firebase-hosting-pull-request.yml');

      expect(fs.existsSync(mergeWorkflowPath)).toBe(true);
      expect(fs.existsSync(prWorkflowPath)).toBe(true);

      const mergeYml = fs.readFileSync(mergeWorkflowPath, 'utf8');
      const prYml = fs.readFileSync(prWorkflowPath, 'utf8');

      expect(mergeYml).toContain('npm ci && npm run build');
      expect(mergeYml).toContain('FirebaseExtended/action-hosting-deploy@v0');
      expect(mergeYml).toContain('FIREBASE_SERVICE_ACCOUNT_HABITCORP_APP');
      expect(mergeYml).toContain('channelId: live');
      expect(mergeYml).toContain('projectId: habitcorp-app');

      expect(prYml).toContain('npm ci && npm run build');
      expect(prYml).toContain('FirebaseExtended/action-hosting-deploy@v0');
      expect(prYml).toContain('FIREBASE_SERVICE_ACCOUNT_HABITCORP_APP');
      expect(prYml).toContain('projectId: habitcorp-app');
    });
  });

  describe('2. Static CDN SPA Rewrite Fallback (Simulated Firebase Hosting)', () => {
    it('falls back to clientStore when Firebase Hosting returns index.html for /api/v1/* routes', async () => {
      const store = new Map<string, string>();
      vi.stubGlobal('localStorage', {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => store.set(k, v),
        removeItem: (k: string) => store.delete(k),
        clear: () => store.clear(),
      });

      const spaHtml = '<!doctype html><html lang="en"><head><title>HabitCorp</title></head><body><div id="root"></div></body></html>';

      vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
        return new Response(spaHtml, {
          status: 200,
          headers: { 'content-type': 'text/html; charset=utf-8' },
        });
      });

      // Default user auth should resolve via clientStore instead of throwing JSON SyntaxError
      const defaultUser = await fetchJson('/api/v1/auth/default-user');
      expect(defaultUser).toBeDefined();
      expect(defaultUser.username).toBe('gabriel');
      expect(defaultUser.apiKey).toBeTruthy();

      // Tasks list should resolve via clientStore
      const tasksRes = await fetchJson('/api/v1/tasks', {
        headers: { 'X-API-Key': defaultUser.apiKey },
      });
      expect(Array.isArray(tasksRes.tasks)).toBe(true);

      // Creating a task on static hosting should persist in clientStore
      const created = await fetchJson('/api/v1/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': defaultUser.apiKey,
        },
        body: JSON.stringify({
          title: 'Static Hosting Verification Task',
          type: 'todo',
          difficulty: 'easy',
        }),
      });
      expect(created.id).toBeTruthy();
      expect(created.title).toBe('Static Hosting Verification Task');

      // Toggling completion via /score should work seamlessly
      const toggled = await fetchJson(`/api/v1/tasks/${created.id}/score`, {
        method: 'POST',
        headers: { 'X-API-Key': defaultUser.apiKey },
      });
      expect(toggled.completed).toBe(1);
    });

    it('ensures no client UI component calls raw fetch() on /api/v1/* bypassing fetchJson', () => {
      const clientDir = path.join(ROOT_DIR, 'src', 'client');
      const walk = (dir: string): string[] => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        return entries.flatMap((e) => {
          const full = path.join(dir, e.name);
          return e.isDirectory() ? walk(full) : full.endsWith('.ts') || full.endsWith('.tsx') ? [full] : [];
        });
      };

      const files = walk(clientDir);
      for (const file of files) {
        if (path.basename(file) === 'apiHelper.ts') continue;
        const content = fs.readFileSync(file, 'utf8');
        expect(content).not.toMatch(/\bfetch\(\s*['"`]\/api\/v1\//);
      }
    });

    it('renders the full <App /> tree and open <TaskModal /> without runtime ReferenceErrors', () => {
      const appHtml = renderToString(
        React.createElement(I18nProvider, null, React.createElement(App))
      );
      expect(appHtml.length).toBeGreaterThan(1000);
      expect(appHtml).toContain('HabitCorp');

      const modalHtml = renderToString(
        React.createElement(
          I18nProvider,
          null,
          React.createElement(TaskModal, {
            isOpen: true,
            onClose: () => {},
            onSave: async () => {},
          })
        )
      );
      expect(modalHtml.length).toBeGreaterThan(500);
    });
  });

  describe('3. Live Production Endpoint Verification (habits.balears.tech & habitcorp-app.web.app)', () => {
    const LIVE_URLS = [
      'https://habits.balears.tech',
      'https://habitcorp-app.web.app',
    ];

    for (const baseUrl of LIVE_URLS) {
      it(`serves the HabitCorp SPA index and compiled assets on ${baseUrl}`, async () => {
        const res = await fetch(baseUrl);
        expect(res.status).toBe(200);
        expect(res.headers.get('content-type')).toContain('text/html');

        const html = await res.text();
        expect(html).toContain('<title>HabitCorp');
        expect(html).toContain('<div id="root"></div>');

        // Extract JS and CSS bundle paths from the live HTML and verify they return 200 OK
        const jsMatch = html.match(/src="(\/assets\/index-[^"]+\.js)"/);
        const cssMatch = html.match(/href="(\/assets\/index-[^"]+\.css)"/);
        expect(jsMatch?.[1]).toBeTruthy();
        expect(cssMatch?.[1]).toBeTruthy();

        const [jsRes, cssRes, rewriteRes] = await Promise.all([
          fetch(`${baseUrl}${jsMatch![1]}`),
          fetch(`${baseUrl}${cssMatch![1]}`),
          fetch(`${baseUrl}/api/v1/health`),
        ]);

        expect(jsRes.status).toBe(200);
        expect(jsRes.headers.get('content-type')).toMatch(/javascript/);

        expect(cssRes.status).toBe(200);
        expect(cssRes.headers.get('content-type')).toContain('text/css');

        // Verify SPA fallback rewrite works on unknown /api/v1/* paths (returns 200 text/html for fetchJson to intercept)
        expect(rewriteRes.status).toBe(200);
        expect(rewriteRes.headers.get('content-type')).toContain('text/html');
      }, 15000);
    }
  });
});
