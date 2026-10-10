import { Pool } from 'pg';
import {readFile} from 'node:fs/promises';
if(!process.env.DATABASE_URL)throw new Error('Set DATABASE_URL before running setup.');
const pool=new Pool({connectionString:process.env.DATABASE_URL,max:1});
try{await pool.query(await readFile(new URL('../supabase/schema.sql',import.meta.url),'utf8'));console.log('NorthStar schema is ready. Existing records were preserved.');}finally{await pool.end();}
