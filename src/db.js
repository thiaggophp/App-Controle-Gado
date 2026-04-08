import PocketBase from"pocketbase";
const PB_URL=import.meta.env.VITE_PB_URL||"https://api.financascasa.online";
export const pb=new PocketBase(PB_URL);

// ─── ACCOUNTS ───
export async function getAccount(email){try{return await pb.collection("gado_accounts").getFirstListItem(`email="${email}"`)}catch{return null}}
export async function getAllAccounts(){try{return await pb.collection("gado_accounts").getFullList()}catch{return[]}}
export async function saveAccount(acc){
  const existing=await pb.collection("gado_accounts").getFirstListItem(`email="${acc.email}"`).catch(()=>null);
  if(existing)return pb.collection("gado_accounts").update(existing.id,acc);
  return pb.collection("gado_accounts").create(acc);
}
export async function deleteAccount(email){try{const r=await pb.collection("gado_accounts").getFirstListItem(`email="${email}"`);await pb.collection("gado_accounts").delete(r.id)}catch{}}

// ─── SIGNUP REQUESTS ───
export async function getSignupRequests(){try{return await pb.collection("gado_signup_requests").getFullList()}catch{return[]}}
export async function addSignupRequest(req){
  const existing=await pb.collection("gado_signup_requests").getFirstListItem(`email="${req.email}"`).catch(()=>null);
  if(existing)return;
  await pb.collection("gado_signup_requests").create(req);
}
export async function deleteSignupRequest(email){try{const r=await pb.collection("gado_signup_requests").getFirstListItem(`email="${email}"`);await pb.collection("gado_signup_requests").delete(r.id)}catch{}}

// ─── FAZENDAS ───
export async function getFazendas(ownerEmail){try{return await pb.collection("gado_fazendas").getFullList({filter:`ownerEmail="${ownerEmail}"`})}catch{return[]}}
export async function saveFazenda(f){
  if(f.id)return pb.collection("gado_fazendas").update(f.id,f);
  const c=await pb.collection("gado_fazendas").create(f);f.id=c.id;return c;
}
export async function deleteFazenda(id){try{await pb.collection("gado_fazendas").delete(id)}catch{}}

// ─── LOTES ───
export async function getLotes(ownerEmail){try{return await pb.collection("gado_lotes").getFullList({filter:`ownerEmail="${ownerEmail}"`,sort:"-dataEntrada"})}catch{return[]}}
export async function saveLote(l){
  if(l.id)return pb.collection("gado_lotes").update(l.id,l);
  const c=await pb.collection("gado_lotes").create(l);l.id=c.id;return c;
}
export async function deleteLote(id){try{await pb.collection("gado_lotes").delete(id)}catch{}}

// ─── ANIMAIS ───
export async function getAnimais(loteId){try{return await pb.collection("gado_animais").getFullList({filter:`loteId="${loteId}"`,sort:"brinco"})}catch{return[]}}
export async function getAnimalByBrinco(ownerEmail,brinco){try{return await pb.collection("gado_animais").getFirstListItem(`ownerEmail="${ownerEmail}"&&brinco="${brinco}"`)}catch{return null}}
export async function saveAnimal(a){
  if(a.id)return pb.collection("gado_animais").update(a.id,a);
  const c=await pb.collection("gado_animais").create(a);a.id=c.id;return c;
}
export async function deleteAnimal(id){try{await pb.collection("gado_animais").delete(id)}catch{}}

// ─── PESAGENS ───
export async function getPesagens(loteId){try{return await pb.collection("gado_pesagens").getFullList({filter:`loteId="${loteId}"`,sort:"-data"})}catch{return[]}}
export async function getPesagensAnimal(animalId){try{return await pb.collection("gado_pesagens").getFullList({filter:`animalId="${animalId}"`,sort:"-data"})}catch{return[]}}
export async function savePesagem(p){
  if(p.id)return pb.collection("gado_pesagens").update(p.id,p);
  const c=await pb.collection("gado_pesagens").create(p);p.id=c.id;return c;
}
export async function deletePesagem(id){try{await pb.collection("gado_pesagens").delete(id)}catch{}}

// ─── CUSTOS ───
export async function getCustos(loteId){try{return await pb.collection("gado_custos").getFullList({filter:`loteId="${loteId}"`,sort:"-data"})}catch{return[]}}
export async function saveCusto(c){
  if(c.id)return pb.collection("gado_custos").update(c.id,c);
  const cr=await pb.collection("gado_custos").create(c);c.id=cr.id;return cr;
}
export async function deleteCusto(id){try{await pb.collection("gado_custos").delete(id)}catch{}}

// ─── VENDAS ───
export async function getVendas(loteId){try{return await pb.collection("gado_vendas").getFullList({filter:`loteId="${loteId}"`,sort:"-data"})}catch{return[]}}
export async function saveVenda(v){
  if(v.id)return pb.collection("gado_vendas").update(v.id,v);
  const c=await pb.collection("gado_vendas").create(v);v.id=c.id;return c;
}
export async function deleteVenda(id){try{await pb.collection("gado_vendas").delete(id)}catch{}}

// ─── SAÚDE ───
export async function getSaude(loteId){try{return await pb.collection("gado_saude").getFullList({filter:`loteId="${loteId}"`,sort:"-data"})}catch{return[]}}
export async function saveSaude(s){
  if(s.id)return pb.collection("gado_saude").update(s.id,s);
  const c=await pb.collection("gado_saude").create(s);s.id=c.id;return c;
}
export async function deleteSaude(id){try{await pb.collection("gado_saude").delete(id)}catch{}}

// ─── BACKUP ───
export async function exportAllData(ownerEmail){
  const fazendas=await getFazendas(ownerEmail);
  const lotes=await getLotes(ownerEmail);
  const animais=[],pesagens=[],custos=[],vendas=[],saude=[];
  for(const l of lotes){
    animais.push(...await getAnimais(l.id));
    pesagens.push(...await getPesagens(l.id));
    custos.push(...await getCustos(l.id));
    vendas.push(...await getVendas(l.id));
    saude.push(...await getSaude(l.id));
  }
  return{appName:"GadoControle",version:1,exportDate:new Date().toISOString(),ownerEmail,fazendas,lotes,animais,pesagens,custos,vendas,saude};
}
export async function importAllData(data){
  const fazIdMap={},loteIdMap={},animalIdMap={};
  for(const f of data.fazendas||[]){const oldId=f.id;f.id=null;const c=await saveFazenda(f);if(oldId)fazIdMap[oldId]=c.id;}
  for(const l of data.lotes||[]){
    if(l.fazendaId&&fazIdMap[l.fazendaId])l.fazendaId=fazIdMap[l.fazendaId];
    const oldId=l.id;l.id=null;const c=await saveLote(l);if(oldId)loteIdMap[oldId]=c.id;
  }
  for(const a of data.animais||[]){
    if(a.loteId&&loteIdMap[a.loteId])a.loteId=loteIdMap[a.loteId];
    const oldId=a.id;a.id=null;const c=await saveAnimal(a);if(oldId)animalIdMap[oldId]=c.id;
  }
  for(const p of data.pesagens||[]){
    if(p.loteId&&loteIdMap[p.loteId])p.loteId=loteIdMap[p.loteId];
    if(p.animalId&&animalIdMap[p.animalId])p.animalId=animalIdMap[p.animalId];
    p.id=null;await savePesagem(p);
  }
  for(const c of data.custos||[]){if(c.loteId&&loteIdMap[c.loteId])c.loteId=loteIdMap[c.loteId];c.id=null;await saveCusto(c);}
  for(const v of data.vendas||[]){if(v.loteId&&loteIdMap[v.loteId])v.loteId=loteIdMap[v.loteId];v.id=null;await saveVenda(v);}
  for(const s of data.saude||[]){
    if(s.loteId&&loteIdMap[s.loteId])s.loteId=loteIdMap[s.loteId];
    if(s.animalId&&animalIdMap[s.animalId])s.animalId=animalIdMap[s.animalId];
    s.id=null;await saveSaude(s);
  }
}

// ─── INIT ADMIN ───
export async function initAdmin(){
  // Admin account is created once via API — no credentials compiled into the bundle
}
