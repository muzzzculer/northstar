import {Pool} from 'pg';
import {readFile} from 'node:fs/promises';
const tables={
 assets:['id','object_key','kind','filename','content_type','size','created_at'],
 tracks:['id','title','asset_id','duration','lyrics','credits','created_at','deleted_at'],
 releases:['id','title','type','release_date','cover_id','description','status','created_at','publish_at','deleted_at'],
 release_tracks:['release_id','track_id','position'],
 streams:['id','dedup_key','track_id','release_id','listener_key','created_at'],
 listen_sessions:['id','track_id','release_id','listener_key','started_at','last_at','seconds','reported','counted']
};
if(!process.env.DATABASE_URL||!process.argv[2])throw new Error('Supply DATABASE_URL and the private export JSON path.');
const data=JSON.parse(await readFile(process.argv[2],'utf8'));
const pool=new Pool({connectionString:process.env.DATABASE_URL,max:1}),client=await pool.connect();
try{
 await client.query('BEGIN');
 for(const [table,columns] of Object.entries(tables)){
  if(!Array.isArray(data[table]))throw new Error('Export is missing table '+table);
  for(const row of data[table])await client.query('INSERT INTO '+table+' ('+columns.join(',')+') VALUES ('+columns.map((_,i)=>'$'+(i+1)).join(',')+')',columns.map(c=>row[c]??null));
  console.log('Imported '+data[table].length+' '+table+' rows.');
 }
 await client.query('COMMIT');
 console.log('Import completed. Verify file availability, scheduled visibility, and analytics before switching URLs.');
}catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();await pool.end();}
