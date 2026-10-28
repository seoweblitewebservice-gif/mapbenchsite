/** Optional verification against Google's Apache-2.0 OLC test_data/encoding.csv.
 * Supply the downloaded upstream CSV path; it is not bundled in this repository.
 */
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { encodePlusCode } from '../src/lib/coords';
const path = process.argv[2];
assert(path, 'Supply upstream encoding.csv path');
let checked = 0;
for (const line of readFileSync(path, 'utf8').split('\n')) {
  if (!line.trim() || line.startsWith('#')) continue;
  const fields = line.split(',').map(s => s.trim());
  const [lat, lng] = fields.map(Number);
  const length = Number(fields[4]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || length > 15) continue;
  assert.equal(encodePlusCode(lat, lng, length), fields[5], line);
  checked++;
}
console.log(`PASS: ${checked} upstream encoding vectors within supported input range.`);
