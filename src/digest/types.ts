import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export type JobStatus = 'ok' | 'retry' | 'fail';

/** One row per job. Times keep the offset from the log. A null owner is shown as —. */
export type DigestRow = {
  job: string;
  owner: string | null;
  runs: number;
  retries: number;
  lastStatus: JobStatus;
  lastError: string | null;
  firstAt: string;
  lastAt: string;
};

export type NightDigest = {
  rows: DigestRow[];
  badLines: number;
};

type RawEvent = {
  at: string;
  job: string;
  status: JobStatus;
  owner: string | null;
  error?: string;
};

const STATUSES: ReadonlySet<string> = new Set(['ok', 'retry', 'fail']);

function asEvent(value: unknown): RawEvent | null {
  if (typeof value !== 'object' || value === null) return null;
  const row = value as Record<string, unknown>;
  if (typeof row.at !== 'string' || typeof row.job !== 'string') return null;
  if (typeof row.status !== 'string' || !STATUSES.has(row.status)) return null;
  if (row.owner !== null && typeof row.owner !== 'string') return null;
  if (row.error !== undefined && typeof row.error !== 'string') return null;
  return {
    at: row.at,
    job: row.job,
    status: row.status as JobStatus,
    owner: row.owner,
    error: row.error,
  };
}

/** Null when `runs/<night>.jsonl` is not on disk. An empty file is a digest with no rows. */
export function readNight(runsDir: string, night: string): NightDigest | null {
  const path = join(runsDir, `${night}.jsonl`);
  if (!existsSync(path)) return null;

  const text = readFileSync(path, 'utf8');
  if (text.trim() === '') return { rows: [], badLines: 0 };

  const grouped = new Map<string, RawEvent[]>();
  let badLines = 0;

  for (const line of text.split('\n')) {
    if (line.trim() === '') continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(line);
    } catch {
      badLines += 1;
      continue;
    }
    const event = asEvent(parsed);
    if (!event) {
      badLines += 1;
      continue;
    }
    const events = grouped.get(event.job);
    if (events) events.push(event);
    else grouped.set(event.job, [event]);
  }

  const rows: DigestRow[] = [...grouped.values()].map((events) => {
    const last = events[events.length - 1];
    const first = events[0];
    return {
      job: last.job,
      owner: last.owner,
      runs: events.length,
      retries: events.filter((event) => event.status === 'retry').length,
      lastStatus: last.status,
      lastError: last.error ?? null,
      firstAt: first.at,
      lastAt: last.at,
    };
  });

  rows.sort((a, b) => a.job.localeCompare(b.job));
  return { rows, badLines };
}
