import { serveTournament } from '../tournaments/netlify-handler.mjs';
export default async function handler(request) {
  return serveTournament(request,'/api/rewards');
}

