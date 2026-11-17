function slot(id,resolved=true){return {id:id||null,resolved:!!resolved};}

function bracketSeeds(n){let a=[1,2];while(a.length<n){const m=2*a.length+1;a=a.flatMap(x=>[x,m-x]);}return a;}

function makeDuel(e,id,a,b,stage,round,index){
 const stored=e.scores?.[id];
 const aId=a?.id||null,bId=b?.id||null;
 let status='waiting',winnerId=null,loserId=null,scoreA=null,scoreB=null;
 const both=a?.resolved&&b?.resolved;
 if(both){
  if(!aId&&!bId)status='empty';
  else if(aId&&!bId){status='bye';winnerId=aId;}
  else if(!aId&&bId){status='bye';winnerId=bId;}
  else{
   status='ready';
   if(stored&&stored.aId===aId&&stored.bId===bId&&Number.isInteger(Number(stored.a))&&Number.isInteger(Number(stored.b))&&Number(stored.a)>=0&&Number(stored.b)>=0&&Number(stored.a)!==Number(stored.b)){
    scoreA=Number(stored.a);scoreB=Number(stored.b);
    winnerId=scoreA>scoreB?aId:bId;loserId=scoreA>scoreB?bId:aId;status='complete';
   }
  }
 }
 const resolved=['empty','bye','complete'].includes(status);
 return {id,stage,round,index,aId,bId,aName:e.players.find(p=>p.id===aId)?.name||'',bName:e.players.find(p=>p.id===bId)?.name||'',scoreA,scoreB,winnerId,loserId,status,win:slot(winnerId,resolved),lose:slot(loserId,resolved)};
}

function layerFromSlots(e,arr,prefix,stage,r){
 const matches=[];
 for(let i=0;i<arr.length;i+=2)matches.push(makeDuel(e,prefix+r+'m'+(i/2+1),arr[i]||slot(null),arr[i+1]||slot(null),stage,r,i/2+1));
 return matches;
}

function makeElimination(e,ids,prefix='r',stage='main',useDirectSlots=false){
 const width=2**Math.ceil(Math.log2(Math.max(2,ids.length)));
 let a=useDirectSlots?Array.from({length:width},(_,i)=>slot(ids[i]||null)):bracketSeeds(width).map(n=>slot(ids[n-1]||null));
 const stages=[];
 for(let r=1;r<=Math.log2(width);r++){
  const matches=layerFromSlots(e,a,prefix,stage,r);
  stages.push({id:stage+'-'+r,stage,round:r,label:r===Math.log2(width)?(stage==='playoffs'?'Playoff final':'Final'):'Round '+r,matches});
  a=matches.map(m=>m.win);
 }
 return {rounds:stages,champion:stages.at(-1).matches[0].winnerId||null};
}

function makeDouble(e){
 const seeds=e.seeds,width=2**Math.ceil(Math.log2(Math.max(2,seeds.length))),k=Math.log2(width);
 const wb=makeElimination(e,seeds,'w','winners'),rounds=wb.rounds.map(x=>({...x,label:x.label==='Final'?'Winners final':x.label}));
 const wbLayers=rounds.map(x=>x.matches),lower=[];
 if(k>=2){
  let nodes=wbLayers[0].map(m=>m.lose);
  for(let r=1;r<=2*k-2;r++){
   let participants;
   if(r===1)participants=nodes;
   else if(r%2===1)participants=nodes;
   else{
    const drop=wbLayers[r/2].map(m=>m.lose).reverse();
    participants=nodes.flatMap((n,i)=>[n,drop[i]||slot(null)]);
   }
   const matches=layerFromSlots(e,participants,'l','losers',r);
   lower.push({id:'losers-'+r,stage:'losers',round:r,label:'Lower round '+r,matches});
   nodes=matches.map(m=>m.win);
  }
 }
 rounds.push(...lower);
 const upper=wbLayers.at(-1)[0].win;
 const lowerSlot=lower.length?lower.at(-1).matches[0].win:wbLayers.at(-1)[0].lose;
 const gf1=makeDuel(e,'g1m1',upper,lowerSlot,'grand-final',1,1);
 rounds.push({id:'gf1',stage:'grand-final',round:1,label:'Grand final',matches:[gf1]});
 let champion=null,grandReset=false;
 if(gf1.status==='complete'){
  if(gf1.winnerId===upper.id)champion=upper.id;
  else grandReset=true;
 }
 if(grandReset){
  const gf2=makeDuel(e,'g2m1',upper,lowerSlot,'grand-final',2,1);
  rounds.push({id:'gf2',stage:'grand-final',round:2,label:'Grand final reset',matches:[gf2]});
  if(gf2.status==='complete')champion=gf2.winnerId;
 }
 return {rounds,champion,grandReset};
}

function circlePairs(ids){
 const ring=ids.slice();if(ring.length%2)ring.push(null);
 const rounds=[],n=ring.length;
 for(let r=0;r<n-1;r++){
  const pairs=[];
  for(let i=0;i<n/2;i++){const a=ring[i],b=ring[n-1-i];pairs.push([a||null,b||null]);}
  rounds.push(pairs);
  ring.splice(1,0,ring.pop());
 }
 return rounds;
}

function makeRoundRobinMatches(e,ids,prefix,stage){
 const pairs=circlePairs(ids),rounds=[];
 for(let r=0;r<pairs.length;r++){
  const matches=pairs[r].map(([a,b],i)=>makeDuel(e,prefix+(r+1)+'m'+(i+1),slot(a),slot(b),stage,r+1,i+1));
  rounds.push({id:stage+'-'+(r+1),stage,round:r+1,label:'Matchday '+(r+1),matches});
 }
 return rounds;
}

function makeStandings(e,ids,matches,swiss=false){
 const rows=ids.filter(Boolean).map((id,i)=>({id,name:e.players.find(p=>p.id===id)?.name||'Unknown',seed:i+1,played:0,wins:0,losses:0,byes:0,points:0,against:0,diff:0}));
 const byId=Object.fromEntries(rows.map(p=>[p.id,p]));
 for(const m of matches){
  if(m.status==='complete'){
   const a=byId[m.aId],b=byId[m.bId];
   if(a){a.played++;a.points+=m.scoreA;a.against+=m.scoreB;a.wins+=m.winnerId===m.aId?1:0;a.losses+=m.winnerId!==m.aId?1:0;}
   if(b){b.played++;b.points+=m.scoreB;b.against+=m.scoreA;b.wins+=m.winnerId===m.bId?1:0;b.losses+=m.winnerId!==m.bId?1:0;}
  }else if(swiss&&m.status==='bye'){
   const p=byId[m.winnerId];if(p){p.wins++;p.byes++;}
  }
 }
 for(const p of rows)p.diff=p.points-p.against;
 rows.sort((a,b)=>b.wins-a.wins||b.diff-a.diff||b.points-a.points||a.seed-b.seed);
 return rows.map((p,i)=>({...p,rank:i+1}));
}

function makeRoundRobin(e){
 const rounds=makeRoundRobinMatches(e,e.seeds,'rr','round-robin'),matches=rounds.flatMap(r=>r.matches);
 const standings=makeStandings(e,e.seeds,matches,false);
 const complete=matches.every(m=>m.status==='complete'||m.status==='bye');
 return {rounds,standings,champion:complete?standings[0]?.id||null:null};
}

function makeSwiss(e){
 const ids=e.seeds,goal=Math.min(8,Math.max(1,Number(e.swissRounds)||Math.ceil(Math.log2(ids.length))+1)),rounds=[],played=new Set(),byes=new Set();
 let previous=[];
 for(let round=1;round<=goal;round++){
  if(round>1&&previous.some(m=>m.status==='waiting'||m.status==='ready'))break;
  const priorMatches=rounds.flatMap(r=>r.matches),ranked=makeStandings(e,ids,priorMatches,true);
  let ordered=round===1?ids.slice():ranked.map(x=>x.id);
  let oddBye=null;
  if(ordered.length%2){
   oddBye=[...ordered].reverse().find(x=>!byes.has(x))||ordered.at(-1);
   ordered=ordered.filter(x=>x!==oddBye);
  }
  const pairs=[];
  if(round===1){
   const half=ordered.length/2;
   for(let i=0;i<half;i++)pairs.push([ordered[i],ordered[i+half]]);
  }else{
   while(ordered.length){
    const a=ordered.shift(),aRecord=ranked.find(p=>p.id===a);
    let bestIndex=0,best=Infinity;
    for(let i=0;i<ordered.length;i++){
     const b=ordered[i],br=ranked.find(p=>p.id===b),key=[a,b].sort().join('|');
     const penalty=(played.has(key)?10000:0)+Math.abs(aRecord.wins-br.wins)*150+i;
     if(penalty<best){best=penalty;bestIndex=i;}
    }
    const b=ordered.splice(bestIndex,1)[0];pairs.push([a,b]);
   }
  }
  if(oddBye){pairs.push([oddBye,null]);byes.add(oddBye);}
  const matches=pairs.map(([a,b],i)=>makeDuel(e,'s'+round+'m'+(i+1),slot(a),slot(b),'swiss',round,i+1));
  rounds.push({id:'swiss-'+round,stage:'swiss',round,label:'Swiss round '+round,matches});
  for(const m of matches)if(m.aId&&m.bId)played.add([m.aId,m.bId].sort().join('|'));
  previous=matches;
 }
 const standings=makeStandings(e,ids,rounds.flatMap(r=>r.matches),true);
 const complete=rounds.length===goal&&previous.every(m=>m.status==='complete'||m.status==='bye');
 return {rounds,standings,champion:complete?standings[0]?.id||null:null,plannedRounds:goal};
}

function makeGroups(e){
 const ids=e.seeds,n=ids.length,g=n<6?1:n<12?2:n<24?4:8,groups=Array.from({length:g},()=>[]);
 ids.forEach((id,i)=>{const j=i%g,k=Math.floor(i/g),idx=k%2===0?j:g-1-j;groups[idx].push(id);});
 const groupStats=[],rounds=[];let groupsDone=true;
 for(let i=0;i<groups.length;i++){
  const stage='group-'+String.fromCharCode(65+i),rr=makeRoundRobinMatches(e,groups[i],'g'+(i+1)+'r',stage);
  for(const rd of rr)rounds.push({...rd,label:stage.replace('group-','Group ')+' · '+rd.label});
  const matches=rr.flatMap(x=>x.matches),standings=makeStandings(e,groups[i],matches,false);
  groupStats.push({group:String.fromCharCode(65+i),standings});
  if(!matches.every(m=>m.status==='complete'||m.status==='bye'))groupsDone=false;
 }
 let champion=null,playoffSize=0;
 if(groupsDone){
  const qualifiers=groupStats.flatMap(x=>x.standings.slice(0,2).map(p=>p.id));
  playoffSize=qualifiers.length;
  let pairs=[];
  if(g===1)pairs=[[qualifiers[0],qualifiers[1]]];
  else{
   for(let i=0;i<g;i+=2){
    const a=groupStats[i].standings,b=groupStats[i+1].standings;
    pairs.push([a[0]?.id,b[1]?.id],[b[0]?.id,a[1]?.id]);
   }
  }
  const positions=pairs.flat().filter(Boolean),po=makeElimination(e,positions,'p','playoffs',true);
  rounds.push(...po.rounds.map((r,i)=>({...r,label:i===po.rounds.length-1?'Championship final':'Playoff round '+(i+1)})));
  champion=po.champion;
 }
 return {rounds,groupStats,champion,groupsDone,playoffSize};
}

function generate(e){
 if(!e.started||!(e.seeds?.length>=2))return {rounds:[],champion:null,complete:false,matchCount:0,completed:0,format:e.format||'single-elimination'};
 const format=e.format||'single-elimination',out=format==='double-elimination'?makeDouble(e):format==='round-robin'?makeRoundRobin(e):format==='swiss'?makeSwiss(e):format==='groups-playoffs'?makeGroups(e):makeElimination(e,e.seeds);
 const rounds=out.rounds||[],matches=rounds.flatMap(x=>x.matches);
 return {...out,rounds,format,complete:!!out.champion,matchCount:matches.filter(m=>m.aId&&m.bId).length,completed:matches.filter(m=>m.status==='complete').length,byes:matches.filter(m=>m.status==='bye').length};
}

export {generate,makeStandings,bracketSeeds};
