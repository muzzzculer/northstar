import { db, fail, json, requireOwner, publicReleaseWhere } from "@/lib/server";
export async function GET(request:Request){try{await requireOwner();const days=Number(new URL(request.url).searchParams.get("days")??30);const allowed=[1,7,30,0];const d=allowed.includes(days)?days:30;const since=d?Date.now()-d*86400000:0;
  const results=await db().batch([
    db().prepare("SELECT COUNT(*) streams,COUNT(DISTINCT listener_key) listeners FROM streams WHERE created_at>=?").bind(since),
    db().prepare("SELECT t.id,t.title,COUNT(s.id) streams FROM tracks t LEFT JOIN streams s ON s.track_id=t.id AND s.created_at>=? GROUP BY t.id ORDER BY streams DESC,t.created_at DESC").bind(since),
    db().prepare("SELECT r.id,r.title,r.type,COUNT(s.id) streams FROM releases r LEFT JOIN streams s ON s.release_id=r.id AND s.created_at>=? GROUP BY r.id ORDER BY streams DESC,r.created_at DESC").bind(since),
    db().prepare("SELECT strftime('%Y-%m-%d',created_at/1000,'unixepoch') date,COUNT(*) streams FROM streams WHERE created_at>=? GROUP BY date ORDER BY date").bind(d?since:Date.now()-30*86400000),
    db().prepare(`SELECT COUNT(*) n FROM releases WHERE ${publicReleaseWhere()}`).bind(Date.now()),
  ]);return json({summary:results[0].results[0],tracks:results[1].results,releases:results[2].results,daily:results[3].results,published:results[4].results[0],days:d});
}catch(e){return fail(e);}}
