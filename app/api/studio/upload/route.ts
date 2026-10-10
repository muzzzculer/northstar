import { AppError, body, db, fail, json, requireOwner } from "@/lib/server";
import { storagePath, storageRequest } from "@/lib/supabase";
import { readTicket } from "@/lib/upload-ticket";
export async function POST(request:Request){try{
  await requireOwner(request);const b=await body(request);if(typeof b.ticket!=="string")throw new AppError("Upload confirmation is missing.");const t=readTicket(b.ticket);
  const head=await storageRequest(storagePath(t.key),{method:"HEAD"});
  if(!head.ok||Number(head.headers.get("content-length"))!==t.size)throw new AppError("Upload was interrupted or its size changed. Please retry.");
  const r=await storageRequest(storagePath(t.key),{headers:{Range:"bytes=0-11"}});
  if(!r.ok)throw new AppError("Couldn't verify the uploaded file.");
  const reader=r.body!.getReader(),part=await reader.read();await reader.cancel();const p=part.value??new Uint8Array(),text=new TextDecoder().decode(p.slice(0,12));
  const valid=t.ext==="wav"?text.startsWith("RIFF")&&text.slice(8,12)==="WAVE":t.ext==="mp3"?text.startsWith("ID3")||(p[0]===255&&(p[1]&224)===224):t.ext==="png"?p[0]===137&&text.slice(1,4)==="PNG":p[0]===255&&p[1]===216&&p[2]===255;
  if(!valid)throw new AppError("This file doesn't match its format.");
  await db().prepare("INSERT OR IGNORE INTO assets (id,object_key,kind,filename,content_type,size,created_at) VALUES (?,?,?,?,?,?,?)").bind(t.id,t.key,t.kind,t.filename,t.contentType,t.size,Date.now()).run();
  return json({id:t.id,filename:t.filename,contentType:t.contentType},201);
}catch(e){return fail(e);}}
