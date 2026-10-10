export type Track={id:string;title:string;asset_id:string;duration:number;lyrics:string;credits:string;created_at:number;position?:number;release_id?:string};
export type Release={id:string;title:string;type:string;release_date:string;cover_id:string|null;description:string;status:string;publish_at:number|null;created_at:number;tracks:Track[]};
export type QueueItem=Track&{releaseId:string;releaseTitle:string;coverId:string|null};
export const releaseTypes=["Single","EP","LP / Mixtape","Album"];
export function time(seconds:number){if(!Number.isFinite(seconds))return "0:00";return `${Math.floor(seconds/60)}:${String(Math.floor(seconds%60)).padStart(2,"0")}`;}
export function media(id:string){return `/api/media/${id}`;}
