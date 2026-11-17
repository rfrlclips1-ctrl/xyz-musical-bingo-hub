import {generate} from './engine.mjs';

/*
  Island Vibes Tournament Hub — Cloudflare Workers + D1.
  Preserves the existing browser app's /api and /api/rewards contract.
  One shared D1 roster. Private rewards NEVER included in public API.
  No Blob, Firebase, cron, or paid third-party service.
*/
const DEFAULT={
 id:'madden-2026-11-24',name:'Tournament Tuesdays: Madden',game:'Madden NFL',
 date:'2026-11-24',time:'20:00',venue:'Island Vibes Kava Bar',prize:'Bar tabs',
 format:'single-elimination',seeding:'registration',swissRounds:4
};
const FORMATS={'single-elimination':128,'double-elimination':128,'round-robin':32,'swiss':128,'groups-playoffs':64};
const MAX_EVENTS=100;
const now=()=>new Date().toISOString();
const clean=(v,n=80)=>String(v??'').trim().replace(/\s+/g,' ').slice(0,n);
const norm=v=>clean(v,60).toLocaleLowerCase('en-US');
const validLast4=v=>v===''||/^[0-9]{4}$/.test(v);
const err=(msg,code=400)=>Object.assign(new Error(msg),{status:code});
const j=(body,status=200,headers={})=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff',...headers}});
const p=(db,sql,...args)=>db.prepare(sql).bind(...args);
const jsonParse=(v,fallback)=>{try{return JSON.parse(v)}catch{return fallback}};
const id=()=>crypto.randomUUID();
function validSettings(o,n){
 const format=o.format||'single-elimination',swissRounds=Number(o.swissRounds||4);
 if(!FORMATS[format])throw err('Unknown tournament format.');
 if(n>FORMATS[format])throw err('This format supports up to '+FORMATS[format]+' players.');
 if(format==='groups-playoffs'&&n<4)throw err('Groups + playoffs needs at least four checked-in players.');
 if(!Number.isInteger(swissRounds)||swissRounds<1||swissRounds>8)throw err('Swiss rounds must be between 1 and 8.');
 return {format,seeding:o.seeding==='random'?'random':o.seeding==='keep'?'keep':'registration',swissRounds};
}
function hostAuthorized(request,env){
 const expected=String(env.HOST_CODE||''),actual=String(request.headers.get('x-host-code')||'');
 if(expected.length<8||actual.length!==expected.length)return false;
 let diff=0;
 for(let i=0;i<actual.length;i++)diff|=actual.charCodeAt(i)^expected.charCodeAt(i);
 return diff===0;
}
function requireHost(request,env){if(!hostAuthorized(request,env))throw err('Host authorization required.',403);}
async function initialize(db){
 const row=await p(db,'SELECT id FROM iv_tourney_events LIMIT 1').first();
 if(row)return;
 const t=now();
 await p(db,'INSERT OR IGNORE INTO iv_tourney_events(id,name,game,date,time,venue,prize,format,seeding,swiss_rounds,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',
  DEFAULT.id,DEFAULT.name,DEFAULT.game,DEFAULT.date,DEFAULT.time,DEFAULT.venue,DEFAULT.prize,
  DEFAULT.format,DEFAULT.seeding,DEFAULT.swissRounds,t,t).run();
}
function eventFrom(row,players=[],scores=[]){
 const obj={
  id:row.id,name:row.name,game:row.game,date:row.date,time:row.time,venue:row.venue,prize:row.prize,
  format:row.format,seeding:row.seeding,swissRounds:row.swiss_rounds,
  started:!!row.started,paused:!!row.paused,locked:!!row.locked,
  seeds:jsonParse(row.seeds_json,[]),archives:jsonParse(row.archives_json,[]),
  createdAt:row.created_at,updatedAt:row.updated_at,
  players:players.map(x=>({id:x.id,name:x.name,source:x.source,verified:!!x.verified,removed:!!x.removed,joinedAt:x.joined_at})),
  order:players.filter(x=>!x.removed).slice().sort((a,b)=>a.sort_order-b.sort_order).map(x=>x.id),
  scores:Object.fromEntries(scores.map(s=>[s.match_id,{aId:s.a_id,bId:s.b_id,a:s.a,b:s.b}]))
 };
 obj.count=obj.players.filter(x=>!x.removed).length;
 obj.eligible=obj.players.filter(x=>!x.removed&&x.verified).length;
 obj.bracket=generate(obj);
 obj.finished=!!obj.bracket.complete;
 obj.winner=obj.players.find(x=>x.id===obj.bracket.champion)?.name||null;
 return obj;
}
async function loadEvent(db,eventId){
 const event=await p(db,'SELECT * FROM iv_tourney_events WHERE id=?',eventId).first();
 if(!event)throw err('Tournament not found.',404);
 const [players,scores]=await db.batch([
  p(db,'SELECT * FROM iv_tourney_players WHERE event_id=? ORDER BY sort_order,joined_at',eventId),
  p(db,'SELECT * FROM iv_tourney_scores WHERE event_id=?',eventId)
 ]);
 return eventFrom(event,players.results||[],scores.results||[]);
}
function scoreboard(events){
 const all=new Map();
 for(const e of events){
  const matches=e.bracket.rounds.flatMap(r=>r.matches);
  for(const player of e.players.filter(x=>!x.removed)){
   const key=norm(player.name);
   if(!all.has(key))all.set(key,{name:player.name,events:0,wins:0,losses:0,titles:0,points:0,against:0});
   const row=all.get(key);
   if(e.started&&e.seeds.includes(player.id))row.events++;
   if(e.bracket.champion===player.id)row.titles++;
  }
  for(const match of matches){
   if(match.status!=='complete')continue;
   for(const [playerId,forScore,againstScore] of [[match.aId,match.scoreA,match.scoreB],[match.bId,match.scoreB,match.scoreA]]){
    const player=e.players.find(x=>x.id===playerId);if(!player)continue;
    const row=all.get(norm(player.name));if(!row)continue;
    row.points+=forScore;row.against+=againstScore;
    if(match.winnerId===playerId)row.wins++;else row.losses++;
   }
  }
 }
 return [...all.values()].filter(x=>x.events||x.wins||x.titles).sort((a,b)=>b.titles-a.titles||b.wins-a.wins||b.points-a.points||a.name.localeCompare(b.name));
}
async function publicState(db){
 await initialize(db);
 const eventsResult=await p(db,'SELECT * FROM iv_tourney_events ORDER BY date DESC, created_at DESC LIMIT ?',MAX_EVENTS).all();
 const rows=eventsResult.results||[];
 if(!rows.length)return {events:[],leaderboard:[]};
 const placeholders=rows.map(()=>'?').join(',');
 const evIds=rows.map(x=>x.id);
 const [players,scores]=await db.batch([
  p(db,'SELECT * FROM iv_tourney_players WHERE event_id IN ('+placeholders+') ORDER BY sort_order,joined_at',...evIds),
  p(db,'SELECT * FROM iv_tourney_scores WHERE event_id IN ('+placeholders+')',...evIds)
 ]);
 const byEvent=new Map(),byScores=new Map();
 for(const x of players.results||[]){if(!byEvent.has(x.event_id))byEvent.set(x.event_id,[]);byEvent.get(x.event_id).push(x);}
 for(const x of scores.results||[]){if(!byScores.has(x.event_id))byScores.set(x.event_id,[]);byScores.get(x.event_id).push(x);}
 const events=rows.map(x=>eventFrom(x,byEvent.get(x.id)||[],byScores.get(x.id)||[]));
 return {events,leaderboard:scoreboard(events)};
}
function pruneScores(e){
 // Drop saved results whose participants have changed after a score correction.
 let changed=true;
 for(let i=0;i<25&&changed;i++){
  changed=false;const matches=new Map(generate(e).rounds.flatMap(r=>r.matches).map(m=>[m.id,m]));
  for(const [key,val] of Object.entries(e.scores)){
   const m=matches.get(key);
   if(!m||m.aId!==val.aId||m.bId!==val.bId){
    delete e.scores[key];changed=true;
   }
  }
 }
}
function archive(e,reason){
 if(!e.started||!e.seeds.length)return e.archives;
 return [...e.archives,{
  id:id(),at:now(),reason,format:e.format,completed:e.bracket.completed||0,
  champion:e.winner,bracket:e.bracket,seeds:e.seeds.slice()
 }].slice(-15);
}
function seedsFor(e,mode){
 const active=e.order.filter(x=>e.players.find(p=>p.id===x&&p.verified&&!p.removed));
 if(mode==='keep'&&e.started)return e.seeds.filter(x=>active.includes(x)).concat(active.filter(x=>!e.seeds.includes(x)));
 if(mode==='random'){for(let k=active.length-1;k>0;k--){const t=Math.floor(Math.random()*(k+1));[active[k],active[t]]=[active[t],active[k]];}}
 return active;
}
async function takeRateSlot(db,request,eventId){
 const ip=clean(request.headers.get('X-NF-CLIENT-CONNECTION-IP')||request.headers.get('CF-Connecting-IP')||request.headers.get('X-Forwarded-For')||'unknown',95);
 const minute=Math.floor(Date.now()/60000),day=Math.floor(Date.now()/86400000);
 // Store only a nonreversible hash of the source IP; never save IP or phone number.
 const hash=async value=>{
  const payload=new TextEncoder().encode(value);
  const digest=await crypto.subtle.digest('SHA-256',payload);
  return [...new Uint8Array(digest)].slice(0,12).map(n=>n.toString(16).padStart(2,'0')).join('');
 };
 const t=Math.floor(Date.now()/1000);
 for(const [prefix,windowKey,expiration,max] of [['minute',minute,t+120,45],['day',day,t+90000,150]]){
  const key=prefix+':'+windowKey+':'+eventId+':'+await hash(ip+':'+eventId+':'+windowKey);
  await p(db,'INSERT INTO iv_tourney_request_limits(id,counter,expires_at) VALUES(?,1,?) ON CONFLICT(id) DO UPDATE SET counter=iv_tourney_request_limits.counter+1',key,expiration).run();
  const row=await p(db,'SELECT counter FROM iv_tourney_request_limits WHERE id=?',key).first();
  if((row?.counter||0)>max)throw err('Too many registrations from this device. Ask the host for help.',429);
 }
 // Opportunistic cleanup once every 200 calls, not on each request.
 if(Math.random()<0.005)await p(db,'DELETE FROM iv_tourney_request_limits WHERE expires_at<?',t).run();
}
function isConstraint(e){return /UNIQUE constraint failed|duplicate key value/i.test(String(e?.message||''))||e?.code==='23505';}
function signupFields(b){
 const name=clean(b.name,50),rewardsName=clean(b.rewardsName,60),last4=clean(b.last4,12);
 if(name.length<2)throw err('Please enter a name or gamer tag (at least 2 characters).');
 if(!validLast4(last4))throw err('The last four phone digits must be exactly four numbers.');
 return {name,rewardsName,last4};
}
async function register(db,request,data){
 if(clean(data.website))return {ok:true};
 const eventId=clean(data.eventId,100),values=signupFields(data);
 const e=await loadEvent(db,eventId);
 if(e.started||e.locked)throw err('Registration is closed for this tournament.',409);
 if(e.count>=128)throw err('This tournament has reached the registration limit.',409);
 await takeRateSlot(db,request,eventId);
 const pid=id(),t=now(),order=e.order.length?e.order.length:0;
 const actions=[p(db,'INSERT INTO iv_tourney_players(id,event_id,name,name_key,source,sort_order,joined_at) VALUES(?,?,?,?,?,?,?)',
    pid,eventId,values.name,norm(values.name),'online',order,t)];
 if(values.rewardsName||values.last4)actions.push(p(db,'INSERT INTO iv_tourney_private_rewards(event_id,player_id,rewards_name,last4,updated_at) VALUES(?,?,?,?,?)',
    eventId,pid,values.rewardsName,values.last4,t));
 try{await db.batch(actions);}
 catch(e){if(isConstraint(e))throw err('That gamer tag is already registered.',409);throw e;}
 return {ok:true,playerId:pid};
}
async function privateList(db,eventId){
 const rows=await p(db,'SELECT pr.player_id,pl.name,pr.rewards_name,pr.last4,pr.updated_at FROM iv_tourney_private_rewards pr JOIN iv_tourney_players pl ON pl.id=pr.player_id WHERE pr.event_id=? ORDER BY pr.updated_at DESC',eventId).all();
 return {players:(rows.results||[]).map(x=>({playerId:x.player_id,name:x.name,rewardsName:x.rewards_name,last4:x.last4,updatedAt:x.updated_at}))};
}
async function savePrivate(db,b){
 const eventId=clean(b.eventId,100),playerId=clean(b.playerId,80);
 const rewardsName=clean(b.rewardsName,60),last4=clean(b.last4,12);
 if(!validLast4(last4))throw err('Last 4 must contain exactly four digits.');
 const player=await p(db,'SELECT id FROM iv_tourney_players WHERE id=? AND event_id=? AND removed=0',playerId,eventId).first();
 if(!player)throw err('Player not found.',404);
 await p(db,'INSERT INTO iv_tourney_private_rewards(event_id,player_id,rewards_name,last4,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(event_id,player_id) DO UPDATE SET rewards_name=excluded.rewards_name,last4=excluded.last4,updated_at=excluded.updated_at',
  eventId,playerId,rewardsName,last4,now()).run();
 return {ok:true};
}
async function hostAction(db,b){
 const type=clean(b.type,40),eid=clean(b.eventId,120),t=now();
 if(type==='create'){
  const count=await p(db,'SELECT COUNT(*) AS n FROM iv_tourney_events').first();
  if(Number(count?.n)>=MAX_EVENTS)throw err('Event storage limit reached; archive older events.',409);
  const name=clean(b.name,100),game=clean(b.game,60),date=clean(b.date,10),time=clean(b.time,5),prize=clean(b.prize,80);
  if(!name||!game||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^\d{2}:\d{2}$/.test(time))throw err('Name, game, date and time are required.');
  const settings=validSettings(b,0);
  const newid='ev-'+id();
  await p(db,'INSERT INTO iv_tourney_events(id,name,game,date,time,venue,prize,format,seeding,swiss_rounds,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',
   newid,name,game,date,time,'Island Vibes Kava Bar',prize||'Bar tabs',settings.format,settings.seeding,settings.swissRounds,t,t).run();
  return {ok:true,eventId:newid};
 }
 const e=await loadEvent(db,eid);
 if(type==='edit'){
  const name=clean(b.name,100),game=clean(b.game,60),date=clean(b.date,10),time=clean(b.time,5),prize=clean(b.prize,80);
  if(!name||!game||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^\d{2}:\d{2}$/.test(time))throw err('Name, game, date and time are required.');
  await p(db,'UPDATE iv_tourney_events SET name=?,game=?,date=?,time=?,prize=?,updated_at=? WHERE id=?',name,game,date,time,prize,t,eid).run();
  return {ok:true};
 }
 if(type==='bulk'){
  if(e.started||e.locked)throw err('Registration has closed.');
  const names=String(b.names||'').split(/[\r\n,]+/).map(x=>clean(x,50)).filter(x=>x.length>=2);
  const seen=new Set(e.players.filter(x=>!x.removed).map(x=>norm(x.name)));
  const actions=[];let order=e.order.length,added=0;
  for(const name of names){
   if(seen.has(norm(name)))continue;
   if(e.count+added>=128)break;
   seen.add(norm(name));added++;
   actions.push(p(db,'INSERT INTO iv_tourney_players(id,event_id,name,name_key,source,sort_order,joined_at) VALUES(?,?,?,?,?,?,?)',
    id(),eid,name,norm(name),'paper',order++,t));
  }
  if(!actions.length)throw err('No new player names were found.');
  await db.batch(actions);return {ok:true,added};
 }
 if(type==='verify'||type==='verify-all'||type==='remove'||type==='reorder'){
  if(e.started)throw err('Reopen registration before modifying players.');
  if(type==='verify-all'){
   await p(db,'UPDATE iv_tourney_players SET verified=? WHERE event_id=? AND removed=0',b.value?1:0,eid).run();return {ok:true};
  }
  if(type==='reorder'){
   const order=Array.isArray(b.order)?b.order.map(x=>clean(x,80)):[];
   if(order.length!==e.count||new Set(order).size!==order.length||order.some(x=>!e.order.includes(x)))throw err('Invalid seed order.');
   if(order.length)await db.batch(order.map((pid,i)=>p(db,'UPDATE iv_tourney_players SET sort_order=? WHERE event_id=? AND id=?',i,eid,pid)));
   return {ok:true};
  }
  const pid=clean(b.playerId,80);
  if(!e.players.some(x=>x.id===pid&&!x.removed))throw err('Player not found.',404);
  if(type==='verify')await p(db,'UPDATE iv_tourney_players SET verified=? WHERE event_id=? AND id=?',b.value?1:0,eid,pid).run();
  else await p(db,'UPDATE iv_tourney_players SET removed=1,verified=0 WHERE event_id=? AND id=?',eid,pid).run();
  return {ok:true};
 }
 if(type==='configure'){
  if(e.started)throw err('Use Regenerate to change a started bracket.',409);
  const settings=validSettings(b,e.eligible);
  await p(db,'UPDATE iv_tourney_events SET format=?,seeding=?,swiss_rounds=?,updated_at=? WHERE id=?',
    settings.format,settings.seeding,settings.swissRounds,t,eid).run();
  return {ok:true};
 }
 if(type==='start'||type==='regenerate'||type==='reopen'){
  if(type==='start'&&e.started)throw err('Tournament already started.',409);
  if(type==='reopen'&&!e.started)throw err('Tournament is not started.');
  if(type!=='reopen'&&e.eligible<2)throw err('Check in at least two players first.');
  const settings=type==='regenerate'?validSettings({format:b.format||e.format,seeding:b.seeding||e.seeding,swissRounds:b.swissRounds||e.swissRounds},e.eligible):validSettings(e,e.eligible);
  const archived=type==='start'?e.archives:archive(e,type==='reopen'?'Reopened registration':settings.seeding==='keep'?'Restarted same seeds':'Regenerated bracket');
  const seeds=type==='reopen'?[]:seedsFor(e,settings.seeding);
  const sql=p(db,'UPDATE iv_tourney_events SET format=?,seeding=?,swiss_rounds=?,started=?,paused=0,locked=?,seeds_json=?,archives_json=?,updated_at=? WHERE id=?',
   type==='reopen'?e.format:settings.format,type==='reopen'?e.seeding:settings.seeding==='keep'?e.seeding:settings.seeding,
   type==='reopen'?e.swissRounds:settings.swissRounds,type==='reopen'?0:1,type==='reopen'?0:1,JSON.stringify(seeds),JSON.stringify(archived),t,eid);
  await db.batch([sql,p(db,'DELETE FROM iv_tourney_scores WHERE event_id=?',eid)]);
  return {ok:true};
 }
 if(type==='pause'){
  if(!e.started||e.finished)throw err('Only active tournaments can be paused.');
  await p(db,'UPDATE iv_tourney_events SET paused=?,updated_at=? WHERE id=?',b.value?1:0,t,eid).run();
  return {ok:true};
 }
 if(type==='score'||type==='undo-score'){
  if(!e.started)throw err('Start the bracket first.');
  if(e.paused)throw err('Resume the tournament before changing scores.');
  const matchId=clean(b.matchId,100);
  const match=e.bracket.rounds.flatMap(r=>r.matches).find(m=>m.id===matchId);
  if(!match)throw err('Match not found.');
  const old=e.scores[matchId];
  if(type==='undo-score'){
   if(match.status!=='complete')throw err('Match has no score to undo.');
   delete e.scores[matchId];
  }else{
   if(match.status!=='ready'&&match.status!=='complete')throw err('Both players must be ready before scoring.');
   const a=Number(b.a),bb=Number(b.b);
   if(b.a===''||b.b===''||!Number.isInteger(a)||!Number.isInteger(bb)||a<0||bb<0||a>999||bb>999||a===bb)throw err('Enter two whole-number non-tied scores from 0–999.');
   e.scores[matchId]={aId:match.aId,bId:match.bId,a,b:bb};
  }
  if(old||type==='undo-score')pruneScores(e);
  const inserts=[];
  for(const [mid,score] of Object.entries(e.scores)){
   if(!old&&mid!==matchId)continue;
   inserts.push(p(db,'INSERT INTO iv_tourney_scores(event_id,match_id,a_id,b_id,a,b,updated_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(event_id,match_id) DO UPDATE SET a_id=excluded.a_id,b_id=excluded.b_id,a=excluded.a,b=excluded.b,updated_at=excluded.updated_at',
     eid,mid,score.aId,score.bId,score.a,score.b,t));
  }
  const existing=await p(db,'SELECT match_id FROM iv_tourney_scores WHERE event_id=?',eid).all();
  const removed=(existing.results||[]).map(x=>x.match_id).filter(x=>!e.scores[x]);
  for(const mid of removed)inserts.push(p(db,'DELETE FROM iv_tourney_scores WHERE event_id=? AND match_id=?',eid,mid));
  if(inserts.length)await db.batch(inserts);
  return {ok:true};
 }
 throw err('Unknown host operation.',400);
}
async function handleAPI(request,env,ctx){
 if(!env.DB)throw err('Database binding not configured.',503);
 const db=env.DB,url=new URL(request.url),route=url.pathname;
 if(request.method==='GET'&&url.searchParams.has('health')&&route==='/api'){
  await p(db,'SELECT COUNT(*) AS n FROM iv_tourney_events').first();
  return j({ok:true,database:'connected',app:'Island Vibes Tournament Hub',mode:'shared-online'});
 }
 if(request.method==='GET'&&route==='/api/rewards'){
  requireHost(request,env);
  const eventId=clean(url.searchParams.get('eventId'),120);
  return j(await privateList(db,eventId));
 }
 if(request.method==='GET'&&route==='/api'){
  const result=await publicState(db);
  return j(result,200,{'cache-control':'public, max-age=5, must-revalidate'});
 }
 if(request.method!=='POST'||(route!=='/api'&&route!=='/api/rewards'))throw err('Not found.',404);
 if(!String(request.headers.get('content-type')||'').includes('application/json'))throw err('JSON request required.',415);
 if(Number(request.headers.get('content-length')||0)>100000)throw err('Request too large.',413);
 const data=await request.json().catch(()=>{throw err('Invalid JSON.');});
 if(route==='/api/rewards'){
  if(data.type==='register')return j(await register(db,request,data));
  if(data.type==='upsert'){requireHost(request,env);return j(await savePrivate(db,data));}
  throw err('Unknown rewards operation.');
 }
 if(data.type==='auth'){requireHost(request,env);return j({ok:true});}
 requireHost(request,env);
 return j(await hostAction(db,data));
}
export default {
 async fetch(request,env,ctx){
  const path=new URL(request.url).pathname;
  if(path!=='/api'&&path!=='/api/rewards')return env.ASSETS.fetch(request);
  try{return await handleAPI(request,env,ctx);}
  catch(e){
   const status=Number(e.status)||500;
   if(status>=500)console.error('Tournament API:',String(e.message||e));
   return j({error:status===500?'Tournament server error. Try again shortly.':String(e.message||e),code:status>=500?'DATABASE_UNAVAILABLE':undefined},status);
  }
 }
};

