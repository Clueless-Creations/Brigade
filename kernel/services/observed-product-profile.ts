import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { PRODUCT_PROFILE_API_VERSION } from "../../contracts/product-profile/index.js";
type Observation={id:string;subjectRef:string;statement:string;sourceId:string;sourceLocator:string;contentDigest:string;modality:"screenshot"|"video"|"accessibility"|"measurement"|"reported";environment:string;observedAt:string;direct:boolean};
const sha=(v:string)=>`sha256:${createHash("sha256").update(v).digest("hex")}`;
export function buildObservedProductProfile(input:{product:{id:string;name:string;versionId:string;label:string|null;build:string|null};environmentId:string;observations:readonly Observation[];generatedAt:string}){
 const sources=input.observations.map(o=>({id:o.sourceId,owner:"evidence-store",locator:o.sourceLocator,revision:o.contentDigest,contentDigest:o.contentDigest,derivedFrom:[]}));
 const elements=[...new Set(input.observations.map(o=>o.subjectRef))].map(id=>({id,kind:id.split(":")[0],name:id,claimRefs:input.observations.filter(o=>o.subjectRef===id).map(o=>`claim:${o.id}`)}));
 const evidence=input.observations.map(o=>({id:`evidence:${o.id}`,sourceRef:o.sourceId,subjectRefs:[o.subjectRef],modality:o.modality==="reported"?"text":o.modality,environment:o.environment,directness:o.direct?"direct":"derived",derivedFrom:[],observedAt:o.observedAt,scope:"Caller-supplied accepted runtime evidence."}));
 const claims=input.observations.map(o=>({id:`claim:${o.id}`,subjectRef:o.subjectRef,statement:o.statement,status:o.direct?"observed":"inferred",sourceRefs:[o.sourceId],evidenceRefs:[`evidence:${o.id}`],...(!o.direct?{reason:"Derived from caller-supplied evidence; not direct device proof."}:{})}));
 const profile:any={apiVersion:PRODUCT_PROFILE_API_VERSION,id:`profile:${input.product.id.replace(/^product:/,"")}-observed`,revision:"sha256:"+"0".repeat(64),mode:"observed",product:{id:input.product.id,name:input.product.name,version:{id:input.product.versionId,label:input.product.label,build:input.product.build},claimRefs:[]},provenance:{generatedAt:input.generatedAt,producer:{id:"brigade:observed-profile",version:"1",method:"observation"},sources},elements,relationships:[],claims,evidence,coverage:[],unknowns:[],extensions:{}};
 const copy={...profile};delete copy.revision;profile.revision=sha(JSON.stringify(copy));return profile;
}
export function buildObservedProductProfileFromFile(file:string){return buildObservedProductProfile(JSON.parse(readFileSync(path.resolve(file),"utf8")))}
