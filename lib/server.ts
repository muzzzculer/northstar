import { database } from "./database";
const env=process.env;
import { getChatGPTUser } from "@/app/chatgpt-auth";
export class AppError extends Error { constructor(message:string,public status=400){ super(message); } }
export function db(){return database;}
export async function isOwner(){ const user=await getChatGPTUser();return !!(user?.email&&env.NORTHSTAR_OWNER_EMAIL&&user.email.toLowerCase()===env.NORTHSTAR_OWNER_EMAIL.toLowerCase()); }
export async function requireOwner(request?:Request){
  if(!(await isOwner()))throw new AppError("Only the NorthStar creator can access this.",403);
  if(request){const origin=request.headers.get("origin");if(origin&&origin!==new URL(request.url).origin)throw new AppError("Cross-site requests are not allowed.",403);}
}
export function json(value:unknown,status=200,headers:Record<string,string>={}){return Response.json(value,{status,headers:{"Cache-Control":"no-store",...headers}});}
export function fail(error:unknown){console.error("NorthStar request failed",error instanceof Error?error.message:"unknown");return json({error:error instanceof AppError?error.message:"Something went wrong. Your changes have not been completed; please try again."},error instanceof AppError?error.status:500);}
export function string(value:unknown,label:string,max=300,optional=false){if(typeof value!=="string"||(!optional&&!value.trim())||value.length>max)throw new AppError(`${label} is required and must be no longer than ${max} characters.`);return value.trim();}
export async function body(request:Request):Promise<Record<string,any>>{if(Number(request.headers.get("content-length"))>150000)throw new AppError("This request is too large.",413);const value=await request.json().catch(()=>{throw new AppError("Invalid request.");});if(!value||typeof value!=="object"||Array.isArray(value))throw new AppError("Invalid request.");return value as Record<string,any>;}
export const RELEASE_TYPES=["Single","EP","LP / Mixtape","Album"];
// Every public surface evaluates the same saved release time against the
// server clock. A scheduled release needs no visitor or creator to publish it.
export function publicReleaseWhere(alias=""){const p=alias?`${alias}.`:"";return `(${p}deleted_at IS NULL AND (${p}status='published' OR (${p}status='scheduled' AND ${p}publish_at IS NOT NULL AND ${p}publish_at<=?)))`;}
export async function assetExists(id:string,kind:string){const a=await db().prepare("SELECT id FROM assets WHERE id = ? AND kind = ?").bind(id,kind).first();if(!a)throw new AppError(`Please upload a valid ${kind} file first.`);}
export async function catalogue(admin=false){
  const now=Date.now();
  const releaseQuery=db().prepare(`SELECT * FROM releases ${admin?"WHERE deleted_at IS NULL":`WHERE ${publicReleaseWhere()}`} ORDER BY release_date DESC, created_at DESC`);
  const trackQuery=db().prepare(`SELECT t.*, rt.release_id, rt.position FROM release_tracks rt JOIN tracks t ON t.id = rt.track_id JOIN releases r ON r.id=rt.release_id ${admin?"WHERE r.deleted_at IS NULL AND t.deleted_at IS NULL":`WHERE t.deleted_at IS NULL AND ${publicReleaseWhere("r")}`} ORDER BY rt.position`);
  const r=await (admin?releaseQuery:releaseQuery.bind(now)).all(),t=await (admin?trackQuery:trackQuery.bind(now)).all();
  return r.results.map((release:any)=>({...release,status:release.status==="scheduled"&&release.publish_at!==null&&release.publish_at<=now?"published":release.status,tracks:t.results.filter((track:any)=>track.release_id===release.id)}));
}
export async function listener(request:Request){
  const cookie=request.headers.get("cookie")?.match(/(?:^|;\s*)ns_listener=([a-zA-Z0-9-]{36})/);const id=cookie?.[1]??crypto.randomUUID();
  if(!env.NORTHSTAR_ANALYTICS_SALT)throw new AppError("Stream counting is temporarily unavailable.",503);
  const hash=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(env.NORTHSTAR_ANALYTICS_SALT+id));
  const key=Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,"0")).join("");
  return {key,header:cookie?{}:{"Set-Cookie":`ns_listener=${id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000${new URL(request.url).protocol==="https:"?"; Secure":""}`}};
}
