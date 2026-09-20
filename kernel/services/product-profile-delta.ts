export type DeltaStatus="matched"|"missing"|"extra"|"changed"|"unresolved";
export interface ProfileDeltaFinding{subjectId:string;status:DeltaStatus;intendedClaimIds:string[];observedClaimIds:string[];evidenceIds:string[]}
export function computeProductProfileDelta(intended:any,observed:any){
 if(intended.apiVersion!==observed.apiVersion)throw new Error("product_profile_delta.schema_mismatch");
 if(intended.product.id!==observed.product.id)throw new Error("product_profile_delta.product_mismatch");
 const i=new Map((intended.claims??[]).map((c:any)=>[c.subjectRef,c])),o=new Map((observed.claims??[]).map((c:any)=>[c.subjectRef,c]));
 const ids=[...new Set([...i.keys(),...o.keys()])].sort() as string[];
 const findings:ProfileDeltaFinding[]=ids.map(subjectId=>{const a:any=i.get(subjectId),b:any=o.get(subjectId);if(!a)return{subjectId,status:"extra",intendedClaimIds:[],observedClaimIds:[b.id],evidenceIds:b.evidenceRefs??[]};if(!b)return{subjectId,status:"unresolved",intendedClaimIds:[a.id],observedClaimIds:[],evidenceIds:[]};const status:DeltaStatus=a.statement===b.statement?"matched":b.status==="unknown"?"unresolved":"changed";return{subjectId,status,intendedClaimIds:[a.id],observedClaimIds:[b.id],evidenceIds:b.evidenceRefs??[]}});return{schemaVersion:1,intended:{id:intended.id,revision:intended.revision,version:intended.product.version.id},observed:{id:observed.id,revision:observed.revision,version:observed.product.version.id},findings};
}