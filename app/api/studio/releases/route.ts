import { AppError, RELEASE_TYPES, assetExists, body, db, fail, json, requireOwner, string } from "@/lib/server";
export async function POST(request:Request){return save(request);}
export async function PATCH(request:Request){return save(request);}
async function save(request:Request){try{
  await requireOwner(request);const b=await body(request);const title=string(b.title,"Release title"),type=string(b.type,"Release type"),releaseDate=string(b.releaseDate,"Release date");
  if(!RELEASE_TYPES.includes(type))throw new AppError("Choose Single, EP, LP / Mixtape, or Album.");
  if(!/^\d{4}-\d{2}-\d{2}$/.test(releaseDate)||!Number.isFinite(Date.parse(releaseDate))||new Date(releaseDate).toISOString().slice(0,10)!==releaseDate)throw new AppError("Choose a valid release date.");
  const ids=b.trackIds;if(!Array.isArray(ids)||ids.length>150||ids.some(x=>typeof x!=="string")||new Set(ids).size!==ids.length)throw new AppError("Choose unique songs in your tracklist.");
  if(type==="Single"&&ids.length>1)throw new AppError("A single must contain exactly one song.");
  const status=b.status;if(!["draft","scheduled","published"].includes(status))throw new AppError("Invalid release status.");
  const publishAt=status==="scheduled"?b.publishAt:null;
  if(status==="scheduled"&&(typeof publishAt!=="number"||!Number.isSafeInteger(publishAt)||publishAt<=Date.now()||publishAt>253402300799999))throw new AppError("Choose a release date and time in the future.");
  const coverId=b.coverId?string(b.coverId,"Artwork"):null;if(coverId)await assetExists(coverId,"cover");
  if(status!=="draft"&&(!coverId||ids.length<1))throw new AppError("Add cover artwork and at least one song before publishing or scheduling.");
  if(status!=="draft"&&type!=="Single"&&ids.length<2)throw new AppError("An EP, LP / Mixtape, or Album needs at least two songs.");
  if(ids.length){const found=await db().prepare(`SELECT id FROM tracks WHERE deleted_at IS NULL AND id IN (${ids.map(()=>"?").join(",")})`).bind(...ids).all();if(found.results.length!==ids.length)throw new AppError("One or more songs no longer exist.");}
  const id=b.id?string(b.id,"Release"):crypto.randomUUID();const description=string(b.description??"","Release notes",5000,true);
  if(b.id&&!(await db().prepare("SELECT id FROM releases WHERE id=? AND deleted_at IS NULL").bind(id).first()))throw new AppError("Release not found.",404);
  const statements=[db().prepare("INSERT INTO releases (id,title,type,release_date,cover_id,description,status,publish_at,created_at) VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,type=excluded.type,release_date=excluded.release_date,cover_id=excluded.cover_id,description=excluded.description,status=excluded.status,publish_at=excluded.publish_at").bind(id,title,type,releaseDate,coverId,description,status,publishAt,Date.now()),db().prepare("DELETE FROM release_tracks WHERE release_id=?").bind(id),...ids.map((trackId,i)=>db().prepare("INSERT INTO release_tracks (release_id,track_id,position) VALUES (?,?,?)").bind(id,trackId,i+1))];
  await db().batch(statements);return json({id,status,publishAt},b.id?200:201);
}catch(e){return fail(e);}}
export async function DELETE(request:Request){try{
  await requireOwner(request);const b=await body(request),id=string(b.id,"Release");
  const result=await db().prepare("UPDATE releases SET deleted_at=? WHERE id=? AND status='draft' AND deleted_at IS NULL").bind(Date.now(),id).run();
  if(!result.meta.changes){const found=await db().prepare("SELECT id FROM releases WHERE id=? AND deleted_at IS NULL").bind(id).first();throw new AppError(found?"Only drafts can be deleted. Unpublish or cancel the schedule first.":"Draft not found.",found?409:404);}
  return json({id,deleted:true});
}catch(e){return fail(e);}}
