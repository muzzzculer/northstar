import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
const name="northstar_creator";
function secret(){const value=process.env.NORTHSTAR_SESSION_SECRET;if(!value||value.length<32)throw new Error("Configure a session secret of at least 32 characters.");return value;}
function sign(value:string){return createHmac("sha256",secret()).update(value).digest("base64url");}
export function makeSession(email:string,userId:string){const data=Buffer.from(JSON.stringify({email,userId,expires:Date.now()+12*3600000})).toString("base64url");return data+"."+sign(data);}
export async function session(){const raw=(await cookies()).get(name)?.value;if(!raw)return null;try{const [data,signature,...rest]=raw.split(".");if(rest.length||!data||!signature)return null;const expected=Buffer.from(sign(data)),actual=Buffer.from(signature);if(expected.length!==actual.length||!timingSafeEqual(expected,actual))return null;const value=JSON.parse(Buffer.from(data,"base64url").toString());if(value.expires<=Date.now()||typeof value.email!=="string"||typeof value.userId!=="string")return null;return value as {email:string;userId:string;expires:number};}catch{return null;}}
export async function saveSession(value:string){(await cookies()).set(name,value,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:12*3600});}
export async function clearSession(){(await cookies()).delete(name);}
