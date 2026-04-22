import{useState,useEffect}from"react";
import{getAnimais,saveAnimal,deleteAnimalCascade,getPesagens,savePesagem,deletePesagem,getCustos,saveCusto,deleteCusto,getVendas,saveVenda,saveLote}from"../db";
import{Btn,Input,InputMoney,Select}from"../components/FormElements";
import Modal from"../components/Modal";
import Card from"../components/Card";

const SEXO=[{value:"M",label:"Macho"},{value:"F",label:"Fêmea"}];
const RACAS=["Nelore","Angus","Brangus","Brahman","Guzera","Simental","Hereford","Limousin","Mestiço","Outra"];
const CATEGORIAS=["Bezerro(a)","Garrote(a)","Novilho/Novilha","Boi/Vaca"];
const CAUSAS_BAIXA=["Morte natural","Morte por doença","Abate de emergência","Venda avulsa","Descarte","Transferência","Furto/Abigeato","Outro"];
const TIPOS_CUSTO=["Ração/Silagem","Sal mineral/Suplemento","Vacina","Vermífugo","Remédio/Tratamento","Frete","Mão de obra","Pasto/Arrendamento","Outros"];
const HOJE=new Date().toISOString().slice(0,10);
function fmt(v){return(v||0).toLocaleString("pt-BR",{minimumFractionDigits:2})}
function fmtData(s){if(!s)return"";const[y,m,d]=s.split("-");return`${d}/${m}/${y}`}

export default function LoteDetalhe({lote,user,onVoltar}){
  const[aba,setAba]=useState("animais");
  const[animais,setAnimais]=useState([]);
  const[pesagens,setPesagens]=useState([]);
  const[custos,setCustos]=useState([]);
  const[vendas,setVendas]=useState([]);

  // Modais
  const[animalModal,setAnimalModal]=useState(false);
  const[pesagemModal,setPesagemModal]=useState(false);
  const[custoModal,setCustoModal]=useState(false);
  const[vendaModal,setVendaModal]=useState(false);
  const[deleteModal,setDeleteModal]=useState(null);
  const[baixaModal,setBaixaModal]=useState(false);const[causaBaixa,setCausaBaixa]=useState("");

  // Formulários
  const[buscaBrinco,setBuscaBrinco]=useState("");
  const[animalForm,setAnimalForm]=useState({brinco:"",categoria:"Novilho/Novilha",sexo:"M",raca:"Nelore",pesoEntrada:"",dataEntrada:HOJE,obs:""});
  const[editAnimal,setEditAnimal]=useState(null);
  const[pesagemForm,setPesagemForm]=useState({tipo:"lote",animalId:"",data:HOJE,peso:"",obs:""});
  const[custoForm,setCustoForm]=useState({data:HOJE,tipo:"Ração/Silagem",valor:"",descricao:""});
  const[editCusto,setEditCusto]=useState(null);
  const[vendaForm,setVendaForm]=useState({data:HOJE,qtdAnimais:"",arrobas:"",valorArroba:"",comprador:"",obs:""});
  const[simValorArroba,setSimValorArroba]=useState("");const[simRendimento,setSimRendimento]=useState("50");
  const[saving,setSaving]=useState(false);
  const[saveErr,setSaveErr]=useState("");

  const recarregar=async()=>{
    const[a,p,c,v]=await Promise.all([getAnimais(lote.id),getPesagens(lote.id),getCustos(lote.id),getVendas(lote.id)]);
    setAnimais(a);setPesagens(p);setCustos(c);setVendas(v);
  };
  useEffect(()=>{recarregar()},[lote.id]);

  // ── ANIMAIS ──
  const salvarAnimal=async()=>{
    if(!animalForm.brinco.trim()){setSaveErr("Informe o número do brinco");return;}
    if(!(parseFloat(animalForm.pesoEntrada)>0)){setSaveErr("Informe o peso de entrada");return;}
    setSaving(true);setSaveErr("");
    try{
      const a={...animalForm,ownerEmail:user.email,loteId:lote.id,pesoEntrada:parseFloat(animalForm.pesoEntrada)||0,status:"ativo"};
      if(editAnimal)a.id=editAnimal.id;
      await saveAnimal(a);setAnimalModal(false);setEditAnimal(null);await recarregar();
    }catch{setSaveErr("Erro ao salvar animal. Verifique a conexão.")}
    setSaving(false);
  };
  const excluirAnimal=async()=>{setSaving(true);await deleteAnimalCascade(deleteModal.id);setDeleteModal(null);await recarregar();setSaving(false)};
  const abrirAnimal=(a)=>{setEditAnimal(a);setAnimalForm({...a,categoria:a.categoria||"Novilho/Novilha",pesoEntrada:String(a.pesoEntrada)});setSaveErr("");setAnimalModal(true)};
  const baixaAnimal=async(a,causa)=>{await saveAnimal({...a,status:"baixa",causaBaixa:causa});await recarregar()};

  // ── PESAGENS ──
  const salvarPesagem=async()=>{
    if(!pesagemForm.peso){setSaveErr("Informe o peso");return;}
    if(pesagemForm.tipo==="individual"&&!pesagemForm.animalId){setSaveErr("Selecione o animal");return;}
    setSaving(true);setSaveErr("");
    try{
      const p={...pesagemForm,ownerEmail:user.email,loteId:lote.id,peso:parseFloat(pesagemForm.peso)||0};
      if(p.tipo==="lote")p.animalId="";
      await savePesagem(p);setPesagemModal(false);await recarregar();
    }catch{setSaveErr("Erro ao salvar pesagem.")}
    setSaving(false);
  };

  // ── CUSTOS ──
  const salvarCusto=async()=>{
    if(!custoForm.valor){setSaveErr("Informe o valor do custo");return;}
    setSaving(true);setSaveErr("");
    try{
      const c={...custoForm,ownerEmail:user.email,loteId:lote.id,valor:parseFloat(custoForm.valor)||0};
      if(editCusto)c.id=editCusto.id;
      await saveCusto(c);setCustoModal(false);setEditCusto(null);await recarregar();
    }catch{setSaveErr("Erro ao salvar custo.")}
    setSaving(false);
  };
  const excluirCusto=async()=>{setSaving(true);await deleteCusto(deleteModal.id);setDeleteModal(null);await recarregar();setSaving(false)};

  // ── VENDAS ──
  const salvarVenda=async()=>{
    if(!(parseInt(vendaForm.qtdAnimais)>0)){setSaveErr("Informe a quantidade de animais vendidos");return;}
    if(!vendaForm.arrobas){setSaveErr("Informe o total de arrobas");return;}
    if(!vendaForm.valorArroba){setSaveErr("Informe o valor por arroba");return;}
    setSaving(true);setSaveErr("");
    try{
      const arrobas=parseFloat(vendaForm.arrobas)||0;
      const valorArroba=parseFloat(vendaForm.valorArroba)||0;
      const total=arrobas*valorArroba;
      const v={...vendaForm,ownerEmail:user.email,loteId:lote.id,qtdAnimais:parseInt(vendaForm.qtdAnimais)||0,arrobas,valorArroba,total};
      await saveVenda(v);
      const animaisAtivos=animais.filter(a=>a.status==="ativo").length;
      const vendidos=vendas.reduce((s,v)=>s+v.qtdAnimais,0)+(parseInt(vendaForm.qtdAnimais)||0);
      if(vendidos>=animaisAtivos)await saveLote({...lote,status:"vendido"});
      else if(vendidos>0)await saveLote({...lote,status:"parcial"});
      setVendaModal(false);await recarregar();
    }catch{setSaveErr("Erro ao salvar venda.")}
    setSaving(false);
  };

  // ── CÁLCULOS ──
  const totalCustos=custos.reduce((s,c)=>s+c.valor,0);
  const totalReceita=vendas.reduce((s,v)=>s+v.total,0);
  const custoCompra=(lote.qtdEntrada||0)*(lote.valorCabeca||0);
  const lucro=totalReceita-totalCustos-custoCompra;
  const animaisAtivos=animais.filter(a=>a.status==="ativo");

  // Custo por arroba
  const ultPesagemLote=pesagens.filter(p=>!p.animalId).sort((a,b)=>b.data.localeCompare(a.data))[0];
  const pesoMedioAtual=ultPesagemLote?ultPesagemLote.peso:(lote.pesoMedioEntrada||0);
  const arrobasAtuais=pesoMedioAtual>0?((pesoMedioAtual*animaisAtivos.length)||pesoMedioAtual*(lote.qtdEntrada||1))/15:0;
  const totalInvestido=custoCompra+totalCustos;
  const custoPorArroba=arrobasAtuais>0?totalInvestido/arrobasAtuais:0;

  const gmd=(a)=>{
    const pesAgora=pesagens.filter(p=>p.animalId===a.id).sort((x,y)=>y.data.localeCompare(x.data));
    if(!pesAgora.length)return null;
    const ultPeso=pesAgora[0].peso;
    const dias=Math.floor((new Date()-new Date(lote.dataEntrada+"T12:00"))/(1000*60*60*24))||1;
    return((ultPeso-a.pesoEntrada)/dias).toFixed(3);
  };

  const ABAS=[{id:"animais",label:"Animais",n:animais.length},{id:"pesagens",label:"Pesagens",n:pesagens.length},{id:"custos",label:"Custos",n:custos.length},{id:"vendas",label:"Vendas",n:vendas.length}];

  return(<div style={{padding:"0 4px"}}>
    <button onClick={onVoltar} style={{background:"none",border:"none",color:"#64748b",fontSize:13,cursor:"pointer",marginBottom:12,display:"flex",alignItems:"center",gap:4}}>← Voltar aos lotes</button>

    <div style={{background:"linear-gradient(135deg,#052e16,#14532d)",borderRadius:18,padding:"16px",marginBottom:14,border:"1px solid rgba(22,163,74,.25)"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div>
          <div style={{color:"#f1f5f9",fontWeight:800,fontSize:18}}>🐄 {lote.nome}</div>
          <div style={{color:"#86efac",fontSize:12,marginTop:3}}>{lote.racaPredominante} · {lote.qtdEntrada} cabeças · Entrada: {fmtData(lote.dataEntrada)}</div>
        </div>
        <span style={{background:lote.status==="ativo"?"rgba(22,163,74,.2)":"rgba(59,130,246,.2)",color:lote.status==="ativo"?"#4ade80":"#60a5fa",fontSize:11,fontWeight:700,padding:"4px 10px",borderRadius:20}}>
          {lote.status==="ativo"?"Em engorda":"Encerrado"}
        </span>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8,marginTop:14}}>
        <div style={{textAlign:"center"}}>
          <div style={{color:"#ef4444",fontSize:13,fontWeight:800}}>R$ {fmt(totalCustos)}</div>
          <div style={{color:"#64748b",fontSize:10}}>Custos</div>
        </div>
        <div style={{textAlign:"center"}}>
          <div style={{color:"#22c55e",fontSize:13,fontWeight:800}}>R$ {fmt(totalReceita)}</div>
          <div style={{color:"#64748b",fontSize:10}}>Receita</div>
        </div>
        <div style={{textAlign:"center"}}>
          <div style={{color:lucro>=0?"#4ade80":"#ef4444",fontSize:13,fontWeight:800}}>R$ {fmt(lucro)}</div>
          <div style={{color:"#64748b",fontSize:10}}>Lucro est.</div>
        </div>
        <div style={{textAlign:"center"}}>
          <div style={{color:"#fbbf24",fontSize:13,fontWeight:800}}>{custoPorArroba>0?"R$ "+Math.round(custoPorArroba):"—"}</div>
          <div style={{color:"#64748b",fontSize:10}}>Custo/@</div>
        </div>
      </div>
    </div>

    <div style={{display:"flex",gap:6,marginBottom:14,overflowX:"auto",paddingBottom:4}}>
      {ABAS.map(a=><button key={a.id} onClick={()=>setAba(a.id)}
        style={{padding:"7px 14px",borderRadius:12,border:"none",background:aba===a.id?"#16a34a":"rgba(255,255,255,0.05)",color:aba===a.id?"#fff":"#94a3b8",fontSize:13,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:5}}>
        {a.label} <span style={{background:aba===a.id?"rgba(255,255,255,.2)":"rgba(255,255,255,.08)",borderRadius:10,padding:"1px 6px",fontSize:11}}>{a.n}</span>
      </button>)}
    </div>

    {/* ── ABA: ANIMAIS ── */}
    {aba==="animais"&&<div>
      <div style={{display:"flex",gap:8,marginBottom:10}}>
        <button onClick={()=>{setEditAnimal(null);setAnimalForm({brinco:"",categoria:"Novilho/Novilha",sexo:"M",raca:"Nelore",pesoEntrada:"",dataEntrada:HOJE,obs:""});setAnimalModal(true)}} style={{flex:1,background:"linear-gradient(135deg,#16a34a,#15803d)",border:"none",borderRadius:12,padding:"10px",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>+ Adicionar Animal</button>
      </div>
      <input value={buscaBrinco} onChange={e=>setBuscaBrinco(e.target.value)} placeholder="🔍 Buscar por brinco..." style={{width:"100%",padding:"10px 14px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,color:"#f1f5f9",fontSize:14,outline:"none",boxSizing:"border-box",marginBottom:10,colorScheme:"dark"}}/>
      {animaisAtivos.length>0&&<div style={{color:"#64748b",fontSize:11,fontWeight:700,letterSpacing:.8,marginBottom:8}}>ATIVOS ({animaisAtivos.length})</div>}
      {animaisAtivos.filter(a=>!buscaBrinco||a.brinco.toLowerCase().includes(buscaBrinco.toLowerCase())).map(a=>{
        const g=gmd(a);
        const ultPes=pesagens.filter(p=>p.animalId===a.id).sort((x,y)=>y.data.localeCompare(x.data))[0];
        const pesoAtual=ultPes?ultPes.peso:a.pesoEntrada;
        const prontoAbate=pesoAtual>=450;
        return(<Card key={a.id} onClick={()=>abrirAnimal(a)}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                <span style={{color:"#f1f5f9",fontWeight:700,fontSize:15}}>🏷️ {a.brinco}</span>
                {prontoAbate&&<span style={{background:"rgba(34,197,94,.15)",color:"#22c55e",fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:10}}>✓ Pronto p/ abate</span>}
              </div>
              <div style={{color:"#64748b",fontSize:12,marginTop:2}}>{a.categoria||"—"} · {a.raca} · {a.sexo==="M"?"Macho":"Fêmea"}</div>
              {g&&parseFloat(g)>0&&<div style={{color:"#4ade80",fontSize:11,marginTop:2,fontWeight:600}}>GMD: +{g} kg/dia</div>}
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{color:prontoAbate?"#22c55e":"#94a3b8",fontSize:13,fontWeight:700}}>{fmt(pesoAtual)} kg</div>
              <div style={{color:"#475569",fontSize:10}}>{ultPes?"atual":"entrada"}</div>
            </div>
          </div>
        </Card>);
      })}
      {animais.filter(a=>a.status==="baixa").length>0&&<>
        <div style={{color:"#64748b",fontSize:11,fontWeight:700,letterSpacing:.8,marginBottom:8,marginTop:12}}>BAIXAS</div>
        {animais.filter(a=>a.status==="baixa").map(a=><Card key={a.id} style={{opacity:.6}}>
          <div style={{color:"#94a3b8",fontSize:13}}>🏷️ {a.brinco} <span style={{color:"#ef4444",fontSize:11}}>({a.causaBaixa||"baixa"})</span></div>
        </Card>)}
      </>}
      {animais.length===0&&<div style={{textAlign:"center",padding:"30px 0",color:"#475569"}}>Nenhum animal cadastrado</div>}
    </div>}

    {/* ── ABA: PESAGENS ── */}
    {aba==="pesagens"&&<div>
      <button onClick={()=>{setPesagemForm({tipo:"lote",animalId:"",data:HOJE,peso:"",obs:""});setPesagemModal(true)}} style={{width:"100%",background:"linear-gradient(135deg,#16a34a,#15803d)",border:"none",borderRadius:12,padding:"11px",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",marginBottom:12}}>+ Registrar Pesagem</button>
      {pesagens.map(p=>{
        const animal=animais.find(a=>a.id===p.animalId);
        return(<Card key={p.id}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{color:"#f1f5f9",fontWeight:600,fontSize:14}}>{p.tipo==="lote"?"Pesagem do lote (média)":"🏷️ "+animal?.brinco||"Animal"}</div>
              <div style={{color:"#64748b",fontSize:12,marginTop:2}}>{fmtData(p.data)}{p.obs?" · "+p.obs:""}</div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{textAlign:"right"}}>
                <div style={{color:"#4ade80",fontWeight:800,fontSize:16}}>{fmt(p.peso)} <span style={{fontSize:11,color:"#64748b"}}>kg</span></div>
              </div>
              <button onClick={()=>setDeleteModal({id:p.id,tipo:"pesagem",desc:fmtData(p.data)})} style={{background:"none",border:"none",color:"#475569",cursor:"pointer",fontSize:14}}>✕</button>
            </div>
          </div>
        </Card>);
      })}
      {pesagens.length===0&&<div style={{textAlign:"center",padding:"30px 0",color:"#475569"}}>Nenhuma pesagem registrada</div>}
    </div>}

    {/* ── ABA: CUSTOS ── */}
    {aba==="custos"&&<div>
      <button onClick={()=>{setEditCusto(null);setCustoForm({data:HOJE,tipo:"Ração/Silagem",valor:"",descricao:""});setCustoModal(true)}} style={{width:"100%",background:"linear-gradient(135deg,#16a34a,#15803d)",border:"none",borderRadius:12,padding:"11px",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",marginBottom:12}}>+ Registrar Custo</button>
      {custos.map(c=><Card key={c.id}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{color:"#f1f5f9",fontWeight:600,fontSize:14}}>{c.tipo}</div>
            <div style={{color:"#64748b",fontSize:12,marginTop:2}}>{fmtData(c.data)}{c.descricao?" · "+c.descricao:""}</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{color:"#ef4444",fontWeight:800,fontSize:15}}>R$ {fmt(c.valor)}</div>
            <button onClick={()=>setDeleteModal({id:c.id,tipo:"custo",desc:c.tipo+" R$"+fmt(c.valor)})} style={{background:"none",border:"none",color:"#475569",cursor:"pointer",fontSize:14}}>✕</button>
          </div>
        </div>
      </Card>)}
      {custos.length>0&&<div style={{background:"rgba(239,68,68,.08)",borderRadius:14,padding:"12px 16px",border:"1px solid rgba(239,68,68,.15)",marginTop:8}}>
        <div style={{display:"flex",justifyContent:"space-between"}}>
          <span style={{color:"#fca5a5",fontSize:13,fontWeight:600}}>Total de custos</span>
          <span style={{color:"#ef4444",fontWeight:800,fontSize:15}}>R$ {fmt(totalCustos)}</span>
        </div>
      </div>}
      {custos.length===0&&<div style={{textAlign:"center",padding:"30px 0",color:"#475569"}}>Nenhum custo registrado</div>}
    </div>}

    {/* ── ABA: VENDAS ── */}
    {aba==="vendas"&&<div>
      <button onClick={()=>{setVendaForm({data:HOJE,qtdAnimais:"",arrobas:"",valorArroba:"",comprador:"",obs:""});setVendaModal(true)}} style={{width:"100%",background:"linear-gradient(135deg,#16a34a,#15803d)",border:"none",borderRadius:12,padding:"11px",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",marginBottom:12}}>+ Registrar Venda</button>
      {vendas.map(v=><Card key={v.id}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div style={{color:"#f1f5f9",fontWeight:600,fontSize:14}}>{v.qtdAnimais} animais · {v.arrobas}@ · R$ {fmt(v.valorArroba)}/@</div>
            <div style={{color:"#64748b",fontSize:12,marginTop:2}}>{fmtData(v.data)}{v.comprador?" · "+v.comprador:""}</div>
          </div>
          <div style={{color:"#22c55e",fontWeight:800,fontSize:15}}>R$ {fmt(v.total)}</div>
        </div>
      </Card>)}
      {vendas.length>0&&<div style={{background:"rgba(22,163,74,.08)",borderRadius:14,padding:"12px 16px",border:"1px solid rgba(22,163,74,.15)",marginTop:8}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
          <span style={{color:"#86efac",fontSize:13,fontWeight:600}}>Receita total</span>
          <span style={{color:"#22c55e",fontWeight:800,fontSize:15}}>R$ {fmt(totalReceita)}</span>
        </div>
        <div style={{display:"flex",justifyContent:"space-between"}}>
          <span style={{color:lucro>=0?"#86efac":"#fca5a5",fontSize:13,fontWeight:600}}>Lucro estimado</span>
          <span style={{color:lucro>=0?"#22c55e":"#ef4444",fontWeight:800,fontSize:15}}>R$ {fmt(lucro)}</span>
        </div>
      </div>}
      {vendas.length===0&&<div style={{textAlign:"center",padding:"30px 0",color:"#475569"}}>Nenhuma venda registrada</div>}
      <div style={{background:"rgba(251,191,36,.06)",border:"1px solid rgba(251,191,36,.15)",borderRadius:14,padding:"14px 16px",marginTop:12}}>
        <div style={{color:"#fbbf24",fontSize:11,fontWeight:700,letterSpacing:.8,marginBottom:10}}>💡 SIMULADOR DE VENDA</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
          <div>
            <div style={{color:"#64748b",fontSize:11,marginBottom:4}}>Valor/@(R$)</div>
            <input type="text" inputMode="decimal" value={simValorArroba} onChange={e=>setSimValorArroba(e.target.value.replace(/[^0-9.,]/g,"").replace(",","."))} onBlur={e=>{const n=parseFloat(e.target.value);if(!isNaN(n)&&n>0)setSimValorArroba(n.toFixed(2))}} placeholder="ex: 320,00" style={{width:"100%",padding:"9px 12px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,color:"#f1f5f9",fontSize:14,outline:"none",boxSizing:"border-box",colorScheme:"dark"}}/>
          </div>
          <div>
            <div style={{color:"#64748b",fontSize:11,marginBottom:4}}>Rendimento carcaça %</div>
            <input type="number" value={simRendimento} onChange={e=>setSimRendimento(e.target.value)} placeholder="50" inputMode="decimal" style={{width:"100%",padding:"9px 12px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,color:"#f1f5f9",fontSize:14,outline:"none",boxSizing:"border-box",colorScheme:"dark"}}/>
          </div>
        </div>
        {simValorArroba&&(()=>{
          const vAt=parseFloat(simValorArroba)||0;const rend=(parseFloat(simRendimento)||50)/100;
          const nAtivos=animaisAtivos.length||lote.qtdEntrada||0;
          const pMedio=pesoMedioAtual||0;
          const arrobas=(pMedio*rend/15)*nAtivos;
          const receita=arrobas*vAt;
          const lucroSim=receita-totalInvestido;
          const roi=totalInvestido>0?(lucroSim/totalInvestido)*100:0;
          return(<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginTop:4}}>
            {[["Receita est.","#22c55e","R$ "+fmt(receita)],["Lucro/Prejuízo",lucroSim>=0?"#22c55e":"#ef4444","R$ "+fmt(lucroSim)],["ROI",roi>=0?"#fbbf24":"#ef4444",roi.toFixed(1)+"%"]].map(([l,c,v])=>
              <div key={l} style={{background:"rgba(255,255,255,0.04)",borderRadius:8,padding:"8px",textAlign:"center"}}>
                <div style={{color:c,fontWeight:800,fontSize:12}}>{v}</div>
                <div style={{color:"#475569",fontSize:10}}>{l}</div>
              </div>
            )}
          </div>);
        })()}
      </div>
    </div>}

    {/* ── MODAIS ── */}
    <Modal open={animalModal} onClose={()=>{setAnimalModal(false);setSaveErr("")}} title={editAnimal?"Editar Animal":"Novo Animal"}>
      <Input label="Número do brinco" value={animalForm.brinco} onChange={e=>setAnimalForm({...animalForm,brinco:e.target.value})} placeholder="Ex: 0042"/>
      <Select label="Categoria" value={animalForm.categoria} onChange={e=>setAnimalForm({...animalForm,categoria:e.target.value})} options={CATEGORIAS.map(c=>({value:c,label:c}))}/>
      <Select label="Sexo" value={animalForm.sexo} onChange={e=>setAnimalForm({...animalForm,sexo:e.target.value})} options={SEXO}/>
      <Select label="Raça" value={animalForm.raca} onChange={e=>setAnimalForm({...animalForm,raca:e.target.value})} options={RACAS.map(r=>({value:r,label:r}))}/>
      <InputMoney label="Peso de entrada (kg)" value={animalForm.pesoEntrada} onChange={e=>setAnimalForm({...animalForm,pesoEntrada:e.target.value})} placeholder="0,00"/>
      <Input label="Data de entrada" type="date" value={animalForm.dataEntrada} onChange={e=>setAnimalForm({...animalForm,dataEntrada:e.target.value})}/>
      <Input label="Observações" value={animalForm.obs||""} onChange={e=>setAnimalForm({...animalForm,obs:e.target.value})} placeholder="Opcional"/>
      {saveErr&&<div style={{color:"#f87171",fontSize:12,marginBottom:10,background:"rgba(239,68,68,.1)",padding:"8px 12px",borderRadius:10}}>{saveErr}</div>}
      {editAnimal&&editAnimal.status==="ativo"&&<Btn onClick={()=>{setCausaBaixa(CAUSAS_BAIXA[0]);setBaixaModal(true)}} color="rgba(239,68,68,.15)" style={{marginBottom:8,border:"1px solid rgba(239,68,68,.3)",color:"#ef4444"}} disabled={saving}>Registrar Baixa</Btn>}
      <Btn onClick={salvarAnimal} disabled={saving}>{saving?"Salvando...":(editAnimal?"Salvar":"Cadastrar Animal")}</Btn>
    </Modal>

    <Modal open={pesagemModal} onClose={()=>{setPesagemModal(false);setSaveErr("")}} title="Registrar Pesagem">
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        {[{v:"lote",l:"Peso médio do lote"},{v:"individual",l:"Animal individual"}].map(t=><button key={t.v} onClick={()=>setPesagemForm({...pesagemForm,tipo:t.v,animalId:""})}
          style={{flex:1,padding:"10px",borderRadius:12,border:"2px solid",borderColor:pesagemForm.tipo===t.v?"#16a34a":"rgba(255,255,255,0.07)",background:pesagemForm.tipo===t.v?"rgba(22,163,74,.12)":"transparent",color:pesagemForm.tipo===t.v?"#4ade80":"#64748b",fontWeight:700,fontSize:12,cursor:"pointer"}}>
          {t.l}</button>)}
      </div>
      {pesagemForm.tipo==="individual"&&<Select label="Animal (brinco)" value={pesagemForm.animalId} onChange={e=>setPesagemForm({...pesagemForm,animalId:e.target.value})} options={[{value:"",label:"— Selecione —"},...animaisAtivos.map(a=>({value:a.id,label:a.brinco+" - "+a.raca}))]}/>}
      <Input label="Data da pesagem" type="date" value={pesagemForm.data} onChange={e=>setPesagemForm({...pesagemForm,data:e.target.value})}/>
      <InputMoney label="Peso (kg)" value={pesagemForm.peso} onChange={e=>setPesagemForm({...pesagemForm,peso:e.target.value})} placeholder="0,00"/>
      <Input label="Observações" value={pesagemForm.obs||""} onChange={e=>setPesagemForm({...pesagemForm,obs:e.target.value})} placeholder="Opcional"/>
      {saveErr&&<div style={{color:"#f87171",fontSize:12,marginBottom:10,background:"rgba(239,68,68,.1)",padding:"8px 12px",borderRadius:10}}>{saveErr}</div>}
      <Btn onClick={salvarPesagem} disabled={saving}>{saving?"Salvando...":"Salvar Pesagem"}</Btn>
    </Modal>

    <Modal open={custoModal} onClose={()=>{setCustoModal(false);setSaveErr("")}} title={editCusto?"Editar Custo":"Registrar Custo"}>
      <Input label="Data" type="date" value={custoForm.data} onChange={e=>setCustoForm({...custoForm,data:e.target.value})}/>
      <Select label="Tipo de custo" value={custoForm.tipo} onChange={e=>setCustoForm({...custoForm,tipo:e.target.value})} options={TIPOS_CUSTO.map(t=>({value:t,label:t}))}/>
      <InputMoney label="Valor (R$)" value={custoForm.valor} onChange={e=>setCustoForm({...custoForm,valor:e.target.value})} placeholder="0,00"/>
      <Input label="Descrição (opcional)" value={custoForm.descricao||""} onChange={e=>setCustoForm({...custoForm,descricao:e.target.value})} placeholder="Fornecedor, quantidade..."/>
      {saveErr&&<div style={{color:"#f87171",fontSize:12,marginBottom:10,background:"rgba(239,68,68,.1)",padding:"8px 12px",borderRadius:10}}>{saveErr}</div>}
      <Btn onClick={salvarCusto} disabled={saving}>{saving?"Salvando...":(editCusto?"Salvar":"Registrar Custo")}</Btn>
    </Modal>

    <Modal open={vendaModal} onClose={()=>{setVendaModal(false);setSaveErr("")}} title="Registrar Venda">
      <Input label="Data da venda" type="date" value={vendaForm.data} onChange={e=>setVendaForm({...vendaForm,data:e.target.value})}/>
      <Input label="Quantidade de animais vendidos" type="number" value={vendaForm.qtdAnimais} onChange={e=>setVendaForm({...vendaForm,qtdAnimais:e.target.value})} placeholder="0" inputMode="numeric"/>
      <InputMoney label="Total de arrobas (@)" value={vendaForm.arrobas} onChange={e=>setVendaForm({...vendaForm,arrobas:e.target.value})} placeholder="0,00"/>
      <InputMoney label="Valor por arroba (R$/@)" value={vendaForm.valorArroba} onChange={e=>setVendaForm({...vendaForm,valorArroba:e.target.value})} placeholder="0,00"/>
      {vendaForm.arrobas&&vendaForm.valorArroba&&<div style={{background:"rgba(22,163,74,.1)",borderRadius:12,padding:"10px 14px",marginBottom:16,display:"flex",justifyContent:"space-between"}}>
        <span style={{color:"#86efac",fontSize:13}}>Total da venda</span>
        <span style={{color:"#22c55e",fontWeight:800}}>R$ {fmt((parseFloat(vendaForm.arrobas)||0)*(parseFloat(vendaForm.valorArroba)||0))}</span>
      </div>}
      <Input label="Comprador" value={vendaForm.comprador||""} onChange={e=>setVendaForm({...vendaForm,comprador:e.target.value})} placeholder="Nome do frigorífico ou comprador"/>
      <Input label="Observações" value={vendaForm.obs||""} onChange={e=>setVendaForm({...vendaForm,obs:e.target.value})} placeholder="Opcional"/>
      {saveErr&&<div style={{color:"#f87171",fontSize:12,marginBottom:10,background:"rgba(239,68,68,.1)",padding:"8px 12px",borderRadius:10}}>{saveErr}</div>}
      <Btn onClick={salvarVenda} disabled={saving}>{saving?"Salvando...":"Confirmar Venda"}</Btn>
    </Modal>

    <Modal open={baixaModal} onClose={()=>setBaixaModal(false)} title="Registrar Baixa">
      <p style={{color:"#94a3b8",fontSize:13,marginBottom:12}}>Informe a causa da baixa do animal <strong style={{color:"#f1f5f9"}}>🏷️ {editAnimal?.brinco}</strong>:</p>
      <Select label="Causa da baixa" value={causaBaixa} onChange={e=>setCausaBaixa(e.target.value)} options={CAUSAS_BAIXA.map(c=>({value:c,label:c}))}/>
      <div style={{display:"flex",gap:8,marginTop:8}}>
        <Btn onClick={()=>setBaixaModal(false)} color="rgba(255,255,255,0.06)" style={{flex:1,border:"1px solid rgba(255,255,255,0.08)",color:"#94a3b8"}}>Cancelar</Btn>
        <Btn onClick={async()=>{if(causaBaixa.trim()){await baixaAnimal(editAnimal,causaBaixa);setBaixaModal(false);setAnimalModal(false)}}} color="linear-gradient(135deg,#ef4444,#dc2626)" style={{flex:1}}>Confirmar Baixa</Btn>
      </div>
    </Modal>

    <Modal open={!!deleteModal} onClose={()=>setDeleteModal(null)} title="Excluir registro">
      {deleteModal&&<>
        <p style={{color:"#94a3b8",fontSize:14,marginBottom:20,textAlign:"center"}}>Excluir {deleteModal.tipo} <strong style={{color:"#f1f5f9"}}>{deleteModal.desc}</strong>?</p>
        <div style={{display:"flex",gap:8}}>
          <Btn onClick={()=>setDeleteModal(null)} color="rgba(255,255,255,0.06)" style={{flex:1,border:"1px solid rgba(255,255,255,0.08)",color:"#94a3b8"}}>Cancelar</Btn>
          <Btn onClick={deleteModal.tipo==="custo"?excluirCusto:deleteModal.tipo==="pesagem"?async()=>{await deletePesagem(deleteModal.id);setDeleteModal(null);await recarregar()}:excluirAnimal} color="linear-gradient(135deg,#ef4444,#dc2626)" style={{flex:1}}>Excluir</Btn>
        </div>
      </>}
    </Modal>
  </div>);
}
