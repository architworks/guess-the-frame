import { test } from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { POST } from '../app/api/game/route';
import { unseal } from '../lib/card-token';

test('stateless cards keep answers encrypted, render compact images, and support judging and hints',async()=>{
 const previous=globalThis.fetch;const key=process.env.GEMINI_API_KEY;process.env.GEMINI_API_KEY='test-key';let selections=0;
 const png=await sharp({create:{width:1600,height:1000,channels:3,background:'#f7e8cb'}}).png().toBuffer();
 globalThis.fetch=async (_url,options)=>{const body=JSON.parse(String(options?.body));let part;
  if(body.generationConfig.responseModalities)part={inlineData:{mimeType:'image/png',data:png.toString('base64')}};
  else if(body.systemInstruction.parts[0].text.startsWith('You judge'))part={text:JSON.stringify({verdict:'correct'})};
  else {selections++;part={text:JSON.stringify({title:`Test Movie ${selections}`,year:2001+selections,aliases:[],style:'plot',imagePrompt:'A tiny house on a warm ivory background',explanation:'A plot clue.',hints:['First','Second','Third']})};}
  return Response.json({candidates:[{content:{parts:[part]}}]});};
 const request=(data:unknown)=>new Request('http://localhost:3000/api/game',{method:'POST',headers:{'content-type':'application/json','origin':'http://localhost:3000','host':'localhost:3000'},body:JSON.stringify(data)});
 try{const first=await POST(request({action:'generate',preferences:'Bollywood after 2000',history:[]}));assert.equal(first.status,200);const card=await first.json();assert.match(card.image,/^data:image\/jpeg;base64,/);assert.equal(unseal(card.token).title,'Test Movie 1');assert(!JSON.stringify(card).includes('Test Movie 1'));assert(JSON.stringify(card).length<4_500_000);
  const second=await POST(request({action:'generate',preferences:'Bollywood after 2000',history:[card.token]}));assert.equal(unseal((await second.json()).token).title,'Test Movie 2');
  const hint=await POST(request({action:'hint',token:card.token,index:0}));assert.equal((await hint.json()).hint,'First');
  const judged=await POST(request({action:'judge',token:card.token,guess:'Test Movie 1'}));assert.equal((await judged.json()).answer.title,'Test Movie 1');
  const revealed=await POST(request({action:'reveal',token:card.token}));assert.equal((await revealed.json()).answer.year,2002);
  const tampered=await POST(request({action:'reveal',token:card.token.slice(0,-2)+'xx'}));assert.equal(tampered.status,400);
 }finally{globalThis.fetch=previous;if(key===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=key;}
});
