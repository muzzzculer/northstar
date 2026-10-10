import { catalogue, db, fail, json, requireOwner } from "@/lib/server";
export async function GET(){try{await requireOwner();return json({releases:await catalogue(true),tracks:(await db().prepare("SELECT * FROM tracks WHERE deleted_at IS NULL ORDER BY created_at DESC").all()).results});}catch(e){return fail(e);}}
