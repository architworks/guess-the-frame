import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
test('movie queue, private answers, judging, hints, scoring, persistence and completion',async()=>{
 const cwd=process.cwd();const dir=await mkdtemp(path.join(tmpdir(),'movie-test-'));process.chdir(dir);
 const originalFetch=globalThis.fetch;process.env.GEMINI_API_KEY='test-only';let selected=0;let verdict='incorrect';let imageCalls=0;
 globalThis.fetch=async(_url,options)=>{const body=JSON.parse(String(options?.body));let part;if(body.generationConfig.responseModalities){imageCalls++;part={inlineData:{mimeType:'image/png',data:Buffer.from('test image').toString('base64')}};}else if(body.systemInstruction.parts[0].text.startsWith('You judge')){part={text:JSON.stringify({verdict})};}else{selected++;part={text:JSON.stringify({title:`Test Film ${selected}`,year:2000+selected,aliases:[],style:'plot',imagePrompt:'Three isolated objects on warm ivory background',explanation:'A private plot connection.',hints:['First clue','Second clue','Third clue']})};}return Response.json({candidates:[{content:{parts:[part]}}]});};
 try{const {createGame,getGame,publicGame,action}=await import('../lib/game');
 const initial=await createGame({players:['One','Two'],preferences:'Bollywood',rounds:5,hintLimit:2});const game=await getGame(initial.id);
 async function ready(count:number){for(let n=0;n<100;n++){if(game.cards.length===count&&game.cards.every(c=>c.status==='ready'))return;await new Promise(r=>setTimeout(r,10));}assert.fail('Queue did not complete');}
 assert.equal(initial.timerSeconds,120);game.timerSeconds=60;assert.equal(publicGame(game).timerSeconds,60);await ready(4);assert.equal(selected,4);assert.equal(imageCalls,4);assert.equal(publicGame(game).queue,3);
 const publicJson=JSON.stringify(publicGame(game));assert(!publicJson.includes('Test Film'));assert(!publicJson.includes('private plot'));assert(!publicJson.includes('First clue'));
 const cardId=game.cards[0].id;
 await action(game,{action:'guess',cardId,guess:'wrong'});assert.equal(game.cards[0].revealed,false);
 verdict='clarify';const unclear=await action(game,{action:'guess',cardId,guess:'partial'});assert.equal(unclear.verdict,'clarify');assert.equal(game.cards[0].revealed,false);
 for(let i=0;i<3;i++)await action(game,{action:'hint',cardId});assert.equal(game.cards[0].hints,2);
 await assert.rejects(action(game,{action:'award',cardId,player:0}));
 verdict='correct';await action(game,{action:'guess',cardId,guess:'correct'});assert.equal(publicGame(game).card?.answer?.title,'Test Film 1');
 await assert.rejects(action(game,{action:'next',cardId}));await action(game,{action:'award',cardId,player:1});await assert.rejects(action(game,{action:'award',cardId,player:1}));assert.equal(game.players[1].score,1);
 await action(game,{action:'next',cardId});await ready(5);assert.equal(selected,5);
 await assert.rejects(action(game,{action:'reveal',cardId}));
 for(let i=1;i<5;i++){const id=game.cards[i].id;await action(game,{action:'reveal',cardId:id});await assert.rejects(action(game,{action:'award',cardId:id,player:0}));await action(game,{action:'next',cardId:id});}
 assert(game.ended);assert.equal(game.players[0].score,0);assert.equal(game.players[1].score,1);assert.equal(selected,5);
 const saved=JSON.parse(await (await import('node:fs/promises')).readFile(path.join(dir,'.data',game.id+'.json'),'utf8'));assert(saved.ended);assert.equal(saved.players[1].score,1);
 }finally{globalThis.fetch=originalFetch;delete process.env.GEMINI_API_KEY;process.chdir(cwd);await rm(dir,{recursive:true,force:true});}
});
