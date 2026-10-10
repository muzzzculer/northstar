import { ReleaseDetail } from "@/components/northstar/catalogue";
export default async function ReleasePage({params}:{params:Promise<{id:string}>}){const {id}=await params;return <ReleaseDetail id={id}/>;}
