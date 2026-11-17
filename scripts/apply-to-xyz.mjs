#!/usr/bin/env node
// Add Tournament Tuesdays to an EXISTING XY&Z Netlify site source tree.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const base=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const destination=path.resolve(process.argv[2]||process.cwd());
const candidate=path.join(destination,'public','index.html');
const pub=fs.existsSync(candidate)?path.join(destination,'public'):destination;
const homepage=path.join(pub,'index.html');
const addon=path.join(base,'overlay');
if(!fs.existsSync(homepage))throw new Error('Existing XY&Z index.html was not found. Specify its source folder.');
const before=fs.readFileSync(homepage,'utf8');
if(!before.includes('XY&amp;Z Productions')&&!before.includes('XY&Z Productions'))throw new Error('This does not appear to be the XY&Z site. Nothing changed.');
const marker='<a href="/island-vibes/live" data-link>Live Board</a>';
const nav='<a href="/island-vibes/tournaments/" class="tournaments-link">🏆 Tournament Tuesdays</a>';
if(!before.includes('href="/island-vibes/tournaments/"')&&!before.includes(marker))throw new Error('Island Vibes menu changed. Nothing changed.');
const files=[
  [path.join(addon,'public','island-vibes','tournaments'),path.join(pub,'island-vibes','tournaments')],
  [path.join(addon,'netlify','tournaments'),path.join(destination,'netlify','tournaments')],
  [path.join(addon,'netlify','functions','iv-tournaments.mjs'),path.join(destination,'netlify','functions','iv-tournaments.mjs')],
  [path.join(addon,'netlify','functions','iv-tournament-rewards.mjs'),path.join(destination,'netlify','functions','iv-tournament-rewards.mjs')],
  [path.join(addon,'netlify','database','migrations','20261112154500_add_island_vibes_tournaments.sql'),path.join(destination,'netlify','database','migrations','20261112154500_add_island_vibes_tournaments.sql')]
];
for(const [from] of files)if(!fs.existsSync(from))throw new Error('Missing integration asset: '+from);
const packagePath=path.join(destination,'package.json');
const pkg=fs.existsSync(packagePath)?JSON.parse(fs.readFileSync(packagePath,'utf8')):{name:'xyandz-site',private:true,version:'1.0.0'};
pkg.dependencies={...pkg.dependencies,'@netlify/database':'^2.0.3'};
function copy(from,to){
 if(fs.statSync(from).isDirectory()){
  fs.mkdirSync(to,{recursive:true});
  for(const name of fs.readdirSync(from))copy(path.join(from,name),path.join(to,name));
 }else{
  fs.mkdirSync(path.dirname(to),{recursive:true});
  fs.copyFileSync(from,to);
 }
}
const backups=path.join(destination,'.xyz-tournaments-backup');
fs.mkdirSync(backups,{recursive:true});
fs.writeFileSync(path.join(backups,'index.html'),before);
if(fs.existsSync(packagePath))fs.copyFileSync(packagePath,path.join(backups,'package.json'));
for(const [from,to] of files)copy(from,to);
fs.writeFileSync(packagePath,JSON.stringify(pkg,null,2)+'\n');
fs.writeFileSync(homepage,before.includes('href="/island-vibes/tournaments/"')?before:before.replace(marker,marker+'\n          '+nav));
console.log('✓ Added Tournament Tuesdays link to the Island Vibes menu');
console.log('✓ Isolated tournament page /island-vibes/tournaments/');
console.log('✓ Server-side shared registration, bracket, score, private rewards backend included');
console.log('✓ Added isolated database migration (no bingo/trivia tables modified)');
console.log('✓ Existing index and package backed up under .xyz-tournaments-backup');
console.log('Next: npm install in '+destination+'; deploy the original Netlify project.');
console.log('Set TOURNAMENT_HOST_CODE in Netlify environment variables.');

