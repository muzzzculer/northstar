import { redirect } from "next/navigation";
import { session } from "@/lib/session";
export type ChatGPTUser={userId:string|null;displayName:string;email:string;fullName:string|null};
export async function getChatGPTUser():Promise<ChatGPTUser|null>{const s=await session();return s?{userId:s.userId,displayName:s.email,email:s.email,fullName:null}:null;}
export async function requireChatGPTUser(_returnTo:string){const user=await getChatGPTUser();if(!user)redirect("/login");return user;}
export function chatGPTSignInPath(_returnTo:string){return "/login";}
export function chatGPTSignOutPath(_returnTo="/"){return "/login";}

