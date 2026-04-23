import{useState}from"react";
import{saveAccount}from"../db";
import{exportBackup,importBackupFile,confirmImport}from"../backup";
import{Btn,Input}from"../components/FormElements";
import Modal from"../components/Modal";

export default function Config({user,onAtualizar}){
  const[msg,setMsg]=useState(null);const[loading,setLoading]=useState(false);
  const[passModal,setPassModal]=useState(false);const[novaSenha,setNovaSenha]=useState("");const[confirmarSenha,setConfirmarSenha]=useState("");
  const[importing,setImporting]=useState(false);const[importInfo,setImportInfo]=useState(null);const[importData,setImportData]=useState(null);

  const alterarSenha=async()=>{
    if(!novaSenha||novaSenha.length<6){setMsg({t:"error",m:"Mínimo 6 caracteres"});return}
    if(novaSenha!==confirmarSenha){setMsg({t:"error",m:"Senhas não conferem"});return}
    user.password=novaSenha;user.mustChangePassword=false;await saveAccount(user);
    setMsg({t:"success",m:"Senha alterada com sucesso!"});setPassModal(false);setNovaSenha("");setConfirmarSenha("");
    if(onAtualizar)onAtualizar(user);
  };

  const handleExport=async()=>{
    setLoading(true);const r=await exportBackup(user.email);
    if(r.success)setMsg({t:"success",m:"Backup exportado com sucesso!"});else if(!r.cancelled)setMsg({t:"error",m:r.error||"Erro ao exportar"});
    setLoading(false);
  };

  const handleImport=async()=>{
    const r=await importBackupFile();
    if(r.success){setImportInfo(r.info);setImportData(r.data);setImporting(true)}
    else if(r.error)setMsg({t:"error",m:r.error});
  };

  const handleConfirmImport=async()=>{
    const r=await confirmImport(importData);
    if(r.success)setMsg({t:"success",m:"Dados restaurados com sucesso!"});else setMsg({t:"error",m:r.error});
    setImporting(false);
  };

  return(<div style={{padding:"0 4px"}}>
    <h2 style={{color:"#f1f5f9",margin:"0 0 18px",fontSize:20,fontWeight:700}}>Configurações</h2>

    {msg&&<div style={{padding:"11px 14px",borderRadius:12,marginBottom:14,fontSize:13,background:msg.t==="success"?"rgba(22,163,74,.1)":"rgba(239,68,68,.1)",color:msg.t==="success"?"#22c55e":"#ef4444",border:"1px solid "+(msg.t==="success"?"rgba(22,163,74,.25)":"rgba(239,68,68,.2)")}}>{msg.m}</div>}

    <div style={{background:"#111a11",borderRadius:18,padding:"18px",marginBottom:12,border:"1px solid rgba(255,255,255,0.06)"}}>
      <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16}}>
        <div style={{width:52,height:52,borderRadius:16,background:"linear-gradient(135deg,#16a34a,#15803d)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,fontWeight:800,color:"#fff"}}>
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <div style={{color:"#f1f5f9",fontWeight:700,fontSize:16}}>{user.name}</div>
          <div style={{color:"#64748b",fontSize:12,marginTop:2}}>{user.email}</div>
          <div style={{color:"#16a34a",fontSize:11,marginTop:2,fontWeight:600}}>{user.role==="admin"?"Administrador":"Usuário"}</div>
        </div>
      </div>
      <button onClick={()=>{setPassModal(true);setMsg(null)}} style={{width:"100%",padding:"11px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,color:"#94a3b8",fontSize:13,fontWeight:600,cursor:"pointer",textAlign:"left"}}>
        🔑 Alterar senha
      </button>
    </div>

    <div style={{background:"#111a11",borderRadius:18,padding:"18px",marginBottom:12,border:"1px solid rgba(255,255,255,0.06)"}}>
      <div style={{color:"#64748b",fontSize:11,fontWeight:700,letterSpacing:.8,marginBottom:12}}>BACKUP</div>
      <p style={{color:"#64748b",fontSize:12,marginBottom:14,lineHeight:1.5}}>Exporte seus dados para guardar uma cópia. Restaure em outro dispositivo quando necessário.</p>
      <div style={{display:"flex",gap:8}}>
        <button onClick={handleExport} disabled={loading}
          style={{flex:1,padding:"11px",background:"rgba(34,197,94,.1)",border:"1px solid rgba(34,197,94,.2)",borderRadius:12,color:"#22c55e",fontSize:13,fontWeight:700,cursor:loading?"not-allowed":"pointer",opacity:loading?.6:1}}>
          {loading?"...":"📤 Exportar"}
        </button>
        <button onClick={handleImport}
          style={{flex:1,padding:"11px",background:"rgba(59,130,246,.1)",border:"1px solid rgba(59,130,246,.2)",borderRadius:12,color:"#60a5fa",fontSize:13,fontWeight:700,cursor:"pointer"}}>
          📥 Restaurar
        </button>
      </div>
    </div>

    <div style={{background:"#111a11",borderRadius:18,padding:"18px",border:"1px solid rgba(255,255,255,0.06)"}}>
      <div style={{color:"#64748b",fontSize:11,fontWeight:700,letterSpacing:.8,marginBottom:10}}>SOBRE O APP</div>
      <div style={{color:"#475569",fontSize:13,lineHeight:1.8}}>
        <div>🐄 GadoControle v1.2</div>
        <div>Gestão de gado de corte (engorda)</div>
        <div style={{marginTop:8,color:"#334155"}}>Funcionalidades: lotes, animais por brinco, pesagens com GMD, custos, vendas, saúde do rebanho, relatórios PDF</div>
      </div>
    </div>

    <Modal open={passModal} onClose={()=>setPassModal(false)} title="Alterar Senha">
      <Input label="Nova senha" type="password" value={novaSenha} onChange={e=>setNovaSenha(e.target.value)} placeholder="Mínimo 6 caracteres"/>
      <Input label="Confirmar senha" type="password" value={confirmarSenha} onChange={e=>setConfirmarSenha(e.target.value)} placeholder="Repita a senha"/>
      <Btn onClick={alterarSenha}>Salvar Nova Senha</Btn>
    </Modal>

    <Modal open={importing} onClose={()=>setImporting(false)} title="Restaurar Backup">
      {importInfo&&<div>
        <div style={{background:"rgba(245,158,11,.08)",border:"1px solid rgba(245,158,11,.2)",borderRadius:12,padding:"12px 14px",marginBottom:16}}>
          <div style={{color:"#f59e0b",fontSize:13,fontWeight:600}}>⚠️ Os dados atuais serão substituídos. Essa ação não pode ser desfeita.</div>
        </div>
        <div style={{background:"rgba(255,255,255,0.04)",borderRadius:12,padding:"14px",marginBottom:16}}>
          <div style={{color:"#94a3b8",fontSize:13,lineHeight:2}}>
            📅 Data: <strong style={{color:"#f1f5f9"}}>{importInfo.date}</strong><br/>
            🏠 Fazendas: <strong style={{color:"#f1f5f9"}}>{importInfo.fazendas}</strong><br/>
            📦 Lotes: <strong style={{color:"#f1f5f9"}}>{importInfo.lotes}</strong><br/>
            🐄 Animais: <strong style={{color:"#f1f5f9"}}>{importInfo.animais}</strong><br/>
            ⚖️ Pesagens: <strong style={{color:"#f1f5f9"}}>{importInfo.pesagens}</strong><br/>
            💰 Custos: <strong style={{color:"#f1f5f9"}}>{importInfo.custos}</strong><br/>
            🤝 Vendas: <strong style={{color:"#f1f5f9"}}>{importInfo.vendas}</strong><br/>
            💉 Saúde: <strong style={{color:"#f1f5f9"}}>{importInfo.saude}</strong>
          </div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <Btn onClick={()=>setImporting(false)} color="rgba(255,255,255,0.06)" style={{flex:1,border:"1px solid rgba(255,255,255,0.08)",color:"#94a3b8"}}>Cancelar</Btn>
          <Btn onClick={handleConfirmImport} color="linear-gradient(135deg,#16a34a,#15803d)" style={{flex:1}}>Restaurar</Btn>
        </div>
      </div>}
    </Modal>
  </div>);
}
