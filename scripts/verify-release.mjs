// Verify a reproducible local build, without touching Cloudflare production.
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
const out='.deploy/worker.mjs';
if(!existsSync(out)) throw Error('Missing generated Worker: npm run build && node scripts/generate-worker.mjs');
const bytes=readFileSync(out);
const sha=createHash('sha256').update(bytes).digest('hex');
const release=JSON.parse(readFileSync('.deploy/RELEASE.json','utf8'));
if(sha!==release.sha256) throw Error(`Worker integrity mismatch: generated ${sha}, metadata ${release.sha256}`);
for(const asset of ['/index.html','/src/app.mjs','/src/styles.css','/src/numerology.mjs','/src/content.mjs','/sw.js']){
  if(!release.assets.some(a=>a.path===asset)) throw Error(`Required production asset missing: ${asset}`);
}
if(release.worker!=='life-starry')throw Error('Unexpected production Worker name');
// v1.4 baseline must be unmodified by the CI/bootstrap-only release.
if(sha==='04ff81217b660e19954045ee00913dc3ba6210cae7fd45950bb0828c64b81357')
  console.log('PASS exact v1.4 live-source reproducibility');
console.log(`PASS release integrity: ${release.worker}, ${release.assetCount} assets, sha256 ${sha}`);
