import { z } from 'zod';
import sharp from 'sharp';
import { concept, generate, judge, textModel, type Concept } from '@/lib/gemini';
import { seal, unseal } from '@/lib/card-token';
export const runtime='nodejs';export const dynamic='force-dynamic';export const maxDuration=300;
const requestSchema=z.discriminatedUnion('action',[
 z.object({action:z.literal('generate'),preferences:z.string().max(1000),history:z.array(z.string().max(12000)).max(30)}),
 z.object({action:z.literal('judge'),token:z.string().min(1).max(12000),guess:z.string().trim().min(1).max(200)}),
 z.object({action:z.literal('hint'),token:z.string().min(1).max(12000),index:z.number().int().min(0).max(2)}),
 z.object({action:z.literal('reveal'),token:z.string().min(1).max(12000)}),
]);
function failure(e:unknown){return Response.json({error:e instanceof z.ZodError?e.issues[0].message:e instanceof Error?e.message:'Something went wrong.'},{status:400});}
function sameOrigin(req:Request){const origin=req.headers.get('origin');if(!origin)return true;try{const requested=new URL(req.url);const actual=new URL(origin);return actual.host===(req.headers.get('host')||requested.host)&&actual.protocol===requested.protocol;}catch{return false;}}
function duplicate(candidate:Concept,history:Concept[]){const normal=(s:string)=>s.toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');return history.some(c=>c.year===candidate.year&&[c.title,...c.aliases].some(title=>[candidate.title,...candidate.aliases].some(other=>normal(title)===normal(other))));}
export async function POST(req:Request){try{
 if(!sameOrigin(req))return Response.json({error:'Invalid origin.'},{status:403});
 if(!process.env.GEMINI_API_KEY)throw new Error('Set GEMINI_API_KEY in the server environment.');
 const input=requestSchema.parse(await req.json());
 if(input.action==='judge'){const c=unseal(input.token);const verdict=await judge(c,input.guess);return Response.json({verdict,answer:verdict==='correct'?{title:c.title,year:c.year,explanation:c.explanation}:undefined});}
 if(input.action==='hint')return Response.json({hint:unseal(input.token).hints[input.index]});
 if(input.action==='reveal'){const c=unseal(input.token);return Response.json({answer:{title:c.title,year:c.year,explanation:c.explanation}});}
 const history=input.history.map(unseal);let selected:Concept|undefined;
 for(let attempt=0;attempt<3;attempt++){const candidate=await concept(input.preferences,history);if(!duplicate(candidate,history)){selected=candidate;break;}}
 if(!selected)throw new Error('The director repeated a movie. Retry for a fresh pick.');
 const image=await generate(process.env.GEMINI_IMAGE_MODEL||'gemini-3.1-flash-image','Render only the described visual movie riddle. No text, typography, letters, logos, titles or watermarks. Minimal visual elements on a warm ivory background.',selected.imagePrompt,true);
 const jpeg=await sharp(Buffer.from(image.data,'base64')).resize({width:1280,height:900,fit:'inside',withoutEnlargement:true}).jpeg({quality:78,mozjpeg:true}).toBuffer();
 if(jpeg.byteLength>2_800_000)throw new Error('The generated image is too large. Please retry this card.');
 return Response.json({token:seal(selected),image:`data:image/jpeg;base64,${jpeg.toString('base64')}`},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return failure(e);}}
