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

/** Null when `runs/<night>.jsonl` is not on disk. An empty file is a digest with no rows. */
export function readNight(runsDir: string, night: string): NightDigest | null {
  void runsDir;
  void night;
  throw new Error('readNight is not implemented');
}
