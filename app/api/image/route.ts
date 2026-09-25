import { imageData } from '@/lib/game';
export const runtime='nodejs';
export async function GET(req:Request){try{const url=new URL(req.url);const image=await imageData(url.searchParams.get('game')||'',url.searchParams.get('card')||'');return new Response(new Uint8Array(image.data),{headers:{'Content-Type':image.mime,'Cache-Control':'private, max-age=86400'}});}catch{return new Response('Image unavailable',{status:404});}}
