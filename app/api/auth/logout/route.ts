import { clearSession } from "@/lib/session";
export async function POST(request:Request){if(request.headers.get("origin")!==new URL(request.url).origin)return Response.json({error:"Invalid origin."},{status:403});await clearSession();return Response.redirect(new URL("/",request.url),303);}
