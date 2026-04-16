import{useState,useEffect}from"react";
import{getLotes,getSaude,saveSaude,deleteSaude,getAnimais}from"../db";
import{Btn,Input,Select}from"../components/FormElements";
import Modal from"../components/Modal";
import Card from"../components/Card";

const TIPOS=[{value:"vacina",label:"Vacina"},{value:"vermifugo",label:"Vermífugo"},{value:"tratamento",label:"Tratamento"},{value:"outro",label:"Outro"}];
const ICONS={vacina:"💉",vermifugo:"🔬",tratamento:"🩺",outro:"📋"};
const HOJE=new Date().toISOString().slice(0,10);
function fmtData(s){if(!s)return"";const[y,m,d]=s.split("-");return`${d}/${m}/${y}`}

export default function Saude({user}){
  const[lotes,setLotes]=useState([]);const[loteId,setLoteId]=useState("");
  const[registros,setRegistros]=useState([]);const[animais,setAnimais]=useState([]);
  const[modal,setModal]=useState(false);const[deleteModal,setDeleteModal]=useState(null);
  const[saving,setSaving]=useState(false);
  const[form,setForm]=useState({data:HOJE,tipo:"vacina",animalId:"",produto:"",dose:"",proxDose:"",obs:""});

  useEffect(()=>{(async()=>{
    const ls=await getLotes(user.email);setLotes(ls);
    if(ls.length>0)setLoteId(ls[0].id);
  })()},[user.email]);

  useEffect(()=>{if(!loteId)return;(async()=>{
    const[r,a]=await Promise.all([getSaude(loteId),getAnimais(loteId)]);
    setRegistros(r);setAnimais(a);
  })()},[loteId]);

  const recarregar=async()=>{
    const[r,a]=await Promise.all([getSaude(loteId),getAnimais(loteId)]);
    setRegistros(r);setAnimais(a);
  };

  const salvar=async()=>{
    if(!form.produto.trim()||saving)return;
    setSaving(true);
    await saveSaude({...form,ownerEmail:user.email,loteId});
    setModal(false);await recarregar();setSaving(false);
  };

  const hoje=new Date().toISOString().slice(0,10);
  const proximas=registros.filter(r=>r.proxDose&&r.proxDose>=hoje).sort((a,b)=>a.proxDose.localeCompare(b.proxDose));
  const vencidas=registros.filter(r=>r.proxDose&&r.proxDose<hoje);

  return(<div style={{padding:"0 4px"}}>
    <h2 style={{color:"#f1f5f9",margin:"0 0 16px",fontSize:20,fontWeight:700}}>Saúde do Rebanho</h2>

    {lotes.length>0&&<div style={{marginBottom:14}}>
      <select value={loteId} onChange={e=>setLoteId(e.target.value)} style={{width:"100%",padding:"12px 16px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,color:"#f1f5f9",fontSize:14,outline:"none",colorScheme:"dark"}}>
        {lotes.map(l=><option key={l.id} value={l.id} style={{background:"#0e1a0e"}}>{l.nome}</option>)}
      </select>
    </div>}

    {proximas.length>0&&<div style={{background:"rgba(245,158,11,.08)",borderRadius:14,padding:"12px 16px",marginBottom:12,border:"1px solid rgba(245,158,11,.2)"}}>
      <div style={{color:"#fbbf24",fontSize:11,fontWeight:700,marginBottom:8}}>⏰ PRÓXIMAS DOSES</div>
      {proximas.slice(0,3).map(r=><div key={r.id} style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
        <span style={{color:"#f1f5f9",fontSize:13}}>{ICONS[r.tipo]} {r.produto}</span>
        <span style={{color:"#f59e0b",fontSize:12,fontWeight:600}}>{fmtData(r.proxDose)}</span>
      </div>)}
    </div>}

    {vencidas.length>0&&<div style={{background:"rgba(239,68,68,.08)",borderRadius:14,padding:"12px 16px",marginBottom:12,border:"1px solid rgba(239,68,68,.2)"}}>
      <div style={{color:"#fca5a5",fontSize:11,fontWeight:700,marginBottom:4}}>⚠️ DOSES VENCIDAS ({vencidas.length})</div>
      <div style={{color:"#64748b",fontSize:12}}>Há aplicações em atraso. Consulte seu veterinário.</div>
    </div>}

    <button onClick={()=>{setForm({data:HOJE,tipo:"vacina",animalId:"",produto:"",dose:"",proxDose:"",obs:""});setModal(true)}} style={{width:"100%",background:"linear-gradient(135deg,#16a34a,#15803d)",border:"none",borderRadius:12,padding:"11px",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",marginBottom:14}}>+ Registrar Aplicação</button>

    {registros.map(r=>{
      const animal=animais.find(a=>a.id===r.animalId);
      const atrasado=r.proxDose&&r.proxDose<hoje;
      return(<Card key={r.id}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div style={{flex:1}}>
            <div style={{color:"#f1f5f9",fontWeight:600,fontSize:14}}>{ICONS[r.tipo]||"📋"} {r.produto}</div>
            <div style={{color:"#64748b",fontSize:12,marginTop:2}}>
              {TIPOS.find(t=>t.value===r.tipo)?.label} · {fmtData(r.data)}
              {animal&&<span> · 🏷️ {animal.brinco}</span>}
              {!r.animalId&&<span> · Lote completo</span>}
            </div>
            {r.dose&&<div style={{color:"#94a3b8",fontSize:11,marginTop:2}}>Dose: {r.dose}</div>}
            {r.proxDose&&<div style={{color:atrasado?"#ef4444":"#4ade80",fontSize:11,marginTop:2,fontWeight:600}}>
              {atrasado?"⚠️ Próxima dose: "+fmtData(r.proxDose)+" (ATRASADO)":"✓ Próxima: "+fmtData(r.proxDose)}
            </div>}
          </div>
          <button onClick={()=>setDeleteModal(r)} style={{background:"none",border:"none",color:"#475569",cursor:"pointer",fontSize:14}}>✕</button>
        </div>
      </Card>);
    })}
    {registros.length===0&&loteId&&<div style={{textAlign:"center",padding:"30px 0",color:"#475569"}}>Nenhum registro de saúde</div>}
    {!loteId&&<div style={{textAlign:"center",padding:"30px 0",color:"#475569"}}>Crie um lote primeiro</div>}

    <Modal open={modal} onClose={()=>setModal(false)} title="Registrar Aplicação">
      <Select label="Tipo" value={form.tipo} onChange={e=>setForm({...form,tipo:e.target.value})} options={TIPOS}/>
      <Input label="Produto" value={form.produto} onChange={e=>setForm({...form,produto:e.target.value})} placeholder="Ex: Aftosa, Ivermectina, Vitamina..."/>
      <Select label="Aplicado em" value={form.animalId} onChange={e=>setForm({...form,animalId:e.target.value})} options={[{value:"",label:"Lote completo"},...animais.filter(a=>a.status==="ativo").map(a=>({value:a.id,label:"🏷️ Brinco "+a.brinco}))]}/>
      <Input label="Data de aplicação" type="date" value={form.data} onChange={e=>setForm({...form,data:e.target.value})}/>
      <Input label="Dose / Quantidade" value={form.dose||""} onChange={e=>setForm({...form,dose:e.target.value})} placeholder="Ex: 5ml, 1 comprimido..."/>
      <Input label="Data da próxima dose (opcional)" type="date" value={form.proxDose||""} onChange={e=>setForm({...form,proxDose:e.target.value})}/>
      <Input label="Observações" value={form.obs||""} onChange={e=>setForm({...form,obs:e.target.value})} placeholder="Veterinário, lote do produto..."/>
      <Btn onClick={salvar} disabled={saving}>{saving?"Salvando...":"Salvar Registro"}</Btn>
    </Modal>

    <Modal open={!!deleteModal} onClose={()=>setDeleteModal(null)} title="Excluir registro">
      {deleteModal&&<>
        <p style={{color:"#94a3b8",fontSize:14,marginBottom:20,textAlign:"center"}}>Excluir registro de <strong style={{color:"#f1f5f9"}}>{deleteModal.produto}</strong>?</p>
        <div style={{display:"flex",gap:8}}>
          <Btn onClick={()=>setDeleteModal(null)} color="rgba(255,255,255,0.06)" style={{flex:1,border:"1px solid rgba(255,255,255,0.08)",color:"#94a3b8"}}>Cancelar</Btn>
          <Btn onClick={async()=>{await deleteSaude(deleteModal.id);setDeleteModal(null);await recarregar()}} color="linear-gradient(135deg,#ef4444,#dc2626)" style={{flex:1}}>Excluir</Btn>
        </div>
      </>}
    </Modal>
  </div>);
}
