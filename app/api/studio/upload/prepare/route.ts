import { AppError, body, fail, json, requireOwner } from "@/lib/server";
import { storagePath, storageRequest, supabaseURL } from "@/lib/supabase";
import { ticket } from "@/lib/upload-ticket";
export async function POST(request:Request){try{
  await requireOwner(request);const b=await body(request),audio=b.kind==="audio";
  if(!["audio","cover"].includes(b.kind)||typeof b.filename!=="string"||!b.filename||b.filename.length>500)throw new AppError("Choose an audio file or cover.");
  const ext=b.filename.split(".").pop()?.toLowerCase();
  if(!(audio?["mp3","wav"]:["png","jpg","jpeg"]).includes(ext??""))throw new AppError("Choose an MP3/WAV song or JPG/PNG cover.");
  if(!Number.isSafeInteger(b.size)||b.size<=0||b.size>(audio?100:10)*1024*1024)throw new AppError("File exceeds the upload limit.",413);
  const id=crypto.randomUUID(),key=b.kind+"/"+id+"."+ext,contentType=ext==="mp3"?"audio/mpeg":ext==="wav"?"audio/wav":ext==="png"?"image/png":"image/jpeg";
  const r=await storageRequest(storagePath(key).replace("/object/","/object/upload/sign/"),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({})});const d=await r.json();if(!r.ok||!d.url)throw new AppError("Couldn't prepare the upload. Check your storage settings.",503);
  return json({id,url:supabaseURL()+"/storage/v1"+d.url,contentType,ticket:ticket({id,key,kind:b.kind,filename:b.filename,size:b.size,contentType,ext})});
}catch(e){return fail(e);}}
