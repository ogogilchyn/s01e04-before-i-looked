import type { NightDigest } from '../digest/types.js';

function marked(row: NightDigest['rows'][number]): boolean {
  return row.retries >= 3 || row.lastStatus === 'fail';
}

function cell(value: string | number | null): string | number {
  return value === null || value === '' ? '—' : value;
}

export function DigestPage({ digest }: { digest: NightDigest }) {
  if (digest.rows.length === 0) return <p>nothing ran</p>;

  return (
    <table>
      <thead>
        <tr>
          <th>job</th>
          <th>owner</th>
          <th>runs</th>
          <th>retries</th>
          <th>last status</th>
          <th>last error</th>
          <th>first</th>
          <th>last</th>
        </tr>
      </thead>
      <tbody>
        {digest.rows.map((row) => (
          <tr class={marked(row) ? 'warn' : undefined}>
            <td>{row.job}</td>
            <td>{cell(row.owner)}</td>
            <td>{row.runs}</td>
            <td>{row.retries}</td>
            <td>{row.lastStatus}</td>
            <td>{cell(row.lastError)}</td>
            <td>{row.firstAt}</td>
            <td>{row.lastAt}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
