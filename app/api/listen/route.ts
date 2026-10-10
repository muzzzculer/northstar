import { AppError, body, db, fail, json, listener, publicReleaseWhere } from "@/lib/server";
export async function POST(request:Request){try{
  const origin=request.headers.get("origin");if(origin&&origin!==new URL(request.url).origin)throw new AppError("Cross-site requests are not allowed.",403);
  const b=await body(request);
  // Older open players may still send heartbeats; starts now count immediately.
  if(b.action==="heartbeat")return json({counted:true});
  if(b.action!=="start")throw new AppError("Invalid listening event.");
  const now=Date.now(),l=await listener(request);
  const track=await db().prepare(`SELECT t.id FROM tracks t JOIN release_tracks rt ON rt.track_id=t.id JOIN releases r ON r.id=rt.release_id WHERE t.id=? AND r.id=? AND ${publicReleaseWhere("r")}`).bind(b.trackId??"",b.releaseId??"",now).first();
  if(!track)throw new AppError("Song isn't available.",404);
  const id=b.playId??crypto.randomUUID();
  if(typeof id!=="string"||!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id))throw new AppError("Invalid play identifier.");
  await db().prepare("INSERT OR IGNORE INTO streams (id,dedup_key,track_id,release_id,listener_key,created_at) VALUES (?,?,?,?,?,?)").bind(id,`play:${id}`,b.trackId,b.releaseId,l.key,now).run();
  return json({sessionId:id,counted:true},201,l.header as Record<string,string>);
}catch(e){return fail(e);}}
