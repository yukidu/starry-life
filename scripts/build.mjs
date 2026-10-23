import fs from 'node:fs';import path from 'node:path';
const files=['index.html','src/app.mjs','src/numerology.mjs','src/content.mjs','src/styles.css','public/sw.js','public/icon.svg','public/manifest.webmanifest'];
fs.rmSync('dist',{recursive:true,force:true});fs.mkdirSync('dist/src',{recursive:true});
for(const f of files){const output=f.startsWith('public/')?f.slice(7):f;fs.mkdirSync(path.join('dist',path.dirname(output)),{recursive:true});fs.copyFileSync(f,path.join('dist',output));}
console.log(`Generated dist/ with ${files.length} static files`);
