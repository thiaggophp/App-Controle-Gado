import React from"react";
export default class ErrorBoundary extends React.Component{
  constructor(props){super(props);this.state={erro:null}}
  static getDerivedStateFromError(e){return{erro:e}}
  render(){
    if(this.state.erro){
      return(<div style={{minHeight:"100vh",background:"#0a0f0a",display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
        <div style={{textAlign:"center",maxWidth:320}}>
          <div style={{fontSize:52,marginBottom:16}}>⚠️</div>
          <div style={{color:"#f1f5f9",fontSize:18,fontWeight:700,marginBottom:8}}>Algo deu errado</div>
          <div style={{color:"#64748b",fontSize:13,marginBottom:8,lineHeight:1.5}}>O app encontrou um erro inesperado.</div>
          <div style={{color:"#334155",fontSize:11,marginBottom:24,fontFamily:"monospace",background:"rgba(255,255,255,0.04)",borderRadius:8,padding:"8px 12px"}}>
            {this.state.erro?.message||"Erro desconhecido"}
          </div>
          <button onClick={()=>window.location.reload()}
            style={{background:"linear-gradient(135deg,#16a34a,#15803d)",border:"none",borderRadius:12,padding:"12px 28px",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",width:"100%"}}>
            Recarregar App
          </button>
        </div>
      </div>);
    }
    return this.props.children;
  }
}
