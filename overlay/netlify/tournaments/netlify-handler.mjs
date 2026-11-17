import { getDatabase } from '@netlify/database';
import worker from './worker.mjs';
import { createDatabaseAdapter } from './pg-adapter.mjs';

/* The only entry point from the existing XY&Z site to its isolated tournament backend. */
export async function serveTournament(request,route) {
  try {
    const database=getDatabase();
    const adapted=createDatabaseAdapter(database.pool);
    const original=new URL(request.url);
    const internal=new URL(original);
    internal.pathname=route;
    const body=request.method==='GET'||request.method==='HEAD'?undefined:await request.text();
    const forwarded=new Request(internal.toString(),{
      method:request.method,headers:request.headers,
      body
    });
    const response=await worker.fetch(forwarded,{
      DB:adapted,
      HOST_CODE:process.env.TOURNAMENT_HOST_CODE||''
    },{});
    return response;
  }catch(error){
    console.error('Island Vibes tournament function:',String(error.message||error));
    return Response.json({error:'Tournament service temporarily unavailable',code:'DATABASE_UNAVAILABLE'},{
      status:503,headers:{'cache-control':'no-store','retry-after':'60'}
    });
  }
}

