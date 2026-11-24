import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import type { RigConfig } from '../src/config.js';

const installed = '2026-10-29T14:06:00+01:00';

function appAt(runsDir: string) {
  const config: RigConfig = { adapter: 'shim', installed, beatEverySeconds: 60, runsDir };
  return createApp(config);
}

function tempRuns(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), 'rig-routes-'));
  for (const [name, body] of Object.entries(files)) writeFileSync(join(dir, name), body);
  return dir;
}

const okLine =
  '{"at":"2026-10-28T23:00:02+01:00","job":"rig/rotate-logs","status":"ok","owner":"lane-07"}\n';

describe('digest routes', () => {
  it('renders /digest/2026-10-28 and returns the same jobs in the same order as JSON', async () => {
    process.env.LANE_MARKER = 'TEST-MARKER';
    const app = appAt('runs');
    const page = await app.request('/digest/2026-10-28');
    const html = await page.text();
    expect(page.status).toBe(200);
    expect(html).toContain('TEST-MARKER');
    expect(html).toContain('class="warn"');
    expect(html).not.toContain('nothing ran');

    const jobs = ['digest/render', 'fixtures/refresh', 'lane/sync', 'notes/backup', 'rig/rotate-logs'];
    let at = -1;
    for (const job of jobs) {
      const next = html.indexOf(job);
      expect(next).toBeGreaterThan(at);
      at = next;
    }

    const api = await app.request('/api/digest/2026-10-28');
    expect(api.status).toBe(200);
    const body = (await api.json()) as { rows: { job: string }[] };
    expect(body.rows.map((row) => row.job)).toEqual(jobs);
  });

  it('returns 404 when the night file is missing', async () => {
    const app = appAt(tempRuns({}));
    expect((await app.request('/digest/2026-10-28')).status).toBe(404);
    expect((await app.request('/api/digest/2026-10-28')).status).toBe(404);
  });

  it('renders nothing ran for an empty night', async () => {
    const app = appAt(tempRuns({ '2026-10-28.jsonl': '' }));
    const page = await app.request('/digest/2026-10-28');
    expect(page.status).toBe(200);
    expect(await page.text()).toContain('nothing ran');
    const api = await app.request('/api/digest/2026-10-28');
    expect(api.status).toBe(200);
    expect(await api.json()).toEqual({ rows: [], badLines: 0, counts: { ok: 0, retry: 0, fail: 0 } });
  });

  it('renders a night that contains a bad line', async () => {
    const app = appAt(tempRuns({ '2026-10-28.jsonl': `${okLine}{"job":\n` }));
    const page = await app.request('/digest/2026-10-28');
    expect(page.status).toBe(200);
    expect(await page.text()).toContain('rig/rotate-logs');
    const api = await app.request('/api/digest/2026-10-28');
    const body = (await api.json()) as { badLines: number; rows: unknown[] };
    expect(body.badLines).toBe(1);
    expect(body.rows).toHaveLength(1);
  });

  it('follows both night links to a digest that renders', async () => {
    const app = appAt('runs');
    for (const night of ['2026-10-27', '2026-10-28']) {
      const page = await app.request(`/digest/${night}`);
      expect(page.status).toBe(200);
      expect(await page.text()).toContain('<table>');
    }
  });
});
