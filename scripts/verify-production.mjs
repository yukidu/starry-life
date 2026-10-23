// Read-only post-deploy verification: all live assets must match local built files.
// Works for future releases without hard-coding a UI version marker.
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join,relative} from 'node:path';

const base=(process.env.STARRY_VERIFY_URL||'https://life.starry.phd').replace(/\/$/,'');
const root='dist';
function walk(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(join(dir,e.name)):[join(dir,e.name)]);}
const assets=walk(root).map(file=>({path:'/'+relative(root,file).replaceAll('\\','/'),bytes:readFileSync(file)}));
assets.push({path:'/',bytes:readFileSync(join(root,'index.html'))});
const digest=b=>createHash('sha256').update(b).digest('hex');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
if(assets.length<9)throw Error('Missing build files; run npm run build first');

for(let attempt=1;attempt<=8;attempt++){
  const failures=[];
  for(const {path,bytes} of assets){
    const expected=digest(bytes);
    try{
      const response=await fetch(base+path+'?release_check='+expected.slice(0,16),{
        headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(12000)
      });
      if(!response.ok){failures.push(`${path}: HTTP ${response.status}`);continue;}
      const received=Buffer.from(await response.arrayBuffer());
      if(digest(received)!==expected) failures.push(`${path}: response differs from approved build`);
      if(path==='/'&&!response.headers.get('content-type')?.includes('text/html'))
        failures.push('/: unexpected Content-Type');
    }catch(error){failures.push(`${path}: ${error.message}`);}
  }
  if(failures.length===0){console.log(`PASS production: all ${assets.length} paths match GitHub build (${attempt}/8)`);process.exit(0);}
  console.log(`Verification ${attempt}/8: ${failures.join('; ')}`);
  if(attempt<8)await sleep(3000);
}
throw Error('Production differs from the approved build. Check Cloudflare Deployments and revert to the last verified Worker Version if needed.');
