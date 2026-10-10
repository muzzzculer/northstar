import { signedDownload } from "@/lib/supabase";
import { AppError, db, fail, isOwner, publicReleaseWhere } from "@/lib/server";
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){return serve(request,params);}
export async function HEAD(request:Request,{params}:{params:Promise<{id:string}>}){return serve(request,params,true);}
async function serve(request:Request,params:Promise<{id:string}>,head=false){try{
  const {id}=await params;const a:any=await db().prepare("SELECT * FROM assets WHERE id=?").bind(id).first();if(!a)throw new AppError("File not found.",404);
  const published=await db().prepare(`SELECT r.id FROM releases r LEFT JOIN release_tracks rt ON rt.release_id=r.id LEFT JOIN tracks t ON t.id=rt.track_id WHERE ${publicReleaseWhere("r")} AND (r.cover_id=? OR t.asset_id=?) LIMIT 1`).bind(Date.now(),id,id).first();
  if(!published&&!(await isOwner()))throw new AppError("File not found.",404);
  const headers=new Headers({"Content-Type":a.content_type,"Accept-Ranges":"bytes","X-Content-Type-Options":"nosniff","Cache-Control":"private, no-store","Content-Disposition":"inline"});
  let offset=0,length=a.size,partial=false;const range=request.headers.get("range");
  if(range){const m=range.match(/^bytes=(\d*)-(\d*)$/);if(!m||(!m[1]&&!m[2]))return new Response(null,{status:416,headers:{"Content-Range":`bytes */${a.size}`}});if(!m[1]){length=Math.min(Number(m[2]),a.size);offset=a.size-length;}else{offset=Number(m[1]);const end=m[2]?Number(m[2]):a.size-1;length=Math.min(end,a.size-1)-offset+1;}if(!Number.isSafeInteger(offset)||offset<0||length<=0||offset>=a.size)return new Response(null,{status:416,headers:{"Content-Range":`bytes */${a.size}`}});partial=true;headers.set("Content-Range",`bytes ${offset}-${offset+length-1}/${a.size}`);}
  headers.set("Content-Length",String(length));if(head)return new Response(null,{status:partial?206:200,headers});
  return new Response(null,{status:307,headers:{"Location":await signedDownload(a.object_key),"Cache-Control":"private, no-store"}});
}catch(e){return fail(e);}}
