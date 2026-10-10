import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';
import {PGlite} from '@electric-sql/pglite';
const engine=new PGlite();
await engine.exec('CREATE ROLE anon; CREATE ROLE authenticated;');
await engine.exec(await readFile('supabase/schema.sql','utf8'));
class Pool {
 async query(sql,args=[]){const r=await engine.query(sql,args);return {rows:r.rows,rowCount:r.affectedRows};}
 async connect(){return {query:this.query,release(){}};}
}
async function load(path,require,extras={}){const exports={};vm.runInNewContext(ts.transpileModule(await readFile(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports,require,process:{env:{DATABASE_URL:'test',NORTHSTAR_SESSION_SECRET:'test-secret-with-at-least-32-characters',SUPABASE_URL:'https://project.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'test-admin'}},Buffer,Date,fetch:extras.fetch,...extras});return exports;}
const dbModule=await load('lib/database.ts',name=>name==='pg'?{Pool}:null);
const db=dbModule.database;
after(()=>engine.close());
test('PostgreSQL adapter preserves binding, timestamps, counts, and insert retry deduplication',async()=>{
 await db.prepare('INSERT INTO assets (id,object_key,kind,filename,content_type,size,created_at) VALUES (?,?,?,?,?,?,?)').bind('a','audio/a.wav','audio','a.wav','audio/wav',100,1).run();
 await db.prepare('INSERT INTO tracks (id,title,asset_id,duration,created_at) VALUES (?,?,?,?,?)').bind('t','Song','a',60,1).run();
 await db.prepare('INSERT INTO releases (id,title,type,release_date,status,created_at) VALUES (?,?,?,?,?,?)').bind('r','Album','Album','2026-10-10','published',1).run();
 await db.prepare('INSERT INTO release_tracks (release_id,track_id,position) VALUES (?,?,?)').bind('r','t',1).run();
 const insert=db.prepare('INSERT OR IGNORE INTO streams (id,dedup_key,track_id,release_id,listener_key,created_at) VALUES (?,?,?,?,?,?)').bind('s','play:s','t','r','listener',1791633600000);
 assert.equal((await insert.run()).meta.changes,1);assert.equal((await insert.run()).meta.changes,0);
 const count=await db.prepare('SELECT COUNT(*) streams FROM streams').first();assert.equal(count.streams,1);
 const day=await db.prepare("SELECT strftime('%Y-%m-%d',created_at/1000,'unixepoch') date,COUNT(*) streams FROM streams GROUP BY date").first();assert.match(day.date,/^2026-10-10$/);
});
test('Release batches roll back all changes on a failed track reference',async()=>{
 await assert.rejects(db.batch([db.prepare('UPDATE releases SET title=? WHERE id=?').bind('Broken','r'),db.prepare('INSERT INTO release_tracks (release_id,track_id,position) VALUES (?,?,?)').bind('r','missing',2)]));
 assert.equal((await db.prepare('SELECT title FROM releases WHERE id=?').bind('r').first()).title,'Album');
});
test('Migration schema blocks anonymous Data API access and is safe to rerun',async()=>{
 await engine.exec(await readFile('supabase/schema.sql','utf8'));
 const result=await engine.query("SELECT relrowsecurity FROM pg_class WHERE relname='streams'");assert.equal(result.rows[0].relrowsecurity,true);
 const rights=await engine.query("SELECT has_table_privilege('anon','tracks','SELECT') allowed");assert.equal(rights.rows[0].allowed,false);
});
test('Creator cookies reject tampering and ignore incoming authentication headers',async()=>{
 const crypto=await import('node:crypto');let cookie;
 const auth=await load('lib/session.ts',name=>name==='node:crypto'?crypto:name==='next/headers'?{cookies:async()=>({get:()=>cookie?{value:cookie}:null})}:null);
 assert.equal(await auth.session(),null);
 cookie=auth.makeSession('owner@example.com','user');assert.equal((await auth.session()).email,'owner@example.com');
 cookie+='tampered';assert.equal(await auth.session(),null);
});
test('Upload tickets cannot be changed to overwrite another file',async()=>{
 const crypto=await import('node:crypto');const module=await load('lib/upload-ticket.ts',()=>crypto);
 const value=module.ticket({key:'audio/new.wav',size:100});assert.equal(module.readTicket(value).key,'audio/new.wav');
 assert.throws(()=>module.readTicket(value+'tampered'));
});
test('Media signing uses private storage and keeps administrative keys on the server',async()=>{
 let request;
 const storage=await load('lib/supabase.ts',()=>null,{fetch:async(url,options)=>{request={url,options};return {ok:true,json:async()=>({signedURL:'/object/sign/northstar/audio/song.wav?token=temporary'})};}});
 assert.equal(await storage.signedDownload('audio/song.wav'),'https://project.supabase.co/storage/v1/object/sign/northstar/audio/song.wav?token=temporary');
 assert.equal(request.url,'https://project.supabase.co/storage/v1/object/sign/northstar/audio/song.wav');
 assert.equal(request.options.headers.Authorization,'Bearer test-admin');
 assert.equal(JSON.parse(request.options.body).expiresIn,3600);
});
