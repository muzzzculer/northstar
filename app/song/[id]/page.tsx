import { SongDetail } from "@/components/northstar/song";
export const metadata={title:"Song · NorthStar"};
export default async function SongPage({params}:{params:Promise<{id:string}>}){const {id}=await params;return <SongDetail id={id}/>;}
