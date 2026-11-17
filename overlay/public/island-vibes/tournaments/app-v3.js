(()=>{
'use strict';
const FORMATS=[
 {id:'single-elimination',name:'Single elimination',desc:'One loss and you are out. Fastest tournament.'},
 {id:'double-elimination',name:'Double elimination',desc:'Winners bracket, lower bracket, and grand-final reset.'},
 {id:'round-robin',name:'Round robin',desc:'Every player faces everyone else.'},
 {id:'swiss',name:'Swiss system',desc:'Multiple rounds against similar records, avoiding repeat opponents.'},
 {id:'groups-playoffs',name:'Groups + playoffs',desc:'Group matchdays, then a knockout championship.'}
];
const ICON={calendar:'▦',bracket:'◇',people:'♙',stats:'▥',manage:'⚙',home:'⌂'};
const VIEWS=[['overview','Overview','⌂'],['join','Sign up','✎'],['players','Players','♙'],['bracket','Brackets','◇'],['calendar','Calendar','▦'],['stats','Standings','▥'],['control','Host desk','⚙']];
const storage={host:sessionStorage.getItem('island_host_code')||'',layout:localStorage.getItem('iv-bracket-layout')||'classic',stage:'all',month:'',drafts:{},busy:false,activeModal:null};
let STATE=null, refreshHandle=null, lastServerStamp='';
const $=q=>document.querySelector(q), $$=q=>[...document.querySelectorAll(q)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const eattr=esc;
const currentEvent=()=>{const id=new URLSearchParams(location.search).get('event')||'madden-2026-11-24';return STATE?.events.find(x=>x.id===id)||STATE?.events[0]||null;};
const currentView=()=>new URLSearchParams(location.search).get('view')||'overview';
const prettyDate=(d,opts)=>{if(!d)return 'Date TBD';try{return new Date(d+'T12:00:00').toLocaleDateString('en-US',opts||{weekday:'short',month:'short',day:'numeric',year:'numeric'});}catch(_){return d;}};
const timeText=t=>{if(!t)return 'TBD';const [h,m]=t.split(':').map(Number);return (h%12||12)+':'+String(m).padStart(2,'0')+' '+(h>=12?'PM':'AM');};
const dateTime=e=>prettyDate(e.date,{weekday:'long',month:'long',day:'numeric',year:'numeric'})+' · '+timeText(e.time);
const fmtName=x=>FORMATS.find(f=>f.id===x)?.name||x;
const isHost=()=>!!storage.host;
const status=e=>e.finished?'Complete':e.paused?'Paused':e.started?'Live':e.locked?'Sign-up closed':'Registration open';
const statusClass=e=>e.finished?'done':e.paused?'pause':e.started?'live':'open';
const activeCount=e=>e.bracket?.completed||0;
const btn=(name,act,variant='secondary',extra='')=>'<button type="button" class="btn '+variant+'" data-action="'+act+'" '+extra+'>'+name+'</button>';
const logo=(extra='')=>'<img src="/island-vibes/tournaments/iv-logo.jpg" class="'+extra+'" alt="Island Vibes Kava Bar logo" loading="lazy">';
const formatOptions=(selected)=>FORMATS.map(f=>'<option value="'+f.id+'" '+(selected===f.id?'selected':'')+'>'+esc(f.name)+'</option>').join('');
const formatMax={'single-elimination':128,'double-elimination':128,'round-robin':32,'swiss':128,'groups-playoffs':64};
function toast(message,err=false){
 const el=$('#toast');if(!el)return;
 el.textContent=message;el.className='toast '+(err?'error':'success')+' visible';
 clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('visible'),4800);
}
let consecutiveReadFailures=0;
let quietReadAfter=0;
async function load(quiet=false){
 if(quiet&&(document.hidden||navigator.onLine===false||Date.now()<quietReadAfter))return null;
 try{
  const r=await fetch('/.netlify/functions/iv-tournaments?t='+Date.now(),{cache:'no-store'});
  const data=await r.json();if(!r.ok)throw Error(data.error||'Unable to load tournaments');
  consecutiveReadFailures=0;quietReadAfter=0;
  STATE=data;
  if(!quiet||(!storage.activeModal&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)))render();
  return data;
  }catch(err){
  consecutiveReadFailures=Math.min(8,consecutiveReadFailures+1);
  quietReadAfter=Date.now()+Math.min(5*60000,15000*Math.pow(2,consecutiveReadFailures-1));
  if(!quiet){$('#main').innerHTML='<section class="card pad"><img src="/island-vibes/tournaments/iv-logo.jpg" alt="Island Vibes" style="width:74px;border-radius:50%;float:right;margin-left:12px"><h2>Tournament connection temporarily unavailable</h2><p>'+esc(err.message)+'</p><p class="muted">Your existing registrations are not being erased. Please retry when storage service access has been restored.</p>'+btn('Try again','refresh','primary')+'</section>';}
  if(!quiet)toast(err.message,true);
  return null;
 }
}
async function api(type,data={},hostOnly=false){
 if(storage.busy)throw Error('Another action is still saving');
 storage.busy=true;
 try{
  const e=currentEvent();
  const r=await fetch('/.netlify/functions/iv-tournaments',{method:'POST',headers:{'content-type':'application/json','x-host-code':storage.host},body:JSON.stringify({type,eventId:e?.id,...data})});
  const j=await r.json();
  if(!r.ok)throw Error(j.error||'Unable to save');
  return j;
 }finally{storage.busy=false;}
}
async function perform(type,params={},message='Saved'){
 try{const res=await api(type,params);await load();if(message)toast(message);return res;}catch(err){toast(err.message,true);throw err;}
}
function go(view,eventId=null,replace=false){
 const u=new URL(location.href);
 u.searchParams.set('view',view);
 if(eventId)u.searchParams.set('event',eventId);
 if(replace)history.replaceState(null,'',u);else history.pushState(null,'',u);
 storage.stage='all';render();scrollTo({top:0,behavior:'instant'});
}
function draft(e){
 if(!storage.drafts[e.id])storage.drafts[e.id]={format:e.format,seeding:e.started?'keep':(e.seeding||'registration'),swissRounds:e.swissRounds||4};
 return storage.drafts[e.id];
}
function shell(){
 const e=currentEvent();
 const nav=$('#nav'),chooser=$('#event-picker'),hostButton=$('#host-toggle');
 if(nav)nav.innerHTML=VIEWS.map(([id,name,ic])=>'<button class="nav-link '+(currentView()===id?'selected':'')+'" data-action="nav" data-view="'+id+'"><span class="nav-icon">'+ic+'</span>'+name+(id==='control'&&isHost()?'<i class="dot"></i>':'')+'</button>').join('');
 if(chooser)chooser.innerHTML=(STATE?.events||[]).map(ev=>'<option value="'+eattr(ev.id)+'" '+(ev.id===e?.id?'selected':'')+'>'+esc(ev.name)+' · '+esc(prettyDate(ev.date,{month:'short',day:'numeric'}))+'</option>').join('');
 if(hostButton)hostButton.innerHTML=isHost()?'✓ Host unlocked':'Host access';
 $('#side-event-count').textContent=(STATE?.events||[]).length+' events';
 $('#current-status').textContent=e?status(e):'No event';
 $('#current-status').className='state-tag '+(e?statusClass(e):'');
}
function hero(e,short=false){
 return '<section class="hero '+(short?'hero-short':'')+'"><div class="hero-text"><div class="hero-label"><span class="sun-dot"></span> ISLAND VIBES · TOURNAMENT NIGHT</div><h1>'+esc(e.name)+'</h1><p class="hero-date">'+esc(dateTime(e))+' <span class="bullet">•</span> '+esc(e.game)+'</p><p class="hero-detail">🏆 '+esc(e.prize||'Bragging rights')+' <span class="bullet">•</span> Free entry · Host check-in</p><div class="hero-buttons">'+btn('View bracket →','bracket','sun')+(!e.started?btn('Register to play','join','transparent'):btn('View participants','players','transparent'))+'</div></div><div class="hero-logo"><div class="halo"></div>'+logo('hero-logo-img')+'<div class="hero-logo-foot">VERO BEACH, FLORIDA</div></div></section>';
}
function statsStrip(e){
 return '<section class="stats-grid">'+[
 [e.count,'Registered','♙'],[e.eligible,'Checked in','✓'],[e.bracket.completed||0,'Matches scored','▥'],[e.winner||'—','Champion','★']
 ].map(([val,label,ic])=>'<div class="stat-card"><div class="stat-symbol">'+ic+'</div><div class="stat-number">'+esc(val)+'</div><div class="stat-caption">'+label+'</div></div>').join('')+'</section>';
}
function sectionTitle(title,note='',actions=''){
 return '<div class="section-head"><div><h2>'+title+'</h2>'+(note?'<p class="muted">'+note+'</p>':'')+'</div><div class="actions">'+actions+'</div></div>';
}
function viewOverview(e){
 const upcoming=(STATE.events||[]).filter(x=>x.date>=(new Date()).toLocaleDateString('en-CA',{timeZone:'America/New_York'})).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,4);
 const stat=statsStrip(e);
 return hero(e)+stat+'<div class="two-col"><section class="card pad">'+sectionTitle('Event details','Everything players need to know')+
  '<div class="details-table"><div><span>Date & time</span><b>'+esc(dateTime(e))+'</b></div><div><span>Game</span><b>'+esc(e.game)+'</b></div><div><span>Location</span><b>Island Vibes Kava Bar · Vero Beach</b></div><div><span>Tournament style</span><b>'+esc(fmtName(e.format))+'</b></div><div><span>Prizes</span><b>'+esc(e.prize)+'</b></div><div><span>Entry</span><b>Free · check-in required</b></div></div><div class="card-actions">'+btn('Copy player signup link','copy-join','secondary')+btn('Add to calendar','ics','outline')+'</div></section>'+
  '<section class="card pad">'+sectionTitle('Match-day workflow','Simple enough to run live at the bar')+
  '<div class="steps"><div><i>1</i><span><b>Register</b><small>Invite players online or enter names from a paper sheet.</small></span></div><div><i>2</i><span><b>Check in</b><small>Host verifies that players are present and ready.</small></span></div><div><i>3</i><span><b>Build & start</b><small>Choose a format and generate the tournament.</small></span></div><div><i>4</i><span><b>Play and score</b><small>Enter results. The next match appears automatically.</small></span></div></div><div class="card-actions">'+btn('Go to host desk →','control','primary')+'</div></section></div>'+
  '<section class="card pad">'+sectionTitle('Upcoming events','All game nights in one place',btn('Open full calendar','calendar','secondary'))+
  '<div class="event-list">'+(upcoming.length?upcoming.map(x=>eventTile(x)).join(''):'<div class="empty">No upcoming tournaments are scheduled yet.</div>')+'</div></section>';
}
function eventTile(ev){
 return '<button class="event-tile" data-action="event" data-event="'+eattr(ev.id)+'"><span class="date-square"><b>'+esc(prettyDate(ev.date,{month:'short'}).toUpperCase())+'</b><strong>'+esc(new Date(ev.date+'T12:00:00').getDate())+'</strong></span><span class="event-title"><b>'+esc(ev.name)+'</b><small>'+esc(ev.game)+' · '+esc(timeText(ev.time))+' · '+esc(fmtName(ev.format))+'</small></span><span class="event-count">'+ev.count+' players</span><span class="event-arrow">↗</span></button>';
}
function viewJoin(e){
 if(e.locked||e.started)return '<div class="subhead">'+logo('mini-logo')+'<div><div class="eyebrow">PLAYER REGISTRATION</div><h1>Registration closed</h1></div></div><section class="card pad"><div class="notice gold">The event has already started or sign-up has been closed by the host.</div>'+btn('Watch live bracket','bracket','primary')+'</section>';
 return '<div class="subhead">'+logo('mini-logo')+'<div><div class="eyebrow">PLAYER REGISTRATION</div><h1>Join '+esc(e.game)+'</h1><p>'+esc(dateTime(e))+' · Free entry</p></div></div>'+
  '<div class="two-col"><section class="card pad">'+sectionTitle('Save your spot','Sign up using only your name or gamer tag')+
  '<form data-form="register"><label class="label" for="sign-name">Player name or gamer tag</label><input id="sign-name" name="name" class="input" maxlength="50" required minlength="2" autocomplete="nickname" placeholder="What should we call you?"><div class="form-grid"><div><label class="label" for="rewards-name">Rewards name</label><input id="rewards-name" name="rewardsName" class="input" maxlength="60" autocomplete="name" placeholder="Name on your rewards account"></div><div><label class="label" for="phone-last4">Last 4 of phone number</label><input id="phone-last4" name="last4" class="input" inputmode="numeric" maxlength="4" pattern="[0-9]{4}" placeholder="1234" aria-describedby="rewards-note"></div></div><p class="muted" id="rewards-note" style="margin-top:10px">Rewards details are for host lookup only. Never enter your full phone number. Leave blank if you do not have a rewards account.</p><input type="text" name="website" tabindex="-1" style="position:absolute;left:-9999px" aria-hidden="true"><div class="notice info"><b>No purchase required.</b> Sign up now, then check in with your host when you arrive so you can enter the bracket.</div><button class="btn primary wide" type="submit">Register for tournament →</button></form></section>'+
  '<section class="card pad">'+sectionTitle('Share the tournament','Invite friends to enter online')+logo('center-logo')+
  '<label class="label">Registration link</label><input class="input" readonly value="'+eattr(joinLink(e))+'" onclick="this.select()">'+
  '<div class="card-actions">'+btn('Copy signup link','copy-join','primary')+btn('Print paper signup','print-signup','secondary')+'</div><p class="muted small">Both online and paper registration feed into the same roster.</p></section></div>';
}
function viewPlayers(e){
 const players=e.players.filter(p=>!p.removed);
 const ordered=(e.order||[]).map(id=>players.find(p=>p.id===id)).filter(Boolean);
 for(const p of players)if(!ordered.includes(p))ordered.push(p);
 const controls=isHost()&&!e.started;
 return '<div class="subhead">'+logo('mini-logo')+'<div><div class="eyebrow">PLAYER ROSTER</div><h1>Players & check-in</h1><p>'+e.count+' registered · '+e.eligible+' checked in</p></div></div>'+
  '<section class="card pad">'+sectionTitle('Registered players','Hosts can manage sign-ups until the bracket starts',
    btn('Export roster CSV','export-players','secondary')+btn('Print signup sheet','print-signup','outline'))+
  (ordered.length?'<div class="player-table">'+ordered.map((p,i)=>'<div class="player-row"><span class="player-number">'+(i+1)+'</span><div class="player-profile"><b>'+esc(p.name)+'</b><small>'+(p.source==='paper'?'Paper signup':'Online registration')+'</small></div><span class="chip '+(p.verified?'checked':'pending')+'">'+(p.verified?'✓ Checked in':'Pending check-in')+'</span>'+
    (controls?'<div class="player-actions">'+btn(p.verified?'Undo check-in':'Check in','checkin','small '+(p.verified?'outline':'teal'),'data-id="'+eattr(p.id)+'" data-value="'+(p.verified?'false':'true')+'"')+
      btn('↑','seed-up','small outline','title="Move seed up" data-id="'+eattr(p.id)+'"')+btn('↓','seed-down','small outline','title="Move seed down" data-id="'+eattr(p.id)+'"')+btn('Rewards','rewards-edit','small outline','title="Rewards lookup details" data-id="'+eattr(p.id)+'"')+btn('✕','remove-player','small danger','title="Remove player" data-id="'+eattr(p.id)+'"')+'</div>':isHost()?'<div class="player-actions">'+btn('Rewards','rewards-edit','small outline','data-id="'+eattr(p.id)+'"')+'</div>':'')+'</div>').join('')+'</div>':'<div class="empty">No players yet. Share the registration page to get started.</div>')+
  '</section>'+(controls?'<div class="two-col"><section class="card pad">'+sectionTitle('In-person registration','Enter one name per line')+'<form data-form="bulk"><label class="label">Walk-in names</label><textarea class="input textarea" name="names" placeholder="Player 1&#10;Player 2&#10;Player 3" required></textarea><button type="submit" class="btn primary">Add walk-in players</button></form></section>'+
  '<section class="card pad">'+sectionTitle('Check-in controls','No purchase verification is needed')+'<div class="notice info">Check-in confirms the player is present and ready. Only checked-in players are included when the host builds a bracket.</div><div class="button-row">'+btn('✓ Check in everyone','verify-all','teal','data-value="true"')+btn('Clear all check-ins','verify-all','outline','data-value="false"')+'</div><div class="button-row">'+btn('Open host desk →','control','primary')+'</div></section></div>':e.started?'<div class="notice gold">The bracket has started. Player order and check-in are locked. The host can reopen registration without losing the roster.</div>':'')+
  (!isHost()?'<div class="notice info">To check players in, unlock Host access at the top of the page.</div>':'');
}
function groupStages(rounds){
 const map=new Map();
 for(const r of rounds){const key=r.stage||'main';if(!map.has(key))map.set(key,[]);map.get(key).push(r);}
 return [...map.entries()];
}
function stageTitle(key){
 if(key==='main')return 'Main bracket';
 if(key==='winners')return 'Upper bracket · undefeated';
 if(key==='losers')return 'Lower bracket · second chance';
 if(key==='grand-final')return 'Grand finals';
 if(key==='round-robin')return 'Round robin matchdays';
 if(key==='swiss')return 'Swiss rounds';
 if(key==='playoffs')return 'Championship playoffs';
 if(key.startsWith('group-'))return 'Group '+key.split('-')[1];
 return key;
}
function matchCard(e,m){
 const p1=m.aName||(!m.aId?'TBD':'Unknown'),p2=m.bName||(!m.bId?'TBD':'Unknown');
 const done=m.status==='complete',ready=m.status==='ready',bye=m.status==='bye';
 const canScore=isHost()&&!e.paused&&e.started&&m.aId&&m.bId&&(ready||done);
 const label=done?'Final':bye?'Bye':ready?'Ready':'Waiting';
 return '<article class="match-card '+(done?'is-done':'')+'" data-match="'+esc(m.id)+'"><header class="match-header"><span>Match '+m.index+'</span><span class="match-status '+(done?'complete':ready?'ready':'')+'">'+label+'</span></header>'+
  '<div class="slot '+(m.winnerId===m.aId&&m.aId?'winner':'')+'"><span class="slot-name">'+esc(p1)+'</span>'+(m.scoreA!==null?'<b class="slot-score">'+m.scoreA+'</b>':'')+'</div>'+
  '<div class="slot '+(m.winnerId===m.bId&&m.bId?'winner':'')+'"><span class="slot-name">'+esc(p2)+'</span>'+(m.scoreB!==null?'<b class="slot-score">'+m.scoreB+'</b>':'')+'</div>'+
  (canScore?'<div class="score-edit"><input type="number" class="score-input" data-score-a aria-label="Score '+esc(p1)+'" min="0" max="999" placeholder="A" value="'+(m.scoreA===null?'':m.scoreA)+'"><input type="number" class="score-input" data-score-b aria-label="Score '+esc(p2)+'" min="0" max="999" placeholder="B" value="'+(m.scoreB===null?'':m.scoreB)+'">'+btn(done?'Update':'Save score','score','small teal','data-id="'+m.id+'"')+'</div>':bye?'<div class="match-foot">Automatic advancement</div>':'')+
  (done&&canScore?'<div class="undo-row">'+btn('↶ Undo result','undo-score','text-danger','data-id="'+m.id+'"')+'</div>':'')+
  '</article>';
}
function viewStandings(rows,title){
 if(!rows||!rows.length)return '';
 return '<section class="card pad standings-card">'+sectionTitle(title,'Ranked by wins, score differential, and points scored')+
 '<div class="table-scroll"><table><thead><tr><th>#</th><th>Player</th><th>Played</th><th>W</th><th>L</th><th>Diff.</th><th>Points</th></tr></thead><tbody>'+rows.map(p=>'<tr><td>'+p.rank+'</td><td><b>'+esc(p.name)+'</b></td><td>'+p.played+'</td><td>'+p.wins+'</td><td>'+p.losses+'</td><td>'+(p.diff>0?'+':'')+p.diff+'</td><td>'+p.points+'</td></tr>').join('')+'</tbody></table></div></section>';
}
function viewBracket(e){
 let b=e.bracket;
 let head='<div class="subhead">'+logo('mini-logo')+'<div><div class="eyebrow">LIVE TOURNAMENT</div><h1>'+esc(fmtName(e.format))+'</h1><p>'+e.count+' registered · '+b.completed+' results saved · '+esc(status(e))+'</p></div></div>';
 if(!e.started)return head+'<section class="card pad center-empty"><div class="empty-art">◇</div><h2>Bracket is waiting to be generated</h2><p>Once the host checks players in and starts the tournament, matchups appear automatically.</p>'+btn('Open host desk','control','primary')+'</section>';
 const grouped=groupStages(b.rounds);
 const controls='<div class="bracket-toolbar"><div><b>Bracket view</b><small>Choose the layout that works best for your screen</small></div><div class="segment">'+[['classic','Classic'],['compact','Compact'],['cards','Cards']].map(([v,l])=>'<button data-action="layout" data-layout="'+v+'" class="'+(storage.layout===v?'active':'')+'">'+l+'</button>').join('')+'</div><div class="button-row">'+btn('Export scores','export-matches','outline small')+btn('Print','print-bracket','outline small')+'</div></div>';
 const primary=grouped.map(([key,rounds])=>'<section class="card bracket-section"><div class="section-head bracket-heading"><div><div class="eyebrow">TOURNAMENT STAGE</div><h2>'+esc(stageTitle(key))+'</h2></div><span class="small muted">'+rounds.reduce((n,r)=>n+r.matches.length,0)+' matchups</span></div><div class="bracket-scroll"><div class="bracket-track layout-'+storage.layout+'">'+rounds.map(rd=>'<div class="bracket-column"><div class="round-title">'+esc(rd.label)+'</div>'+rd.matches.map(m=>matchCard(e,m)).join('')+'</div>').join('')+'</div></div></section>').join('');
 let results='';
 if(b.standings)results+=viewStandings(b.standings,e.format==='swiss'?'Swiss standings':'Round-robin standings');
 if(b.groupStats)for(const g of b.groupStats)results+=viewStandings(g.standings,'Group '+esc(g.group)+' standings');
 return head+(e.winner?'<div class="champion"><span>★</span><div><small>TOURNAMENT CHAMPION</small><b>'+esc(e.winner)+'</b></div>'+logo('champion-logo')+'</div>':'')+
  (e.paused?'<div class="notice gold">Tournament paused. Only the host can resume score entry.</div>':'')+controls+
  '<div class="notice info">Only host-entered scores advance players. If you correct an earlier result, dependent later-round results may be cleared to keep the bracket accurate.</div>'+
  primary+results+(isHost()?'<div class="card pad">'+btn('Tournament restart & regeneration controls →','control','primary')+'</div>':'');
}
function viewCalendar(){
 if(!storage.month){const e=currentEvent();storage.month=e?.date?.slice(0,7)||new Date().toISOString().slice(0,7);}
 const [yy,mm]=storage.month.split('-').map(Number),start=new Date(yy,mm-1,1).getDay(),last=new Date(yy,mm,0).getDate();
 const name=new Date(yy,mm-1,1).toLocaleDateString('en-US',{month:'long',year:'numeric'}),cells=[];
 const events=STATE?.events||[];
 for(let i=0;i<start;i++)cells.push('<div class="cal-blank"></div>');
 for(let d=1;d<=last;d++){
  const date=storage.month+'-'+String(d).padStart(2,'0'),list=events.filter(e=>e.date===date);
  cells.push('<div class="cal-cell '+(list.length?'has-event':'')+'"><span class="cal-number">'+d+'</span>'+list.map(x=>'<button data-action="event" data-event="'+eattr(x.id)+'"><b>'+esc(x.game)+'</b><small>'+esc(timeText(x.time))+'</small></button>').join('')+'</div>');
 }
 const sorted=events.slice().sort((a,b)=>a.date.localeCompare(b.date));
 return '<div class="subhead">'+logo('mini-logo')+'<div><div class="eyebrow">UPCOMING TOURNAMENTS</div><h1>Event calendar</h1><p>Every Island Vibes competition in one place.</p></div></div>'+
  '<section class="card pad"><div class="calendar-top"><h2>'+esc(name)+'</h2><div class="button-row">'+btn('←','prev-month','outline small')+btn('Today','today','outline small')+btn('→','next-month','outline small')+(isHost()?btn('+ Create event','new-event','primary small'):'')+'</div></div><div class="calendar-grid">'+['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(x=>'<span class="weekday">'+x+'</span>').join('')+cells.join('')+'</div></section>'+
  '<section class="card pad">'+sectionTitle('All scheduled events','Select a tournament for its details and sign-up')+'<div class="event-list">'+(sorted.length?sorted.map(eventTile).join(''):'<div class="empty">No tournaments scheduled yet.</div>')+'</div></section>';
}
function viewStats(e){
 const entries=STATE?.leaderboard||[];
 return '<div class="subhead">'+logo('mini-logo')+'<div><div class="eyebrow">THE HISTORY BOOKS</div><h1>Season statistics</h1><p>Player records and tournament winners across every event.</p></div></div>'+
  '<section class="card pad">'+sectionTitle('All-time player leaderboard','Player names are matched by gamer tag across tournaments',btn('Export stats','export-stats','outline small'))+
  (entries.length?'<div class="table-scroll"><table><thead><tr><th>#</th><th>Player</th><th>Events</th><th>Wins</th><th>Losses</th><th>Titles</th><th>Points for</th><th>Against</th></tr></thead><tbody>'+entries.map((p,i)=>'<tr><td>'+(i+1)+'</td><td><b>'+esc(p.name)+'</b></td><td>'+p.events+'</td><td>'+p.wins+'</td><td>'+p.losses+'</td><td>'+p.titles+'</td><td>'+p.points+'</td><td>'+p.against+'</td></tr>').join('')+'</tbody></table></div>':'<div class="empty">Statistics will appear once the host records match scores.</div>')+'</section>'+
  '<section class="card pad">'+sectionTitle('Tournament history','Saved scores count toward stats until a bracket is regenerated')+
  '<div class="table-scroll"><table><thead><tr><th>Date</th><th>Game</th><th>Format</th><th>Players</th><th>Champion</th><th>Results</th></tr></thead><tbody>'+
  STATE.events.map(x=>'<tr><td>'+esc(prettyDate(x.date))+'</td><td><button class="plain-link" data-action="event" data-event="'+eattr(x.id)+'">'+esc(x.name)+'</button></td><td>'+esc(fmtName(x.format))+'</td><td>'+x.count+'</td><td>'+esc(x.winner||'—')+'</td><td>'+x.bracket.completed+'</td></tr>').join('')+'</tbody></table></div></section>';
}
function viewControl(e){
 if(!isHost())return '<div class="subhead">'+logo('mini-logo')+'<div><div class="eyebrow">HOST OPERATIONS</div><h1>Host desk</h1></div></div><section class="card pad center-empty"><div class="empty-art">⚙</div><h2>Host access required</h2><p>Unlock tournament controls to check players in, change formats, regenerate brackets, and record scores.</p>'+btn('Unlock host access','login','primary')+'</section>';
 const d=draft(e),registration=!e.started;
 const currentMatches=e.bracket.completed||0;
 const controls='<section class="card pad">'+sectionTitle('Bracket setup','Choose competition format and seeding. Changes to a live tournament require regeneration.')+
 '<div class="form-grid"><div><label class="label">Competition format</label><select id="host-format" class="input">'+formatOptions(d.format)+'</select></div><div><label class="label">Seeding</label><select id="host-seeding" class="input"><option value="registration" '+(d.seeding==='registration'?'selected':'')+'>Manual / roster order</option><option value="random" '+(d.seeding==='random'?'selected':'')+'>Random shuffle</option>'+(e.started?'<option value="keep" '+(d.seeding==='keep'?'selected':'')+'>Keep current seed order</option>':'')+'</select></div><div><label class="label">Swiss rounds (Swiss only)</label><input id="host-rounds" class="input" type="number" min="1" max="8" value="'+d.swissRounds+'"></div><div><label class="label">Verified players</label><div class="readout">'+e.eligible+' checked in · '+e.count+' registered</div></div></div>'+
 '<div class="format-guide" id="format-guide">'+esc(FORMATS.find(f=>f.id===d.format)?.desc||'')+'</div><div class="button-row">'+
 (registration?btn('Save format & settings','save-config','secondary')+btn('▶ Generate bracket & start','start','primary',e.eligible<2?'disabled':''):
 btn('⟳ Regenerate bracket now','regen','primary')+btn('↶ Return to registration','reopen','outline'))+
 '</div></section>';
 const live='<section class="card pad">'+sectionTitle('Live event control','Safe ways to manage play after the first match')+'<div class="control-grid">'+
 '<div class="control-tile"><div class="control-icon">◇</div><h3>Start or regenerate</h3><p>Reseed players and build a fresh bracket, even after the tournament began.</p>'+(registration?btn('Start event','start','teal',e.eligible<2?'disabled':''):btn('Regenerate now','regen','teal')+btn('Restart same seeds','restart-same','outline small'))+'</div>'+
 '<div class="control-tile"><div class="control-icon">↶</div><h3>Go back safely</h3><p>Reopen registration, keeping the roster and check-ins. Previous scores are archived.</p>'+btn('Reopen signup','reopen','outline',registration?'disabled':'')+'</div>'+
 '<div class="control-tile"><div class="control-icon">Ⅱ</div><h3>Pause or resume</h3><p>Pause score entry without modifying the bracket or registrations.</p>'+btn(e.paused?'▶ Resume event':'Ⅱ Pause event',e.paused?'resume':'pause','outline',!e.started||e.finished?'disabled':'')+'</div>'+
 '<div class="control-tile"><div class="control-icon">↤</div><h3>Correct scores</h3><p>Undo or edit a result in the bracket view; dependent scores are cleared.</p>'+btn('Open live bracket','bracket','outline')+'</div></div>'+
 '<div class="notice gold"><b>Regeneration safety:</b> starting a new bracket clears the current scores. The previous bracket is copied into the event history first; registered players and check-in status remain intact.</div></section>';
 const archives='<section class="card pad">'+sectionTitle('Saved bracket generations','Each regeneration or return to registration creates a restore reference')+
 (e.archives?.length?'<div class="archive-list">'+e.archives.slice().reverse().map((h,i)=>'<div class="archive-row"><div><b>'+esc(h.reason)+'</b><small>'+esc(new Date(h.at).toLocaleString('en-US'))+' · '+esc(fmtName(h.format))+' · '+h.matches+' results · '+esc(h.winner||'No champion')+'</small></div>'+btn('Download record','archive-export','outline small','data-index="'+(e.archives.length-i-1)+'"')+'</div>').join('')+'</div>':'<div class="empty">No previous bracket generations. The first restart will create an archive.</div>')+'</section>';
 return '<div class="subhead">'+logo('mini-logo')+'<div><div class="eyebrow">PRIVATE CONTROLS</div><h1>Tournament control room</h1><p>Managing '+esc(e.name)+' · '+esc(status(e))+'</p></div></div>'+
 '<div class="host-strip"><span class="green-dot"></span> HOST AUTHORIZED '+btn('Edit event details','edit-event','outline small')+btn('Create another tournament','new-event','secondary small')+btn('Lock host desk','logout','outline small')+'</div>'+
 statsStrip(e)+controls+live+archives;
}
function render(){
 if(!STATE)return;
 const e=currentEvent();
 shell();
 if(!e){$('#main').innerHTML='<section class="card pad">No events found.</section>';return;}
 let html='';
 switch(currentView()){
  case 'join':html=viewJoin(e);break;
  case 'players':html=viewPlayers(e);break;
  case 'bracket':html=viewBracket(e);break;
  case 'stats':html=viewStats(e);break;
  case 'calendar':html=viewCalendar(e);break;
  case 'control':html=viewControl(e);break;
  default:html=viewOverview(e);
 }
 $('#main').innerHTML=html;
 document.title=(currentView()==='calendar'?'Calendar':e.game)+' | Island Vibes Tournaments';
}
function joinLink(e){return location.origin+'/island-vibes/tournaments/?event='+encodeURIComponent(e.id)+'&view=join';}
function bracketLink(e){return location.origin+'/island-vibes/tournaments/?event='+encodeURIComponent(e.id)+'&view=bracket';}
async function copyText(value){
 try{await navigator.clipboard.writeText(value);toast('Link copied to clipboard');}catch(_){prompt('Copy this link:',value);}
}
function modal(title,inner,wide=false){
 storage.activeModal=true;
 $('#overlay').innerHTML='<div class="modal-back" data-action="close-modal"></div><div class="modal '+(wide?'modal-wide':'')+'" role="dialog" aria-modal="true" aria-label="'+esc(title)+'"><div class="modal-top"><div>'+logo('modal-logo')+'<h2>'+esc(title)+'</h2></div><button type="button" class="icon-btn" data-action="close-modal" aria-label="Close">✕</button></div><div class="modal-body">'+inner+'</div></div>';
 const i=$('#overlay input:not([type="hidden"]),#overlay select');if(i)i.focus();
}
function closeModal(){storage.activeModal=false;$('#overlay').innerHTML='';}
function confirmAction(title,body,button,fn,danger=false){
 confirmAction.next=fn;
 modal(title,'<div class="notice '+(danger?'warn':'info')+'">'+body+'</div><div class="modal-actions">'+btn('Cancel','close-modal','outline')+btn(button,'confirm',''+(danger?'danger':'primary'))+'</div>');
}
function showAuth(){
 modal('Unlock host controls','<p class="muted">Enter your private Island Vibes host code to check players in and manage tournament results.</p><form data-form="auth"><label class="label">Host access code</label><input class="input" type="password" name="code" required autocomplete="off" placeholder="Private access code"><button type="submit" class="btn primary wide">Unlock host desk</button></form>');
}
function showEventForm(e=null){
 modal(e?'Edit tournament':'Schedule a tournament','<form data-form="'+(e?'edit':'create')+'"><div class="form-grid"><div class="span-all"><label class="label">Event name</label><input class="input" name="name" required maxlength="100" value="'+esc(e?.name||'Tournament Tuesdays: ')+'"></div><div><label class="label">Game / competition</label><input class="input" name="game" required maxlength="60" value="'+esc(e?.game||'')+'" placeholder="Madden, Mario Kart, Smash..."></div><div><label class="label">Prize</label><input class="input" name="prize" maxlength="80" value="'+esc(e?.prize||'Bar tabs')+'"></div><div><label class="label">Date</label><input class="input" type="date" name="date" required value="'+esc(e?.date||'')+'"></div><div><label class="label">Start time</label><input class="input" type="time" name="time" required value="'+esc(e?.time||'20:00')+'"></div>'+
 (e?'':'<div><label class="label">Bracket format</label><select class="input" name="format">'+formatOptions('single-elimination')+'</select></div><div><label class="label">Seeding</label><select class="input" name="seeding"><option value="registration">Registration order</option><option value="random">Random</option></select></div>')+
 '</div><div class="notice info">Free registration. Players must check in with the host before competing.</div><div class="modal-actions">'+btn('Cancel','close-modal','outline')+'<button type="submit" class="btn primary">'+(e?'Save event':'Create tournament')+'</button></div></form>',true);
}
function tableCsv(name,columns,rows){
 const csv=[columns,...rows].map(arr=>arr.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\r\n');
 download(name,new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'}));
}
function download(name,blob){
 const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function eventICS(e){
 const date=e.date.split('-').map(Number),time=e.time.split(':').map(Number);
 const start=e.date.replace(/-/g,'')+'T'+e.time.replace(':','')+'00';
 const end=new Date(Date.UTC(date[0],date[1]-1,date[2],time[0]+2,time[1]));
 const local=d=>d.toISOString().slice(0,19).replace(/[-:]/g,'');
 const dtstamp=d=>d.toISOString().replace(/[-:]/g,'').replace(/\.\d+Z/,'Z');
 const safe=s=>String(s).replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
 const content='BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Island Vibes//Tournaments//EN\r\nBEGIN:VEVENT\r\nUID:'+e.id+'@island-vibes-tournaments\r\nDTSTAMP:'+dtstamp(new Date())+'\r\nDTSTART;TZID=America/New_York:'+start+'\r\nDTEND;TZID=America/New_York:'+local(end)+'\r\nSUMMARY:'+safe(e.name)+'\r\nLOCATION:Island Vibes Kava Bar\\, Vero Beach\\, Florida\r\nDESCRIPTION:'+safe('Game: '+e.game+'. Free entry. Host check-in required.')+'\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n';
 download('island-vibes-'+e.date+'.ics',new Blob([content],{type:'text/calendar'}));
}
function printSignup(e){
 const w=window.open('','_blank');if(!w){toast('Please allow pop-ups to print',true);return;}
 const rows=Array.from({length:25},(_,i)=>'<tr><td>'+(i+1)+'</td><td></td><td></td><td></td><td></td></tr>').join('');
 w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>Island Vibes - Rewards Signup</title><style>body{font:13px Arial;color:#13364c;padding:20px}header{display:flex;align-items:center;gap:14px;border-bottom:3px solid #177b86;padding-bottom:8px}header img{width:68px;height:68px}h1{margin:0;font-size:21px}table{width:100%;border-collapse:collapse;margin-top:12px}td,th{border:1px solid #618591;padding:5px;height:22px}th{background:#e4f2f3;font-size:10px}footer{font-size:10px;margin-top:13px}@page{size:letter;margin:.4in}</style></head><body><header><img src="'+location.origin+'/island-vibes/tournaments/iv-logo.jpg"><div><h1>ISLAND VIBES - TOURNAMENT SIGN-UP</h1><p>'+esc(e.name)+' · '+esc(dateTime(e))+'</p></div></header><p><b>FREE ENTRY · HOST CHECK-IN REQUIRED</b></p><table><thead><tr><th style="width:5%">#</th><th style="width:33%">Player / Gamer Tag</th><th style="width:25%">Rewards Name</th><th style="width:17%">Last 4 of Phone</th><th style="width:20%">Host Check-in</th></tr></thead><tbody>'+rows+'</tbody></table><footer>Only collect the last four phone digits; never a full number. Enter paper sign-ups into the tournament hub before starting the bracket.</footer></body></html>');
 w.document.close();setTimeout(()=>{w.focus();w.print();},550);
}
function shiftMonth(delta){
 const [y,m]=storage.month.split('-').map(Number),d=new Date(y,m-1+delta,1);
 storage.month=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');render();
}
async function handle(action,el){
 const e=currentEvent(),d=e?draft(e):null;
 if(action==='nav'){go(el.dataset.view);return;}
 if(['overview','join','players','bracket','calendar','stats','control'].includes(action)){go(action);return;}
 if(action==='event'){go('overview',el.dataset.event);return;}
 if(action==='refresh'){await load();toast('Up to date');return;}
 if(action==='login'||action==='host-login'){if(isHost()){go('control');return;}showAuth();return;}
 if(action==='logout'){storage.host='';sessionStorage.removeItem('island_host_code');go('control');toast('Host controls locked');return;}
 if(action==='close-modal'){closeModal();return;}
 if(action==='confirm'){const cb=confirmAction.next;closeModal();if(cb)await cb();return;}
 if(action==='copy-join'){await copyText(joinLink(e));return;}
 if(action==='copy-bracket'){await copyText(bracketLink(e));return;}
 if(action==='ics'){eventICS(e);return;}
 if(action==='print-signup'){printSignup(e);return;}
 if(action==='print-bracket'){window.print();return;}
 if(action==='layout'){storage.layout=el.dataset.layout;localStorage.setItem('iv-bracket-layout',storage.layout);render();return;}
 if(action==='prev-month'){shiftMonth(-1);return;}
 if(action==='next-month'){shiftMonth(1);return;}
 if(action==='today'){storage.month=new Date().toISOString().slice(0,7);render();return;}
 if(action==='new-event'){showEventForm();return;}
 if(action==='edit-event'){showEventForm(e);return;}
 if(action==='export-players'){tableCsv('island-vibes-'+e.date+'-players.csv',['Seed','Player','Source','Checked in'],e.players.filter(p=>!p.removed).map((p,i)=>[i+1,p.name,p.source,p.verified?'Yes':'No']));return;}
 if(action==='export-matches'){tableCsv('island-vibes-'+e.date+'-matches.csv',['Stage','Round','Match','Player A','Player B','Score A','Score B','Winner','Status'],e.bracket.rounds.flatMap(r=>r.matches.map(m=>[stageTitle(m.stage),r.label,m.id,m.aName,m.bName,m.scoreA,m.scoreB,e.players.find(p=>p.id===m.winnerId)?.name||'',m.status])));return;}
 if(action==='export-stats'){tableCsv('island-vibes-player-stats.csv',['Player','Events','Wins','Losses','Titles','Points scored','Against'],STATE.leaderboard.map(p=>[p.name,p.events,p.wins,p.losses,p.titles,p.points,p.against]));return;}
 if(action==='archive-export'){const archive=e.archives[Number(el.dataset.index)];if(archive)download('island-vibes-archived-bracket-'+archive.id+'.json',new Blob([JSON.stringify(archive,null,2)],{type:'application/json'}));return;}
 if(!isHost()){toast('Host access is required',true);return;}
 if(action==='seed-up'||action==='seed-down'){
  if(e.started)return toast('Reopen registration to change seeding',true);
  const ids=(e.order||e.players.filter(p=>!p.removed).map(p=>p.id)).filter(id=>e.players.some(p=>p.id===id&&!p.removed)),i=ids.indexOf(el.dataset.id),j=i+(action==='seed-up'?-1:1);
  if(i<0||j<0||j>=ids.length)return;
  [ids[i],ids[j]]=[ids[j],ids[i]];
  await perform('reorder',{order:ids},'Seed order updated');return;
 }
 if(action==='checkin'){await perform('verify',{playerId:el.dataset.id,value:el.dataset.value==='true'},'Check-in updated');return;}
 if(action==='verify-all'){const value=el.dataset.value==='true';confirmAction(value?'Check in all players?':'Clear all check-ins?','This will update the status of every active registered player.',value?'Confirm check-in':'Clear check-ins',()=>perform('verify-all',{value},'Check-ins updated'));return;}
 if(action==='rewards-edit'){
  const pid=el.dataset.id;
  const player=e.players.find(p=>p.id===pid);
  if(!player)return toast('Player unavailable',true);
  let rows=[];
  try{
   const res=await fetch('/.netlify/functions/iv-tournament-rewards?eventId='+encodeURIComponent(e.id),{headers:{'x-host-code':storage.host},cache:'no-store'});
   const data=await res.json();if(!res.ok)throw Error(data.error||'Unable to load rewards details');rows=data.players||[];
  }catch(ex){return toast(ex.message,true);}
  const entry=rows.filter(x=>x.playerId===pid||(!x.playerId&&x.name.toLocaleLowerCase()===player.name.toLocaleLowerCase())).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt))[0]||{};
  modal('Private rewards lookup: '+player.name,'<form data-form="rewards"><input type="hidden" name="playerId" value="'+esc(pid)+'"><label class="label">Rewards name</label><input name="rewardsName" class="input" maxlength="60" autocomplete="off" value="'+esc(entry.rewardsName||'')+'" placeholder="Rewards account name"><label class="label">Last 4 of phone</label><input name="last4" class="input" inputmode="numeric" maxlength="4" pattern="[0-9]{4}" value="'+esc(entry.last4||'')+'" placeholder="1234"><div class="notice info">Host only. These details never appear on the public player list. Do not enter a full phone number.</div><button type="submit" class="btn primary wide">Save private rewards details</button></form>');
  return;
 }
 if(action==='remove-player'){confirmAction('Remove player?','Remove this participant from the roster? They can sign up again while registration is open.','Remove player',()=>perform('remove',{playerId:el.dataset.id},'Player removed'),true);return;}
 if(action==='save-config'){
  const max=formatMax[d.format]||128;if(e.eligible>max)return toast('This format supports up to '+max+' players',true);
  await perform('configure',{format:d.format,seeding:d.seeding,swissRounds:Number(d.swissRounds)},'Tournament settings saved');return;
 }
 if(action==='start'){
  if(e.eligible<2)return toast('Check in at least two players first',true);
  confirmAction('Start the tournament?','<b>'+e.eligible+' checked-in players</b> will enter a '+esc(fmtName(d.format))+' bracket. Registration will close when you begin.','Generate & start',async()=>{
   await api('configure',{format:d.format,seeding:d.seeding,swissRounds:Number(d.swissRounds)});
   await perform('start',{},'Tournament started');go('bracket');
  });
  return;
 }
 if(action==='restart-same'){
  if(!e.started)return toast('Start the event first',true);
  confirmAction('Restart this exact bracket?','<p>Restart the current <b>'+esc(fmtName(e.format))+'</b> bracket with the <b>same player seeds</b>.</p><p>All '+e.bracket.completed+' current match results will be archived and removed. The roster and check-ins will be preserved.</p>','Archive & restart',async()=>{await perform('regenerate',{format:e.format,seeding:'keep',swissRounds:e.swissRounds},'Tournament restarted with same seeds');go('bracket');},true);
  return;
 }
 if(action==='regen'){
  if(e.eligible<2)return toast('At least two checked-in players are required',true);
  const newfmt=d.format;
  confirmAction('Regenerate a new bracket?','<p>This will immediately start a <b>'+esc(fmtName(newfmt))+'</b> bracket with <b>'+e.eligible+' checked-in players</b>.</p><p><b>'+e.bracket.completed+' saved results</b> will be archived and cleared. The player roster and check-ins will stay.</p>','Archive & regenerate',async()=>{
   await perform('regenerate',{format:d.format,seeding:d.seeding,swissRounds:Number(d.swissRounds)},'New bracket generated');
   go('bracket');
  },true);
  return;
 }
 if(action==='reopen'){
  if(!e.started)return;
  confirmAction('Reopen registration?','<p>The event will return to the sign-up stage. All <b>'+e.bracket.completed+' match scores</b> will be archived and removed from the current bracket.</p><p>The <b>'+e.count+' registered players</b> and their check-in status will be preserved.</p>','Reopen & archive',async()=>{
   await perform('reopen',{},'Registration reopened');go('players');
  },true);return;
 }
 if(action==='pause'||action==='resume'){await perform('pause',{value:action==='pause'},action==='pause'?'Tournament paused':'Tournament resumed');return;}
 if(action==='score'){
  const card=el.closest('.match-card'),a=card?.querySelector('[data-score-a]')?.value,b=card?.querySelector('[data-score-b]')?.value;
  if(a===''||b==='')return toast('Enter both scores',true);
  await perform('score',{matchId:el.dataset.id,a,b},'Match result saved');return;
 }
 if(action==='undo-score'){
  const match=e.bracket.rounds.flatMap(r=>r.matches).find(m=>m.id===el.dataset.id);
  if(!match)return;
  confirmAction('Undo match result?','<p>Undo the recorded result for <b>'+esc(match.aName)+' vs '+esc(match.bName)+'</b>.</p><p>Any dependent later-round scores will also be cleared so the bracket stays correct.</p>','Undo score',()=>perform('undo-score',{matchId:match.id},'Match result undone'),true);
  return;
 }
}
document.addEventListener('click',async ev=>{
 const el=ev.target.closest('[data-action]');if(!el)return;
 ev.preventDefault();
 try{await handle(el.dataset.action,el);}catch(err){toast(err.message,true);}
});
document.addEventListener('submit',async ev=>{
 const form=ev.target,kind=form.dataset.form;if(!kind)return;
 ev.preventDefault();
 const data=Object.fromEntries(new FormData(form).entries());
 try{
  if(kind==='auth'){
   const code=String(data.code||'');
   const r=await fetch('/.netlify/functions/iv-tournaments',{method:'POST',headers:{'Content-Type':'application/json','x-host-code':code},body:JSON.stringify({type:'auth'})});
   const j=await r.json();if(!j.ok)throw Error('Incorrect host code');
   storage.host=code;sessionStorage.setItem('island_host_code',code);closeModal();render();toast('Host access unlocked');go('control');return;
  }
  if(kind==='register'){
   const eventId=currentEvent().id;
   const resp=await fetch('/.netlify/functions/iv-tournament-rewards',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type:'register',eventId,name:data.name,rewardsName:data.rewardsName,last4:data.last4,website:data.website})});
   const result=await resp.json();if(!resp.ok)throw Error(result.error||'Registration failed');
   await load();form.reset();go('players');toast(result.warning||'You are registered! Check in with the host when you arrive.',!!result.warning);return;
  }
  if(kind==='rewards'){
   const resp=await fetch('/.netlify/functions/iv-tournament-rewards',{method:'POST',headers:{'content-type':'application/json','x-host-code':storage.host},body:JSON.stringify({type:'upsert',eventId:currentEvent().id,playerId:data.playerId,rewardsName:data.rewardsName,last4:data.last4})});
   const result=await resp.json();if(!resp.ok)throw Error(result.error||'Unable to save');
   closeModal();toast('Rewards details saved privately');return;
  }
  if(kind==='bulk'){await perform('bulk',{names:data.names},'Walk-in players added');form.reset();return;}
  if(kind==='create'){const r=await api('create',data);closeModal();await load();go('overview',r.eventId);toast('New tournament scheduled');return;}
  if(kind==='edit'){await perform('edit',data,'Event updated');closeModal();return;}
 }catch(err){toast(err.message,true);}
});
document.addEventListener('change',ev=>{
 const e=currentEvent();if(!e)return;const d=draft(e);
 if(ev.target.id==='event-picker'){go('overview',ev.target.value);return;}
 if(ev.target.id==='host-format'){d.format=ev.target.value;const el=$('#format-guide');if(el)el.textContent=FORMATS.find(f=>f.id===d.format)?.desc||'';}
 if(ev.target.id==='host-seeding')d.seeding=ev.target.value;
 if(ev.target.id==='host-rounds')d.swissRounds=Math.max(1,Math.min(8,Number(ev.target.value)||4));
});
window.addEventListener('popstate',()=>{render();});
document.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&storage.activeModal)closeModal();});
load(false);
let lastPollAt=Date.now();
refreshHandle=setInterval(()=>{
 if(storage.activeModal||storage.busy||document.hidden||navigator.onLine===false||Date.now()<quietReadAfter)return;
 const live=!!STATE?.events?.some(e=>e.started&&!e.finished);
 const view=currentView();
 const interval=live?30000:['join','players','bracket'].includes(view)?60000:180000;
 if(Date.now()-lastPollAt<interval)return;
 lastPollAt=Date.now();
 load(true);
},10000);
document.addEventListener('visibilitychange',()=>{
 if(document.hidden||storage.busy||Date.now()<quietReadAfter)return;
 if(Date.now()-lastPollAt>45000){lastPollAt=Date.now();load(true);}
});
window.addEventListener('online',()=>{if(Date.now()>=quietReadAfter)load(true);});
})();