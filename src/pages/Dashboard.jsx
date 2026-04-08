import{useState,useEffect}from"react";
import{getLotes,getAnimais,getCustos,getVendas}from"../db";
import Card from"../components/Card";

function fmt(v){return(v||0).toLocaleString("pt-BR",{minimumFractionDigits:2})}

export default function Dashboard({user}){
  const[lotes,setLotes]=useState([]);
  const[resumo,setResumo]=useState({animais:0,lotesAtivos:0,custoTotal:0,receitaTotal:0});
  const[carregando,setCarregando]=useState(true);

  useEffect(()=>{(async()=>{
    setCarregando(true);
    const ls=await getLotes(user.email);
    setLotes(ls);
    let animais=0,custoTotal=0,receitaTotal=0;
    const lotesAtivos=ls.filter(l=>l.status==="ativo").length;
    for(const l of ls){
      const anim=await getAnimais(l.id);
      animais+=anim.filter(a=>a.status==="ativo").length;
      const custos=await getCustos(l.id);
      custoTotal+=custos.reduce((s,c)=>s+c.valor,0);
      const vendas=await getVendas(l.id);
      receitaTotal+=vendas.reduce((s,v)=>s+v.total,0);
    }
    setResumo({animais,lotesAtivos,custoTotal,receitaTotal});
    setCarregando(false);
  })()},[user.email]);

  const lucro=resumo.receitaTotal-resumo.custoTotal;

  if(carregando)return(<div style={{padding:"40px 0",textAlign:"center",color:"#475569"}}>Carregando dados...</div>);

  return(<div style={{padding:"0 4px 8px"}}>
    <div style={{background:"linear-gradient(135deg,#052e16,#14532d)",borderRadius:20,padding:"20px",marginBottom:14,border:"1px solid rgba(22,163,74,.25)",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:-20,right:-20,width:100,height:100,borderRadius:"50%",background:"rgba(22,163,74,.12)"}}/>
      <div style={{color:"#86efac",fontSize:11,fontWeight:700,letterSpacing:.8,marginBottom:4}}>RESULTADO GERAL</div>
      <div style={{color:lucro>=0?"#f0fdf4":"#ef4444",fontSize:28,fontWeight:800,letterSpacing:-.5}}>R$ {fmt(lucro)}</div>
      <div style={{color:"#4ade80",fontSize:12,marginTop:4}}>{lucro>=0?"Lucro acumulado":"Prejuízo acumulado"}</div>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
      <div style={{background:"rgba(22,163,74,.08)",borderRadius:16,padding:"14px 16px",border:"1px solid rgba(22,163,74,.15)"}}>
        <div style={{color:"#86efac",fontSize:10,fontWeight:700,letterSpacing:.8,marginBottom:4}}>LOTES ATIVOS</div>
        <div style={{color:"#4ade80",fontSize:22,fontWeight:800}}>{resumo.lotesAtivos}</div>
      </div>
      <div style={{background:"rgba(59,130,246,.08)",borderRadius:16,padding:"14px 16px",border:"1px solid rgba(59,130,246,.15)"}}>
        <div style={{color:"#93c5fd",fontSize:10,fontWeight:700,letterSpacing:.8,marginBottom:4}}>ANIMAIS EM ENGORDA</div>
        <div style={{color:"#60a5fa",fontSize:22,fontWeight:800}}>{resumo.animais}</div>
      </div>
      <div style={{background:"rgba(239,68,68,.08)",borderRadius:16,padding:"14px 16px",border:"1px solid rgba(239,68,68,.15)"}}>
        <div style={{color:"#fca5a5",fontSize:10,fontWeight:700,letterSpacing:.8,marginBottom:4}}>CUSTOS TOTAIS</div>
        <div style={{color:"#ef4444",fontSize:16,fontWeight:800}}>R$ {fmt(resumo.custoTotal)}</div>
      </div>
      <div style={{background:"rgba(34,197,94,.08)",borderRadius:16,padding:"14px 16px",border:"1px solid rgba(34,197,94,.15)"}}>
        <div style={{color:"#86efac",fontSize:10,fontWeight:700,letterSpacing:.8,marginBottom:4}}>RECEITA DE VENDAS</div>
        <div style={{color:"#22c55e",fontSize:16,fontWeight:800}}>R$ {fmt(resumo.receitaTotal)}</div>
      </div>
    </div>

    {lotes.length>0&&<>
      <div style={{color:"#64748b",fontSize:11,fontWeight:700,letterSpacing:.8,marginBottom:10}}>ÚLTIMOS LOTES</div>
      {lotes.slice(0,3).map(l=><Card key={l.id}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{color:"#f1f5f9",fontWeight:600,fontSize:14}}>{l.nome}</div>
            <div style={{color:"#64748b",fontSize:12,marginTop:2}}>{l.racaPredominante||"Raça não informada"} · {new Date(l.dataEntrada+"T12:00").toLocaleDateString("pt-BR")}</div>
          </div>
          <span style={{background:l.status==="ativo"?"rgba(22,163,74,.15)":l.status==="vendido"?"rgba(59,130,246,.15)":"rgba(245,158,11,.15)",color:l.status==="ativo"?"#4ade80":l.status==="vendido"?"#60a5fa":"#fbbf24",fontSize:11,fontWeight:700,padding:"4px 10px",borderRadius:20}}>
            {l.status==="ativo"?"Em engorda":l.status==="vendido"?"Vendido":"Parcial"}
          </span>
        </div>
      </Card>)}
    </>}

    {lotes.length===0&&<div style={{textAlign:"center",padding:"40px 0",color:"#475569"}}>
      <div style={{fontSize:40,marginBottom:10}}>🐄</div>
      <div style={{fontSize:15,fontWeight:600,color:"#64748b",marginBottom:6}}>Nenhum lote cadastrado</div>
      <div style={{fontSize:13}}>Vá em "Lotes" para criar seu primeiro lote</div>
    </div>}
  </div>);
}
