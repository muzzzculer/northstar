import { catalogue, fail, json } from "@/lib/server";
export async function GET(){try{return json({releases:await catalogue()});}catch(e){return fail(e);}}
