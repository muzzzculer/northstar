import { requireChatGPTUser, chatGPTSignOutPath } from "@/app/chatgpt-auth";
import { isOwner } from "@/lib/server";
import { LockKeyhole } from "lucide-react";
export const dynamic="force-dynamic";
export const metadata={title:"Creator Studio",robots:{index:false,follow:false}};
export default async function StudioLayout({children}:{children:React.ReactNode}){
  await requireChatGPTUser("/studio");if(!(await isOwner()))return <section className="access-denied"><LockKeyhole size={38}/><h1>This studio is private.</h1><p>Only the NorthStar creator can manage releases and see analytics. You're still welcome to listen to the music.</p><a className="primary-button" href="/">Listen to NorthStar</a><br/><form action="/api/auth/logout" method="POST"><button className="text-link">Sign out</button></form></section>;return children;
}
