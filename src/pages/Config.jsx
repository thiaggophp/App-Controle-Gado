import{useState}from"react";
import{saveAccount}from"../db";
import{Btn,Input}from"../components/FormElements";
import Modal from"../components/Modal";

export default function Config({user,onAtualizar}){
  const[msg,setMsg]=useState(null);
  const[passModal,setPassModal]=useState(false);const[novaSenha,setNovaSenha]=useState("");const[confirmarSenha,setConfirmarSenha]=useState("");

  const alterarSenha=async()=>{
    if(!novaSenha||novaSenha.length<6){setMsg({t:"error",m:"Mínimo 6 caracteres"});return}
    if(novaSenha!==confirmarSenha){setMsg({t:"error",m:"Senhas não conferem"});return}
    user.password=novaSenha;user.mustChangePassword=false;await saveAccount(user);
    setMsg({t:"success",m:"Senha alterada com sucesso!"});setPassModal(false);setNovaSenha("");setConfirmarSenha("");
    if(onAtualizar)onAtualizar(user);
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

    <div style={{background:"#111a11",borderRadius:18,padding:"18px",border:"1px solid rgba(255,255,255,0.06)"}}>
      <div style={{color:"#64748b",fontSize:11,fontWeight:700,letterSpacing:.8,marginBottom:10}}>SOBRE O APP</div>
      <div style={{color:"#475569",fontSize:13,lineHeight:1.8}}>
        <div>🐄 GadoControle v1.0</div>
        <div>Gestão de gado de corte (engorda)</div>
        <div style={{marginTop:8,color:"#334155"}}>Funcionalidades: lotes, animais por brinco, pesagens com GMD, custos, vendas, saúde do rebanho, relatórios PDF</div>
      </div>
    </div>

    <Modal open={passModal} onClose={()=>setPassModal(false)} title="Alterar Senha">
      <Input label="Nova senha" type="password" value={novaSenha} onChange={e=>setNovaSenha(e.target.value)} placeholder="Mínimo 6 caracteres"/>
      <Input label="Confirmar senha" type="password" value={confirmarSenha} onChange={e=>setConfirmarSenha(e.target.value)} placeholder="Repita a senha"/>
      <Btn onClick={alterarSenha}>Salvar Nova Senha</Btn>
    </Modal>
  </div>);
}
