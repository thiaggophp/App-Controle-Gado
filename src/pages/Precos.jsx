import{useState,useEffect,useCallback}from"react";

const BGI_CACHE_KEY="gado_bgi_cache";
function loadBgiCache(){try{const c=JSON.parse(localStorage.getItem(BGI_CACHE_KEY));if(c?.preco)return c}catch{}return null;}
function saveBgiCache(data){try{localStorage.setItem(BGI_CACHE_KEY,JSON.stringify({...data,cachedAt:new Date().toISOString()}))}catch{}}
function isPregaoAberto(){const brt=new Date(Date.now()-3*60*60*1000);const h=brt.getUTCHours(),day=brt.getUTCDay();return day>=1&&day<=5&&h>=9&&h<18;}

async function fetchBgi(){
  const b3url="https://cotacao.b3.com.br/mds/api/v1/DerivativeQuotation/BGI";
  let texto;
  try{const r=await fetch(`https://api.codetabs.com/v1/proxy/?quest=${b3url}`);if(!r.ok)throw new Error();texto=await r.text();}
  catch{const r2=await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(b3url)}`);if(!r2.ok)throw new Error("proxies indisponíveis");const w=await r2.json();texto=w.contents;}
  const d=JSON.parse(texto);
  const fut=d.Scty.filter(x=>x.mkt?.cd==="FUT"&&(x.SctyQtn?.curPrc||x.SctyQtn?.prvsDayAdjstmntPric));
  if(!fut.length)throw new Error("sem dados de futuros BGI");
  fut.sort((a,b)=>new Date(a.asset.AsstSummry.mtrtyCode)-new Date(b.asset.AsstSummry.mtrtyCode));
  const c=fut[0];const prev=c.SctyQtn.prvsDayAdjstmntPric;const cur=c.SctyQtn.curPrc||prev;
  const result={ticker:c.symb,preco:cur,variacao:prev?((cur-prev)/prev)*100:0,vencimento:c.asset.AsstSummry.mtrtyCode};
  saveBgiCache(result);return result;
}
async function fetchDolar(){
  const r=await fetch("https://economia.awesomeapi.com.br/json/last/USD-BRL");
  if(!r.ok)throw new Error();const d=await r.json();const q=d["USDBRL"];
  return{bid:parseFloat(q.bid),pct:parseFloat(q.pctChange),high:parseFloat(q.high),low:parseFloat(q.low)};
}

function fmt(v,dec=2){return(v??0).toLocaleString("pt-BR",{minimumFractionDigits:dec,maximumFractionDigits:dec})}
function fmtPct(v){return`${v>=0?"+":""}${fmt(v)}%`}
function n(v){return parseFloat(String(v).replace(",","."))||0}

function parseMesAno(str){
  const m=str.match(/^(\d{2})\/(\d{4})$/);if(!m)return null;
  const mes=parseInt(m[1]),ano=parseInt(m[2]);if(mes<1||mes>12||ano<2020)return null;
  const alvo=new Date(ano,mes-1,1);const hoje=new Date();hoje.setHours(0,0,0,0);
  if(alvo<=hoje)return null;
  return{dias:Math.round((alvo-hoje)/86400000),label:alvo.toLocaleDateString("pt-BR",{month:"long",year:"numeric"})};
}
function defaultMesAno(){const d=new Date();d.setMonth(d.getMonth()+6);return`${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;}

// Cálculo central da simulação — reutilizado em cenários
function calcSim({qtd,pesoEntrada,custoCompra,gmdV,custoDiario,periodo,precoArroba}){
  const pesoSaida=pesoEntrada+(gmdV*periodo);
  const arrobasEntrada=pesoEntrada/15;
  const arrobasSaida=pesoSaida/15;
  const arrobasProduzidas=arrobasSaida-arrobasEntrada;
  const custoCompraTotal=custoCompra*qtd;
  const custoPeriodoTotal=custoDiario*periodo*qtd;
  const custoTotal=custoCompraTotal+custoPeriodoTotal;
  const receitaTotal=arrobasSaida*precoArroba*qtd;
  const lucro=receitaTotal-custoTotal;
  const precoEquilibrio=arrobasSaida>0?custoTotal/(arrobasSaida*qtd):0;
  const custoPorArrobaProd=arrobasProduzidas>0?custoTotal/(arrobasProduzidas*qtd):0;
  const roi=custoTotal>0?(lucro/custoTotal)*100:0;
  const roiMensal=periodo>0?roi/periodo*30:0;
  const lucroArroba=arrobasSaida>0?lucro/(arrobasSaida*qtd):0;
  return{pesoSaida,arrobasEntrada,arrobasSaida,arrobasProduzidas,custoCompraTotal,custoPeriodoTotal,custoTotal,receitaTotal,lucro,precoEquilibrio,custoPorArrobaProd,roi,roiMensal,lucroArroba};
}

// ── UI atoms ──
function Card({children,style}){return<div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:16,padding:"18px 20px",...style}}>{children}</div>;}
function Badge({value}){const pos=value>=0;return<span style={{fontSize:12,fontWeight:700,padding:"2px 8px",borderRadius:20,background:pos?"rgba(22,163,74,.2)":"rgba(239,68,68,.15)",color:pos?"#4ade80":"#f87171"}}>{fmtPct(value)}</span>;}
function FL({label,children}){return<div style={{marginBottom:12}}><label style={{color:"#94a3b8",fontSize:11,fontWeight:600,display:"block",marginBottom:4,textTransform:"uppercase",letterSpacing:.5}}>{label}</label>{children}</div>;}
function FLErr({label,erro,children}){return<div style={{marginBottom:12}}><label style={{color:erro?"#f87171":"#94a3b8",fontSize:11,fontWeight:600,display:"block",marginBottom:4,textTransform:"uppercase",letterSpacing:.5}}>{label}{erro&&<span style={{fontWeight:400,marginLeft:5,fontSize:10}}>— {erro}</span>}</label>{children}</div>;}
function NI({value,onChange,prefix,suffix,erro}){return<div style={{display:"flex",alignItems:"center",gap:6,background:"rgba(255,255,255,0.06)",border:`1px solid ${erro?"rgba(239,68,68,.5)":"rgba(255,255,255,0.1)"}`,borderRadius:10,padding:"8px 12px"}}>{prefix&&<span style={{color:"#64748b",fontSize:13,whiteSpace:"nowrap"}}>{prefix}</span>}<input type="number" value={value} onChange={e=>onChange(e.target.value)} style={{background:"transparent",border:"none",color:"#f1f5f9",fontSize:15,fontWeight:600,flex:1,outline:"none",minWidth:0}}/>{suffix&&<span style={{color:"#64748b",fontSize:13,whiteSpace:"nowrap"}}>{suffix}</span>}</div>;}
function TI({value,onChange,placeholder,erro}){return<div style={{display:"flex",background:"rgba(255,255,255,0.06)",border:`1px solid ${erro?"rgba(239,68,68,.5)":"rgba(255,255,255,0.1)"}`,borderRadius:10,padding:"8px 12px"}}><input type="text" value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{background:"transparent",border:"none",color:"#f1f5f9",fontSize:15,fontWeight:600,flex:1,outline:"none",minWidth:0}}/></div>;}
function Row({label,value,color,bold,small}){return<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:"1px solid rgba(255,255,255,0.04)"}}><span style={{color:"#94a3b8",fontSize:small?11:13}}>{label}</span><span style={{color:color||"#f1f5f9",fontWeight:bold?700:500,fontSize:small?11:13}}>{value}</span></div>;}

export default function Precos(){
  const[bgi,setBgi]=useState(()=>loadBgiCache());
  const[bgiDoCache,setBgiDoCache]=useState(()=>!!loadBgiCache());
  const[dolar,setDolar]=useState(null);
  const[loading,setLoading]=useState(true);
  const[erroApi,setErroApi]=useState(null);
  const[atualizado,setAtualizado]=useState(null);
  const[pregaoAberto]=useState(isPregaoAberto);

  // Campos da simulação
  const[animais,setAnimais]=useState("10");
  const[pesoEntrada,setPesoEntrada]=useState("350");
  const[custoCompraManual,setCustoCompraManual]=useState("");
  const[gmd,setGmd]=useState("1.2");
  const[custoDiario,setCustoDiario]=useState("15");
  const[mesVendaStr,setMesVendaStr]=useState(defaultMesAno);
  const[precoVenda,setPrecoVenda]=useState("");
  const[erros,setErros]=useState({});
  const[resultado,setResultado]=useState(null);

  const buscar=useCallback(async(forcar=false)=>{
    setLoading(true);setErroApi(null);
    try{
      const resDolar=await fetchDolar().catch(()=>null);
      if(resDolar)setDolar(resDolar);else setDolar(null);
      if(forcar||isPregaoAberto()){
        const resBgi=await fetchBgi().catch(()=>null);
        if(resBgi){setBgi(resBgi);setBgiDoCache(false);setPrecoVenda(v=>v||String(resBgi.preco));}
      }else{
        const cache=loadBgiCache();
        if(cache){setBgi(cache);setBgiDoCache(true);setPrecoVenda(v=>v||String(cache.preco));}
      }
      setAtualizado(new Date());
    }catch(e){setErroApi(e.message)}
    setLoading(false);
  },[]);

  useEffect(()=>{
    buscar(false);
    const intervalo=setInterval(()=>{if(isPregaoAberto())buscar(false)},5*60*1000);
    return()=>clearInterval(intervalo);
  },[buscar]);

  // Pré-visualização do período
  const periodoData=parseMesAno(mesVendaStr);

  // Sugestão de custo de compra pela cotação
  const custoSugerido=bgi&&n(pesoEntrada)>0?(n(pesoEntrada)/15)*bgi.preco:0;
  const custoCompraFinal=n(custoCompraManual)||custoSugerido;

  const calcular=()=>{
    const errs={};
    if(n(animais)<=0)errs.animais="obrigatório";
    if(n(pesoEntrada)<=0)errs.pesoEntrada="obrigatório";
    if(custoCompraFinal<=0)errs.custoCompra="informe ou aguarde cotação";
    if(!periodoData)errs.mesVenda="use MM/AAAA com data futura";
    if(n(precoVenda)<=0)errs.precoVenda="obrigatório";
    setErros(errs);
    if(Object.keys(errs).length>0){setResultado(null);return;}
    setResultado({
      qtd:n(animais),pesoEntrada:n(pesoEntrada),
      custoCompra:custoCompraFinal,gmdV:n(gmd),
      custoDiario:n(custoDiario),periodo:periodoData.dias,
      periodoLabel:periodoData.label,precoArroba:n(precoVenda),
    });
  };

  const r=resultado;
  const sim=r?calcSim(r):null;
  const positivo=sim&&sim.lucro>=0;

  // Cenários usando o bgi.preco como referência
  const bgiPreco=bgi?.preco||n(precoVenda);
  const cenarios=r&&sim?[
    {label:"Pessimista",pct:-10,preco:bgiPreco*0.9,cor:"#f87171"},
    {label:"Atual",pct:0,preco:bgiPreco,cor:"#fbbf24"},
    {label:"Otimista",pct:+10,preco:bgiPreco*1.1,cor:"#4ade80"},
  ].map(c=>({...c,...calcSim({...r,precoArroba:c.preco})})):null;

  return(<div style={{padding:"0 4px"}}>

    {/* ── HEADER ── */}
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
      <h2 style={{color:"#f1f5f9",margin:0,fontSize:20,fontWeight:700}}>Preços de Mercado</h2>
      <button onClick={()=>buscar(true)} disabled={loading}
        style={{background:"rgba(22,163,74,.15)",border:"1px solid rgba(22,163,74,.3)",borderRadius:10,padding:"6px 14px",color:"#4ade80",fontSize:13,fontWeight:600,cursor:loading?"not-allowed":"pointer",opacity:loading?.6:1}}>
        {loading?"...":" Atualizar"}
      </button>
    </div>
    {atualizado&&<p style={{color:"#475569",fontSize:11,marginBottom:14,marginTop:-10}}>
      Atualizado às {atualizado.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}
      {!pregaoAberto&&<span style={{color:"#334155"}}> · Pregão fechado — último valor salvo</span>}
    </p>}
    {erroApi&&<div style={{background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.2)",borderRadius:12,padding:"12px 16px",color:"#f87171",fontSize:13,marginBottom:16}}>{erroApi}</div>}

    <div style={{display:"flex",flexDirection:"column",gap:14}}>

      {/* ── BOI GORDO ── */}
      <Card>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
          <div>
            <div style={{color:"#94a3b8",fontSize:11,fontWeight:600,letterSpacing:.5,textTransform:"uppercase",marginBottom:4}}>🐄 Boi Gordo Futuro (B3)</div>
            {bgi&&<div style={{color:"#64748b",fontSize:11}}>
              {bgi.ticker} · venc. {new Date(bgi.vencimento+"T12:00:00").toLocaleDateString("pt-BR",{month:"short",year:"numeric"})}
              {bgiDoCache&&bgi.cachedAt&&<span style={{color:"#334155"}}> · salvo {new Date(bgi.cachedAt).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}</span>}
            </div>}
          </div>
          {bgi&&<Badge value={bgi.variacao}/>}
        </div>
        {bgi?<>
          <div style={{color:"#f1f5f9",fontSize:32,fontWeight:800,letterSpacing:-1}}>R$ {fmt(bgi.preco)}<span style={{fontSize:14,fontWeight:500,color:"#64748b"}}> / @</span></div>
          <div style={{color:"#64748b",fontSize:12,marginTop:4}}>≈ R$ {fmt(bgi.preco/15,3)} / kg vivo</div>
        </>:<div style={{color:"#475569",fontSize:13}}>{loading?"Buscando...":"Dados indisponíveis no momento"}</div>}
      </Card>

      {/* ── DÓLAR ── */}
      <Card>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
          <div style={{color:"#94a3b8",fontSize:11,fontWeight:600,letterSpacing:.5,textTransform:"uppercase"}}>💵 Dólar Comercial (USD/BRL)</div>
          {dolar&&<Badge value={dolar.pct}/>}
        </div>
        {dolar?<>
          <div style={{color:"#f1f5f9",fontSize:32,fontWeight:800,letterSpacing:-1}}>R$ {fmt(dolar.bid)}</div>
          <div style={{color:"#64748b",fontSize:12,marginTop:4,display:"flex",gap:14}}>
            <span>Mín: R$ {fmt(dolar.low)}</span><span>Máx: R$ {fmt(dolar.high)}</span>
          </div>
        </>:<div style={{color:"#475569",fontSize:13}}>{loading?"Buscando...":"Dados indisponíveis"}</div>}
      </Card>

      {/* ── REFERÊNCIA POR PESO ── */}
      {bgi&&<Card style={{background:"rgba(22,163,74,0.05)",border:"1px solid rgba(22,163,74,.15)"}}>
        <div style={{color:"#86efac",fontSize:11,fontWeight:600,letterSpacing:.5,textTransform:"uppercase",marginBottom:10}}>📊 Valor por Animal (peso vivo)</div>
        {[250,350,450,550].map(kg=>(
          <div key={kg} style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
            <span style={{color:"#94a3b8",fontSize:13}}>{kg} kg — {(kg/15).toFixed(1)} @</span>
            <span style={{color:"#4ade80",fontWeight:700,fontSize:13}}>R$ {fmt((kg/15)*bgi.preco,0)}</span>
          </div>
        ))}
      </Card>}

      {/* ════════════════════════════════════════
          SIMULAÇÃO DE INVESTIMENTO
          ════════════════════════════════════════ */}
      <div style={{marginTop:6}}>
        <div style={{marginBottom:14}}>
          <h3 style={{color:"#f1f5f9",margin:"0 0 4px",fontSize:17,fontWeight:700}}>🧮 Simulação de Confinamento</h3>
          <p style={{color:"#475569",fontSize:12,margin:0}}>Modelo baseado em indicadores CEPEA/ESALQ e Scot Consultoria</p>
        </div>

        {/* Dados dos Animais */}
        <Card style={{marginBottom:12}}>
          <div style={{color:"#86efac",fontSize:10,fontWeight:700,letterSpacing:.8,textTransform:"uppercase",marginBottom:14}}>1. DADOS DOS ANIMAIS</div>
          <FLErr label="Nº de Animais *" erro={erros.animais}>
            <NI value={animais} onChange={v=>{setAnimais(v);setErros(e=>({...e,animais:""}))}} suffix="cab" erro={erros.animais}/>
          </FLErr>
          <FLErr label="Peso de Entrada *" erro={erros.pesoEntrada}>
            <NI value={pesoEntrada} onChange={v=>{setPesoEntrada(v);setErros(e=>({...e,pesoEntrada:""}))}} suffix="kg" erro={erros.pesoEntrada}/>
          </FLErr>
          {n(pesoEntrada)>0&&<div style={{background:"rgba(255,255,255,0.03)",borderRadius:8,padding:"8px 12px",marginBottom:10,display:"flex",gap:20}}>
            <span style={{color:"#64748b",fontSize:12}}>Entrada: <strong style={{color:"#94a3b8"}}>{fmt(n(pesoEntrada)/15,2)} @/cab</strong></span>
            {custoSugerido>0&&<span style={{color:"#64748b",fontSize:12}}>Valor pela cot.: <strong style={{color:"#4ade80"}}>R$ {fmt(custoSugerido,0)}/cab</strong></span>}
          </div>}
          <FLErr label="Custo de Compra por Animal (R$) *" erro={erros.custoCompra}>
            <NI value={custoCompraManual} onChange={v=>{setCustoCompraManual(v);setErros(e=>({...e,custoCompra:""}))}} prefix="R$" erro={erros.custoCompra}/>
            {!custoCompraManual&&custoSugerido>0&&<div style={{color:"#4ade80",fontSize:11,marginTop:3}}>↑ Vazio = usa valor pela cotação (R$ {fmt(custoSugerido,0)})</div>}
          </FLErr>
        </Card>

        {/* Período e Custos */}
        <Card style={{marginBottom:12}}>
          <div style={{color:"#86efac",fontSize:10,fontWeight:700,letterSpacing:.8,textTransform:"uppercase",marginBottom:14}}>2. PERÍODO E CUSTOS OPERACIONAIS</div>
          <FLErr label="Mês e Ano Previsto de Venda *" erro={erros.mesVenda}>
            <TI value={mesVendaStr} onChange={v=>{setMesVendaStr(v);setErros(e=>({...e,mesVenda:""}))}} placeholder="Ex: 10/2026" erro={erros.mesVenda}/>
            {periodoData?<div style={{color:"#4ade80",fontSize:11,marginTop:3}}>✓ {periodoData.dias} dias — {periodoData.label}</div>
              :mesVendaStr.length>3&&<div style={{color:"#f87171",fontSize:11,marginTop:3}}>Formato MM/AAAA, data futura</div>}
          </FLErr>
          <FL label="GMD Esperado">
            <NI value={gmd} onChange={setGmd} suffix="kg/dia"/>
            <div style={{color:"#475569",fontSize:10,marginTop:3}}>Confinamento: 1.2–1.8 kg/dia</div>
          </FL>
          <FL label="Custo Diário / Animal">
            <NI value={custoDiario} onChange={setCustoDiario} prefix="R$" suffix="/dia"/>
            <div style={{color:"#475569",fontSize:10,marginTop:3}}>Inclui ração, sanidade, M.O.</div>
          </FL>
          {periodoData&&n(gmd)>0&&n(pesoEntrada)>0&&<div style={{background:"rgba(255,255,255,0.03)",borderRadius:8,padding:"8px 12px",display:"flex",gap:20,flexWrap:"wrap"}}>
            <span style={{color:"#64748b",fontSize:12}}>Peso saída est.: <strong style={{color:"#f1f5f9"}}>{fmt(n(pesoEntrada)+n(gmd)*periodoData.dias,0)} kg</strong></span>
            <span style={{color:"#64748b",fontSize:12}}>@ saída: <strong style={{color:"#f1f5f9"}}>{fmt((n(pesoEntrada)+n(gmd)*periodoData.dias)/15,2)} @/cab</strong></span>
            <span style={{color:"#64748b",fontSize:12}}>@ produzidas: <strong style={{color:"#4ade80"}}>{fmt(n(gmd)*periodoData.dias/15,2)} @/cab</strong></span>
          </div>}
        </Card>

        {/* Preço de Venda */}
        <Card style={{marginBottom:14}}>
          <div style={{color:"#86efac",fontSize:10,fontWeight:700,letterSpacing:.8,textTransform:"uppercase",marginBottom:14}}>3. PREÇO DE VENDA</div>
          <FLErr label="Preço por Arroba na Venda (R$/@) *" erro={erros.precoVenda}>
            <NI value={precoVenda} onChange={v=>{setPrecoVenda(v);setErros(e=>({...e,precoVenda:""}))}} prefix="R$" suffix="/@" erro={erros.precoVenda}/>
            {bgi&&<div style={{color:"#475569",fontSize:11,marginTop:3}}>Cotação BGI atual: R$ {fmt(bgi.preco)} — <button onClick={()=>setPrecoVenda(String(bgi.preco))} style={{background:"none",border:"none",color:"#4ade80",fontSize:11,cursor:"pointer",padding:0,fontWeight:600}}>usar</button></div>}
          </FLErr>
        </Card>

        {/* Botão Calcular */}
        <button onClick={calcular}
          style={{width:"100%",background:"linear-gradient(135deg,#16a34a,#15803d)",border:"none",borderRadius:14,padding:"15px",color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer",marginBottom:16,letterSpacing:.3}}>
          Calcular Projeção
        </button>

        {/* ── RESULTADOS ── */}
        {sim&&r&&<>

          {/* Resumo zootécnico */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
            {[
              ["Período",`${r.periodo} dias`,"#94a3b8"],
              ["Peso de saída",`${fmt(sim.pesoSaida,0)} kg`,"#f1f5f9"],
              ["@ produzidas/cab",`${fmt(sim.arrobasProduzidas,2)} @`,"#4ade80"],
            ].map(([l,v,c])=>(
              <div key={l} style={{background:"rgba(255,255,255,0.04)",borderRadius:12,padding:"10px 12px",textAlign:"center",border:"1px solid rgba(255,255,255,0.07)"}}>
                <div style={{color:c,fontWeight:700,fontSize:14}}>{v}</div>
                <div style={{color:"#475569",fontSize:10,marginTop:3}}>{l}</div>
              </div>
            ))}
          </div>

          {/* Custos e Receita */}
          <Card style={{marginBottom:12}}>
            <div style={{color:"#94a3b8",fontSize:10,fontWeight:700,letterSpacing:.8,textTransform:"uppercase",marginBottom:10}}>Composição de Custos e Receita</div>
            <Row label={`Compra (${r.qtd} cab × R$ ${fmt(r.custoCompra,0)})`} value={`R$ ${fmt(sim.custoCompraTotal,0)}`} color="#f87171"/>
            <Row label={`Operacional (${r.periodo}d × ${r.qtd} cab × R$ ${fmt(r.custoDiario,2)})`} value={`R$ ${fmt(sim.custoPeriodoTotal,0)}`} color="#f87171"/>
            <Row label="Custo Total" value={`R$ ${fmt(sim.custoTotal,0)}`} color="#fbbf24" bold/>
            <div style={{margin:"6px 0"}}/>
            <Row label={`Receita (${fmt(sim.arrobasSaida*r.qtd,1)} @ × R$ ${fmt(r.precoArroba)})`} value={`R$ ${fmt(sim.receitaTotal,0)}`} color="#4ade80" bold/>
          </Card>

          {/* Indicadores-chave */}
          <Card style={{marginBottom:12,background:"rgba(255,255,255,0.03)"}}>
            <div style={{color:"#94a3b8",fontSize:10,fontWeight:700,letterSpacing:.8,textTransform:"uppercase",marginBottom:10}}>Indicadores de Rentabilidade</div>
            <Row label="Custo da @ produzida" value={`R$ ${fmt(sim.custoPorArrobaProd)}`} small/>
            <Row label="Lucro por arroba vendida" value={`${sim.lucroArroba>=0?"+":""}R$ ${fmt(sim.lucroArroba)}`} color={sim.lucroArroba>=0?"#4ade80":"#f87171"} small/>
            <Row label="Lucro por cabeça" value={`${sim.lucro/r.qtd>=0?"+":""}R$ ${fmt(sim.lucro/r.qtd,0)}`} color={sim.lucro>=0?"#4ade80":"#f87171"} small/>
            <Row label="ROI total" value={`${fmtPct(sim.roi)}`} color={sim.roi>=0?"#4ade80":"#f87171"} small/>
            <Row label="Rentabilidade mensal" value={`${fmtPct(sim.roiMensal)}/mês`} color={sim.roiMensal>=0?"#86efac":"#fca5a5"} small/>
          </Card>

          {/* PREÇO DE EQUILÍBRIO — destaque */}
          <Card style={{marginBottom:12,background:"rgba(251,191,36,0.07)",border:"1px solid rgba(251,191,36,.25)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{color:"#fbbf24",fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:.5,marginBottom:4}}>⚖️ Preço de Equilíbrio (break-even)</div>
                <div style={{color:"#64748b",fontSize:11}}>Mínimo para não ter prejuízo</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{color:"#fbbf24",fontSize:26,fontWeight:800,letterSpacing:-1}}>R$ {fmt(sim.precoEquilibrio)}</div>
                <div style={{fontSize:11,marginTop:2}}>
                  {r.precoArroba>sim.precoEquilibrio
                    ?<span style={{color:"#4ade80"}}>✓ R$ {fmt(r.precoArroba-sim.precoEquilibrio)} acima do equilíbrio</span>
                    :<span style={{color:"#f87171"}}>⚠ R$ {fmt(sim.precoEquilibrio-r.precoArroba)} abaixo do equilíbrio</span>}
                </div>
              </div>
            </div>
          </Card>

          {/* RESULTADO FINAL */}
          <Card style={{marginBottom:14,background:positivo?"rgba(22,163,74,0.08)":"rgba(239,68,68,0.08)",border:`1px solid ${positivo?"rgba(22,163,74,.25)":"rgba(239,68,68,.25)"}`}}>
            <div style={{color:positivo?"#86efac":"#fca5a5",fontSize:10,fontWeight:700,letterSpacing:.8,textTransform:"uppercase",marginBottom:12}}>
              {positivo?"✅ OPERAÇÃO LUCRATIVA":"⚠️ OPERAÇÃO COM PREJUÍZO"} · {r.periodoLabel}
            </div>
            <div style={{textAlign:"center",marginBottom:14}}>
              <div style={{color:"#64748b",fontSize:12,marginBottom:4}}>Lucro / Prejuízo Total ({r.qtd} animais)</div>
              <div style={{color:positivo?"#4ade80":"#f87171",fontSize:34,fontWeight:800,letterSpacing:-1}}>
                {positivo?"+":""}R$ {fmt(sim.lucro,0)}
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
              {[
                ["Por cabeça",`${positivo?"+":""}R$ ${fmt(sim.lucro/r.qtd,0)}`,positivo?"#86efac":"#fca5a5"],
                ["ROI",fmtPct(sim.roi),positivo?"#86efac":"#fca5a5"],
                ["Ao mês",`${fmtPct(sim.roiMensal)}`,"#94a3b8"],
              ].map(([l,v,c])=>(
                <div key={l} style={{textAlign:"center"}}>
                  <div style={{color:c,fontWeight:700,fontSize:13}}>{v}</div>
                  <div style={{color:"#475569",fontSize:10,marginTop:2}}>{l}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* CENÁRIOS */}
          {cenarios&&<Card style={{marginBottom:14}}>
            <div style={{color:"#94a3b8",fontSize:10,fontWeight:700,letterSpacing:.8,textTransform:"uppercase",marginBottom:14}}>📈 Análise de Cenários (variação de ±10% na arroba)</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
              {cenarios.map(c=>(
                <div key={c.label} style={{background:"rgba(255,255,255,0.04)",borderRadius:12,padding:"12px 10px",border:`1px solid ${c.lucro>=0?"rgba(22,163,74,.15)":"rgba(239,68,68,.15)"}`,textAlign:"center"}}>
                  <div style={{color:c.cor,fontSize:11,fontWeight:700,marginBottom:6}}>{c.label}</div>
                  <div style={{color:"#64748b",fontSize:10,marginBottom:8}}>R$ {fmt(c.preco)}/@</div>
                  <div style={{color:c.lucro>=0?"#4ade80":"#f87171",fontWeight:800,fontSize:14,marginBottom:3}}>
                    {c.lucro>=0?"+":""}R$ {fmt(c.lucro,0)}
                  </div>
                  <div style={{color:"#475569",fontSize:10}}>ROI: {fmtPct(c.roi)}</div>
                  <div style={{color:"#334155",fontSize:10,marginTop:4,borderTop:"1px solid rgba(255,255,255,0.05)",paddingTop:4}}>
                    Eq.: R$ {fmt(c.precoEquilibrio)}
                  </div>
                </div>
              ))}
            </div>
          </Card>}

        </>}
      </div>

      <div style={{color:"#1e293b",fontSize:10,textAlign:"center",paddingBottom:8}}>
        Cotações: B3 Futuros (BGI) · AwesomeAPI · Atraso de até 15 min<br/>
        Simulação baseada em CEPEA/ESALQ e Scot Consultoria — estimativa sem impostos, frete ou mortalidade.
      </div>
    </div>
  </div>);
}
