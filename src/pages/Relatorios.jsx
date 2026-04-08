import{useState,useEffect}from"react";
import{getLotes,getCustos,getVendas,getAnimais,getPesagens}from"../db";
import Card from"../components/Card";

function fmt(v){return(v||0).toLocaleString("pt-BR",{minimumFractionDigits:2})}
function fmtData(s){if(!s)return"";const[y,m,d]=s.split("-");return`${d}/${m}/${y}`}

export default function Relatorios({user}){
  const[lotes,setLotes]=useState([]);const[dados,setDados]=useState([]);const[carregando,setCarregando]=useState(true);
  const[loteId,setLoteId]=useState("todos");

  useEffect(()=>{(async()=>{
    setCarregando(true);
    const ls=await getLotes(user.email);setLotes(ls);
    const d=await Promise.all(ls.map(async l=>{
      const[custos,vendas,animais,pesagens]=await Promise.all([getCustos(l.id),getVendas(l.id),getAnimais(l.id),getPesagens(l.id)]);
      const totalCustos=custos.reduce((s,c)=>s+c.valor,0);
      const custosCompra=(l.qtdEntrada||0)*(l.valorCabeca||0);
      const totalReceita=vendas.reduce((s,v)=>s+v.total,0);
      const lucro=totalReceita-totalCustos-custosCompra;
      const animaisAtivos=animais.filter(a=>a.status==="ativo").length;
      const pesMais=pesagens.filter(p=>p.tipo==="lote").sort((a,b)=>b.data.localeCompare(a.data));
      const pesoAtual=pesMais[0]?.peso||l.pesoMedioEntrada||0;
      const dias=Math.floor((new Date()-new Date(l.dataEntrada+"T12:00"))/(1000*60*60*24))||1;
      const gmd=l.pesoMedioEntrada&&pesoAtual?((pesoAtual-l.pesoMedioEntrada)/dias).toFixed(3):null;
      return{...l,totalCustos,custosCompra,totalReceita,lucro,animaisAtivos,pesoAtual,gmd,arrobasTotal:vendas.reduce((s,v)=>s+v.arrobas,0)};
    }));
    setDados(d);setCarregando(false);
  })()},[user.email]);

  const filtrados=loteId==="todos"?dados:dados.filter(d=>d.id===loteId);
  const lote=filtrados[0];

  const totalGeral={lucro:dados.reduce((s,d)=>s+d.lucro,0),receita:dados.reduce((s,d)=>s+d.totalReceita,0),custos:dados.reduce((s,d)=>s+d.totalCustos+d.custosCompra,0)};

  const imprimir=()=>{
    const conteudo=document.getElementById("relatorio-print");
    const janela=window.open("","_blank");
    janela.document.write(`<html><head><title>Relatório — GadoControle</title>
    <style>body{font-family:Arial,sans-serif;padding:20px;color:#111}h1{color:#15803d}table{width:100%;border-collapse:collapse;margin:16px 0}th,td{border:1px solid #ddd;padding:8px 12px;text-align:left}th{background:#f0fdf4;color:#15803d}.verde{color:#16a34a;font-weight:700}.vermelho{color:#dc2626;font-weight:700}.total{background:#f0fdf4;font-weight:700}</style>
    </head><body>${conteudo.innerHTML}</body></html>`);
    janela.document.close();janela.focus();setTimeout(()=>janela.print(),300);
  };

  if(carregando)return(<div style={{padding:"40px 0",textAlign:"center",color:"#475569"}}>Carregando relatório...</div>);

  return(<div style={{padding:"0 4px"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <h2 style={{color:"#f1f5f9",margin:0,fontSize:20,fontWeight:700}}>Relatórios</h2>
      <button onClick={imprimir} style={{background:"rgba(22,163,74,.1)",border:"1px solid rgba(22,163,74,.25)",borderRadius:12,padding:"8px 14px",color:"#86efac",fontSize:13,fontWeight:700,cursor:"pointer"}}>🖨️ Imprimir PDF</button>
    </div>

    <div style={{marginBottom:14}}>
      <select value={loteId} onChange={e=>setLoteId(e.target.value)} style={{width:"100%",padding:"12px 16px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,color:"#f1f5f9",fontSize:14,outline:"none",colorScheme:"dark"}}>
        <option value="todos" style={{background:"#0e1a0e"}}>Todos os lotes</option>
        {lotes.map(l=><option key={l.id} value={l.id} style={{background:"#0e1a0e"}}>{l.nome}</option>)}
      </select>
    </div>

    {/* Resumo geral */}
    {loteId==="todos"&&<>
      <div style={{background:"linear-gradient(135deg,#052e16,#14532d)",borderRadius:18,padding:"18px",marginBottom:14,border:"1px solid rgba(22,163,74,.25)"}}>
        <div style={{color:"#86efac",fontSize:11,fontWeight:700,letterSpacing:.8,marginBottom:12}}>RESULTADO CONSOLIDADO — {dados.length} LOTES</div>
        {[["Receita total de vendas","#22c55e",totalGeral.receita],["Custos totais (compra+engorda)","#ef4444",totalGeral.custos],["Lucro / Prejuízo líquido",totalGeral.lucro>=0?"#4ade80":"#ef4444",totalGeral.lucro]].map(([l,c,v])=>
          <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <span style={{color:"#94a3b8",fontSize:13}}>{l}</span>
            <span style={{color:c,fontWeight:800,fontSize:15}}>R$ {fmt(v)}</span>
          </div>
        )}
      </div>
      {dados.map(d=><Card key={d.id}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
          <div>
            <div style={{color:"#f1f5f9",fontWeight:700,fontSize:14}}>{d.nome}</div>
            <div style={{color:"#64748b",fontSize:11}}>{d.racaPredominante} · {fmtData(d.dataEntrada)} · {d.qtdEntrada} cabeças</div>
          </div>
          <span style={{background:d.lucro>=0?"rgba(22,163,74,.15)":"rgba(239,68,68,.15)",color:d.lucro>=0?"#4ade80":"#ef4444",fontSize:12,fontWeight:800,padding:"4px 10px",borderRadius:10}}>
            R$ {fmt(d.lucro)}
          </span>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:4}}>
          <div style={{textAlign:"center",background:"rgba(239,68,68,.06)",borderRadius:8,padding:"6px"}}>
            <div style={{color:"#ef4444",fontSize:12,fontWeight:700}}>R$ {fmt(d.totalCustos+d.custosCompra)}</div>
            <div style={{color:"#64748b",fontSize:10}}>custos</div>
          </div>
          <div style={{textAlign:"center",background:"rgba(22,163,74,.06)",borderRadius:8,padding:"6px"}}>
            <div style={{color:"#22c55e",fontSize:12,fontWeight:700}}>R$ {fmt(d.totalReceita)}</div>
            <div style={{color:"#64748b",fontSize:10}}>receita</div>
          </div>
          <div style={{textAlign:"center",background:"rgba(59,130,246,.06)",borderRadius:8,padding:"6px"}}>
            <div style={{color:"#60a5fa",fontSize:12,fontWeight:700}}>{d.gmd||"—"}</div>
            <div style={{color:"#64748b",fontSize:10}}>GMD kg/dia</div>
          </div>
        </div>
      </Card>)}
    </>}

    {/* Relatório de lote específico */}
    {loteId!=="todos"&&lote&&<div>
      <div style={{background:"linear-gradient(135deg,#052e16,#14532d)",borderRadius:18,padding:"18px",marginBottom:14,border:"1px solid rgba(22,163,74,.25)"}}>
        <div style={{color:"#86efac",fontSize:11,fontWeight:700,letterSpacing:.8,marginBottom:4}}>LOTE: {lote.nome.toUpperCase()}</div>
        <div style={{color:"#64748b",fontSize:12,marginBottom:14}}>{lote.racaPredominante} · Entrada: {fmtData(lote.dataEntrada)} · {lote.qtdEntrada} cabeças</div>
        {[
          ["Custo de compra ("+lote.qtdEntrada+" × R$"+fmt(lote.valorCabeca)+"/)","#ef4444",lote.custosCompra],
          ["Custos de engorda","#f97316",lote.totalCustos],
          ["Custo total","#ef4444",lote.totalCustos+lote.custosCompra],
          ["Receita de vendas","#22c55e",lote.totalReceita],
          ["Lucro / Prejuízo",lote.lucro>=0?"#4ade80":"#ef4444",lote.lucro],
        ].map(([l,c,v])=><div key={l} style={{display:"flex",justifyContent:"space-between",marginBottom:8,paddingBottom:8,borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
          <span style={{color:"#94a3b8",fontSize:13}}>{l}</span>
          <span style={{color:c,fontWeight:700,fontSize:14}}>R$ {fmt(v)}</span>
        </div>)}
        {lote.arrobasTotal>0&&<div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
          <span style={{color:"#94a3b8",fontSize:13}}>Custo por arroba produzida</span>
          <span style={{color:"#f59e0b",fontWeight:700}}>R$ {fmt((lote.totalCustos+lote.custosCompra)/lote.arrobasTotal)}/@</span>
        </div>}
        {lote.gmd&&<div style={{marginTop:10,color:"#86efac",fontSize:13,fontWeight:600}}>GMD médio: {lote.gmd} kg/dia · Peso médio atual: {fmt(lote.pesoAtual)} kg</div>}
      </div>
    </div>}

    {/* Conteúdo oculto para impressão PDF */}
    <div id="relatorio-print" style={{display:"none"}}>
      <h1>GadoControle — Relatório</h1>
      <p>Gerado em: {new Date().toLocaleDateString("pt-BR")}</p>
      {loteId==="todos"?<>
        <h2>Resultado Consolidado</h2>
        <table><thead><tr><th>Lote</th><th>Raça</th><th>Cabeças</th><th>Entrada</th><th>Custos</th><th>Receita</th><th>Lucro</th></tr></thead>
        <tbody>{dados.map(d=><tr key={d.id}>
          <td>{d.nome}</td><td>{d.racaPredominante}</td><td>{d.qtdEntrada}</td><td>{fmtData(d.dataEntrada)}</td>
          <td className="vermelho">R$ {fmt(d.totalCustos+d.custosCompra)}</td>
          <td className="verde">R$ {fmt(d.totalReceita)}</td>
          <td className={d.lucro>=0?"verde":"vermelho"}>R$ {fmt(d.lucro)}</td>
        </tr>)}
        <tr className="total"><td colSpan="4">TOTAL</td><td className="vermelho">R$ {fmt(totalGeral.custos)}</td><td className="verde">R$ {fmt(totalGeral.receita)}</td><td className={totalGeral.lucro>=0?"verde":"vermelho"}>R$ {fmt(totalGeral.lucro)}</td></tr>
        </tbody></table>
      </>:lote&&<>
        <h2>Lote: {lote.nome}</h2>
        <p>{lote.racaPredominante} · {lote.qtdEntrada} cabeças · Entrada: {fmtData(lote.dataEntrada)}</p>
        <table><tbody>
          <tr><td>Custo de compra</td><td className="vermelho">R$ {fmt(lote.custosCompra)}</td></tr>
          <tr><td>Custos de engorda</td><td className="vermelho">R$ {fmt(lote.totalCustos)}</td></tr>
          <tr className="total"><td>CUSTO TOTAL</td><td className="vermelho">R$ {fmt(lote.totalCustos+lote.custosCompra)}</td></tr>
          <tr><td>Receita de vendas</td><td className="verde">R$ {fmt(lote.totalReceita)}</td></tr>
          <tr className="total"><td>LUCRO / PREJUÍZO</td><td className={lote.lucro>=0?"verde":"vermelho"}>R$ {fmt(lote.lucro)}</td></tr>
          {lote.arrobasTotal>0&&<tr><td>Custo por arroba</td><td>R$ {fmt((lote.totalCustos+lote.custosCompra)/lote.arrobasTotal)}/@</td></tr>}
          {lote.gmd&&<tr><td>GMD médio</td><td>{lote.gmd} kg/dia</td></tr>}
        </tbody></table>
      </>}
    </div>
  </div>);
}
