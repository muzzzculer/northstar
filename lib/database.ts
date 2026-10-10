import { Pool, type PoolClient } from "pg";
let pool:Pool|undefined;
function connection(){if(!process.env.DATABASE_URL)throw new Error("DATABASE_URL is not configured.");return pool??=new Pool({connectionString:process.env.DATABASE_URL,max:2,idleTimeoutMillis:10000,connectionTimeoutMillis:10000});}
export function postgresSQL(sql:string){
  let i=0;sql=sql.replace(/\?/g,()=>"$"+(++i));
  if(sql.startsWith("INSERT OR IGNORE ")){sql=sql.replace("INSERT OR IGNORE ","INSERT ");sql+=" ON CONFLICT DO NOTHING";}
  return sql.replace("strftime('%Y-%m-%d',created_at/1000,'unixepoch')","to_char(to_timestamp(created_at/1000.0) AT TIME ZONE 'UTC','YYYY-MM-DD')");
}
// Keep millisecond timestamps and counts as numbers, matching the existing UI.
function rows(values:Record<string,any>[]){return values.map(row=>Object.fromEntries(Object.entries(row).map(([k,v])=>[k,typeof v==="string"&&/^(created_at|publish_at|deleted_at|started_at|last_at|streams|listeners|n|size)$/.test(k)?Number(v):v])));}
class Statement {
  constructor(readonly sql:string,readonly args:any[]=[]){}
  bind(...args:any[]){return new Statement(this.sql,args);}
  async execute(client?:PoolClient){const r=await (client??connection()).query(postgresSQL(this.sql),this.args);return {results:rows(r.rows),meta:{changes:r.rowCount??0}};}
  all(){return this.execute();}
  run(){return this.execute();}
  async first(){return (await this.execute()).results[0]??null;}
}
export const database={prepare:(sql:string)=>new Statement(sql),async batch(statements:Statement[]){
  const client=await connection().connect();
  try{await client.query("BEGIN");const result=[];for(const statement of statements)result.push(await statement.execute(client));await client.query("COMMIT");return result;}
  catch(e){await client.query("ROLLBACK");throw e;}finally{client.release();}
}};
