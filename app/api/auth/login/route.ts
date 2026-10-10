import { body, fail, json, AppError } from "@/lib/server";
import { supabaseURL } from "@/lib/supabase";
import { makeSession, saveSession } from "@/lib/session";
export async function POST(request:Request){try{
  if(request.headers.get("origin")!==new URL(request.url).origin)throw new AppError("Invalid request origin.",403);
  const b=await body(request);if(typeof b.email!=="string"||typeof b.password!=="string"||b.password.length>1000)throw new AppError("Enter your email and password.");
  const key=process.env.SUPABASE_ANON_KEY;if(!key)throw new AppError("Creator login isn't configured.",503);
  const response=await fetch(supabaseURL()+"/auth/v1/token?grant_type=password",{method:"POST",headers:{apikey:key,"Content-Type":"application/json"},body:JSON.stringify({email:b.email,password:b.password}),cache:"no-store"});
  const data=await response.json();
  if(!response.ok||!data.user?.email||!data.user?.id||!data.user.email_confirmed_at||data.user.email.toLowerCase()!==process.env.NORTHSTAR_OWNER_EMAIL?.toLowerCase())throw new AppError("The creator email or password is incorrect.",401);
  await saveSession(makeSession(data.user.email,data.user.id));return json({ok:true});
}catch(e){return fail(e);}}
