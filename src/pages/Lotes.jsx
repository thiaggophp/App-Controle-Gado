import{useState,useEffect}from"react";
import{getLotes,saveLote,deleteLote,getFazendas,saveFazenda}from"../db";
import{Btn,Input,Select}from"../components/FormElements";
import Modal from"../components/Modal";
import Card from"../components/Card";

const RACAS=["Nelore","Angus","Brangus","Brahman","Guzera","Simental","Hereford","Limousin","Mestiço","Outra"];
const STATUS=[{value:"ativo",label:"Em engorda"},{value:"parcial",label:"Vendido parcialmente"},{value:"vendido",label:"Vendido / Encerrado"}];

function fmtData(s){if(!s)return"";const[y,m,d]=s.split("-");return`${d}/${m}/${y}`}

export default function Lotes({user,onAbrirLote}){
  const[lotes,setLotes]=useState([]);const[fazendas,setFazendas]=useState([]);
  const[modal,setModal]=useState(false);const[fazendaModal,setFazendaModal]=useState(false);
  const[deleteModal,setDeleteModal]=useState(null);
  const[edit,setEdit]=useState(null);
  const[filtro,setFiltro]=useState("ativo");
  const[form,setForm]=useState({nome:"",dataEntrada:new Date().toISOString().slice(0,10),racaPredominante:"Nelore",fazendaId:"",qtdEntrada:0,pesoMedioEntrada:0,valorCabeca:0,procedencia:"",obs:""});
  const[nomeFazenda,setNomeFazenda]=useState("");const[cidadeFazenda,setCidadeFazenda]=useState("");

  const recarregar=async()=>{setLotes(await getLotes(user.email));setFazendas(await getFazendas(user.email))};
  useEffect(()=>{recarregar()},[user.email]);

  const abrirNovo=()=>{setEdit(null);setForm({nome:"",dataEntrada:new Date().toISOString().slice(0,10),racaPredominante:"Nelore",fazendaId:fazendas[0]?.id||"",qtdEntrada:"",pesoMedioEntrada:"",valorCabeca:"",procedencia:"",obs:""});setModal(true)};
  const abrirEditar=(l)=>{setEdit(l);setForm({...l});setModal(true)};

  const salvar=async()=>{
    if(!form.nome.trim()){return}
    const l={...form,ownerEmail:user.email,status:form.status||"ativo",qtdEntrada:parseInt(form.qtdEntrada)||0,pesoMedioEntrada:parseFloat(form.pesoMedioEntrada)||0,valorCabeca:parseFloat(form.valorCabeca)||0};
    if(edit)l.id=edit.id;
    await saveLote(l);setModal(false);await recarregar();
  };

  const excluir=async(l)=>{await deleteLote(l.id);setDeleteModal(null);await recarregar()};

  const salvarFazenda=async()=>{
    if(!nomeFazenda.trim())return;
    await saveFazenda({ownerEmail:user.email,nome:nomeFazenda.trim(),cidade:cidadeFazenda.trim()});
    setNomeFazenda("");setCidadeFazenda("");setFazendaModal(false);await recarregar();
  };

  const lotesFiltrados=lotes.filter(l=>filtro==="todos"||l.status===filtro);

  const diasEngorda=(l)=>{
    const entrada=new Date(l.dataEntrada+"T00:00");
    const hoje=new Date();hoje.setHours(0,0,0,0);
    return Math.max(0,Math.floor((hoje-entrada)/(1000*60*60*24)));
  };

  return(<div style={{padding:"0 4px"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <h2 style={{color:"#f1f5f9",margin:0,fontSize:20,fontWeight:700}}>Lotes</h2>
      <button onClick={abrirNovo} style={{background:"linear-gradient(135deg,#16a34a,#15803d)",border:"none",borderRadius:12,padding:"8px 16px",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>+ Novo Lote</button>
    </div>

    <div style={{display:"flex",gap:6,marginBottom:14,overflowX:"auto",paddingBottom:4}}>
      {[{v:"ativo",l:"Em engorda"},{v:"parcial",l:"Parcial"},{v:"vendido",l:"Encerrados"},{v:"todos",l:"Todos"}].map(f=>
        <button key={f.v} onClick={()=>setFiltro(f.v)} style={{padding:"6px 14px",borderRadius:20,border:"none",background:filtro===f.v?"#16a34a":"rgba(255,255,255,0.05)",color:filtro===f.v?"#fff":"#94a3b8",fontSize:12,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>{f.l}</button>
      )}
    </div>

    {lotesFiltrados.map(l=>{
      const dias=diasEngorda(l);
      const fazenda=fazendas.find(f=>f.id===l.fazendaId);
      return(<div key={l.id} style={{background:"#111a11",borderRadius:18,marginBottom:10,border:"1px solid rgba(255,255,255,0.06)",overflow:"hidden"}}>
        <div onClick={()=>onAbrirLote(l)} style={{padding:"16px",cursor:"pointer"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                <span style={{color:"#f1f5f9",fontWeight:700,fontSize:16}}>🐄 {l.nome}</span>
                <span style={{background:l.status==="ativo"?"rgba(22,163,74,.15)":l.status==="vendido"?"rgba(59,130,246,.15)":"rgba(245,158,11,.15)",color:l.status==="ativo"?"#4ade80":l.status==="vendido"?"#60a5fa":"#fbbf24",fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20}}>
                  {l.status==="ativo"?"Em engorda":l.status==="vendido"?"Encerrado":"Parcial"}
                </span>
              </div>
              <div style={{color:"#64748b",fontSize:12}}>{l.racaPredominante} · {l.qtdEntrada} cabeças · {fmtData(l.dataEntrada)}</div>
              {fazenda&&<div style={{color:"#475569",fontSize:11,marginTop:2}}>📍 {fazenda.nome}{fazenda.cidade?" — "+fazenda.cidade:""}</div>}
              {l.procedencia&&<div style={{color:"#475569",fontSize:11,marginTop:1}}>🛒 {l.procedencia}</div>}
            </div>
            {l.status==="ativo"&&<div style={{background:"rgba(22,163,74,.1)",borderRadius:12,padding:"8px 12px",textAlign:"center",flexShrink:0}}>
              <div style={{color:"#4ade80",fontSize:18,fontWeight:800}}>{dias}</div>
              <div style={{color:"#64748b",fontSize:10}}>dias</div>
            </div>}
          </div>
        </div>
        <div style={{borderTop:"1px solid rgba(255,255,255,0.04)",padding:"8px 16px",display:"flex",gap:8}}>
          <button onClick={()=>abrirEditar(l)} style={{background:"rgba(22,163,74,.08)",border:"1px solid rgba(22,163,74,.2)",borderRadius:8,padding:"5px 14px",color:"#86efac",fontSize:12,fontWeight:600,cursor:"pointer"}}>Editar</button>
          <button onClick={()=>setDeleteModal(l)} style={{background:"rgba(239,68,68,.08)",border:"1px solid rgba(239,68,68,.2)",borderRadius:8,padding:"5px 14px",color:"#ef4444",fontSize:12,fontWeight:600,cursor:"pointer"}}>Excluir</button>
        </div>
      </div>);
    })}

    {lotesFiltrados.length===0&&<div style={{textAlign:"center",padding:"40px 0",color:"#475569"}}>
      <div style={{fontSize:36,marginBottom:8}}>📋</div>
      <div style={{fontSize:14}}>Nenhum lote {filtro==="ativo"?"em engorda":filtro==="vendido"?"encerrado":""}</div>
    </div>}

    <Modal open={modal} onClose={()=>setModal(false)} title={edit?"Editar Lote":"Novo Lote"}>
      <Input label="Nome do lote" value={form.nome} onChange={e=>setForm({...form,nome:e.target.value})} placeholder="Ex: Lote Março 2025"/>
      <Input label="Data de entrada" type="date" value={form.dataEntrada} onChange={e=>setForm({...form,dataEntrada:e.target.value})}/>
      <Select label="Raça predominante" value={form.racaPredominante} onChange={e=>setForm({...form,racaPredominante:e.target.value})} options={RACAS.map(r=>({value:r,label:r}))}/>
      <Input label="Quantidade de cabeças na entrada" type="number" value={form.qtdEntrada} onChange={e=>setForm({...form,qtdEntrada:e.target.value})} placeholder="0" inputMode="numeric"/>
      <Input label="Peso médio de entrada (kg)" type="number" value={form.pesoMedioEntrada} onChange={e=>setForm({...form,pesoMedioEntrada:e.target.value})} placeholder="0" inputMode="decimal"/>
      <Input label="Valor por cabeça (R$)" type="number" value={form.valorCabeca} onChange={e=>setForm({...form,valorCabeca:e.target.value})} placeholder="0,00" inputMode="decimal"/>
      <div style={{marginBottom:16}}>
        <label style={{display:"block",color:"#64748b",fontSize:11,marginBottom:6,fontWeight:700,textTransform:"uppercase",letterSpacing:.8}}>Fazenda</label>
        <div style={{display:"flex",gap:8}}>
          <select value={form.fazendaId} onChange={e=>setForm({...form,fazendaId:e.target.value})} style={{flex:1,padding:"13px 16px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,color:"#f1f5f9",fontSize:14,outline:"none",colorScheme:"dark"}}>
            <option value="" style={{background:"#0e1a0e"}}>— Sem fazenda —</option>
            {fazendas.map(f=><option key={f.id} value={f.id} style={{background:"#0e1a0e"}}>{f.nome}</option>)}
          </select>
          <button onClick={()=>setFazendaModal(true)} style={{background:"rgba(22,163,74,.1)",border:"1px solid rgba(22,163,74,.2)",borderRadius:12,padding:"0 14px",color:"#86efac",fontSize:13,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>+ Nova</button>
        </div>
      </div>
      {edit&&<Select label="Status" value={form.status} onChange={e=>setForm({...form,status:e.target.value})} options={STATUS}/>}
      <Input label="Procedência (de onde veio o gado)" value={form.procedencia||""} onChange={e=>setForm({...form,procedencia:e.target.value})} placeholder="Ex: Fazenda Boa Vista, leilão Barretos..."/>
      <Input label="Observações (opcional)" value={form.obs||""} onChange={e=>setForm({...form,obs:e.target.value})} placeholder="Condições, detalhes adicionais..."/>
      <Btn onClick={salvar}>{edit?"Salvar Alterações":"Criar Lote"}</Btn>
    </Modal>

    <Modal open={fazendaModal} onClose={()=>setFazendaModal(false)} title="Nova Fazenda">
      <Input label="Nome da fazenda" value={nomeFazenda} onChange={e=>setNomeFazenda(e.target.value)} placeholder="Ex: Fazenda São João"/>
      <Input label="Cidade / Estado" value={cidadeFazenda} onChange={e=>setCidadeFazenda(e.target.value)} placeholder="Ex: Uberaba - MG"/>
      <Btn onClick={salvarFazenda}>Cadastrar Fazenda</Btn>
    </Modal>

    <Modal open={!!deleteModal} onClose={()=>setDeleteModal(null)} title="Excluir lote">
      {deleteModal&&<>
        <p style={{color:"#94a3b8",fontSize:14,marginBottom:20,textAlign:"center"}}>Excluir o lote <strong style={{color:"#f1f5f9"}}>{deleteModal.nome}</strong>? Todos os animais, pesagens e custos vinculados serão perdidos.</p>
        <div style={{display:"flex",gap:8}}>
          <Btn onClick={()=>setDeleteModal(null)} color="rgba(255,255,255,0.06)" style={{flex:1,border:"1px solid rgba(255,255,255,0.08)",color:"#94a3b8"}}>Cancelar</Btn>
          <Btn onClick={()=>excluir(deleteModal)} color="linear-gradient(135deg,#ef4444,#dc2626)" style={{flex:1}}>Excluir</Btn>
        </div>
      </>}
    </Modal>
  </div>);
}
