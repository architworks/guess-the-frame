import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { conceptSchema, type Concept } from './gemini';

function key(){const secret=process.env.GEMINI_API_KEY;if(!secret)throw new Error('Set GEMINI_API_KEY in the server environment.');return createHash('sha256').update('guess-the-movie/card-token/v1:').update(secret).digest();}
export function seal(concept:Concept){const iv=randomBytes(12);const cipher=createCipheriv('aes-256-gcm',key(),iv);const encrypted=Buffer.concat([cipher.update(JSON.stringify(concept),'utf8'),cipher.final()]);return Buffer.concat([iv,cipher.getAuthTag(),encrypted]).toString('base64url');}
export function unseal(token:string){if(token.length>12000)throw new Error('Invalid card token.');try{const data=Buffer.from(token,'base64url');if(data.length<29)throw new Error();const decipher=createDecipheriv('aes-256-gcm',key(),data.subarray(0,12));decipher.setAuthTag(data.subarray(12,28));return conceptSchema.parse(JSON.parse(Buffer.concat([decipher.update(data.subarray(28)),decipher.final()]).toString('utf8')));}catch{throw new Error('This card is invalid or its server key has changed. Start a new game.');}}
