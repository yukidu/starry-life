import {readFileSync,writeFileSync,mkdirSync,readdirSync} from 'node:fs';
import {relative,join} from 'node:path';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
const root=new URL('../dist/',import.meta.url).pathname;
const out=new URL('../.deploy/',import.meta.url).pathname;
function walk(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(d=>d.isDirectory()?walk(join(dir,d.name)):[join(dir,d.name)]);}
const files=walk(root);
const entries=files.map(path=>{const rel='/'+relative(root,path).replaceAll('\\','/');const raw=readFileSync(path);return [rel,gzipSync(raw,{level:9,mtime:0}).toString('base64')];});
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
const worker=`// Generated from ./dist by scripts/generate-worker.mjs. Do not edit manually.\nconst bundles = new Map(${JSON.stringify(entries)});\nconst cache = new Map();\nfunction b64bytes(str) { return Uint8Array.from(atob(str),c=>c.charCodeAt(0)); }\nasync function asset(path) {\n if(cache.has(path)) return cache.get(path);\n const raw=b64bytes(bundles.get(path));\n const bytes=await new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();\n cache.set(path,bytes);\n return bytes;\n}\nexport default {\n async fetch(request) {\n  if(request.method!=='GET' && request.method!=='HEAD') return new Response('Method Not Allowed',{status:405,headers:{'Allow':'GET, HEAD'}});\n  const url=new URL(request.url);\n  const path=url.pathname==='/'?'/index.html':url.pathname;\n  if(!bundles.has(path)) return new Response('Not Found',{status:404,headers:{'X-Content-Type-Options':'nosniff'}});\n  const extension=path.slice(path.lastIndexOf('.'));\n  const mime=${JSON.stringify(mime)};\n  const immutable=path.endsWith('.svg');\n  const headers={'Content-Type':mime[extension]||'application/octet-stream',\n   'Cache-Control':immutable?'public, max-age=86400':'no-cache',\n   'X-Content-Type-Options':'nosniff',\n   'Referrer-Policy':'strict-origin-when-cross-origin',\n   'X-Frame-Options':'DENY',\n   'Permissions-Policy':'camera=(), microphone=(), geolocation=()',\n   'Content-Security-Policy':\"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'\"};\n  const bytes=await asset(path);\n  return new Response(request.method==='HEAD'?null:bytes,{status:200,headers});\n }\n};\n`;
mkdirSync(out,{recursive:true});
writeFileSync(join(out,'worker.mjs'),worker);
const digest=createHash('sha256').update(worker).digest('hex');
writeFileSync(join(out,'RELEASE.json'),JSON.stringify({worker:'life-starry',sha256:digest,assetCount:files.length,assets:entries.map(([p,b])=>({path:p,gzipBase64Bytes:b.length}))},null,2));
console.log(JSON.stringify({sha256:digest,scriptBytes:Buffer.byteLength(worker),assetCount:files.length},null,2));
