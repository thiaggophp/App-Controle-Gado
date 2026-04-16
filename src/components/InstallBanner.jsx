import{useState,useEffect}from"react";

export default function InstallBanner(){
  const[prompt,setPrompt]=useState(null);
  const[showIOS,setShowIOS]=useState(false);
  const[gone,setGone]=useState(()=>!!localStorage.getItem("gado-pwa-ok"));

  useEffect(()=>{
    if(gone)return;
    const standalone=window.matchMedia("(display-mode: standalone)").matches||navigator.standalone;
    if(standalone){setGone(true);return;}
    const isIOS=/iphone|ipad|ipod/i.test(navigator.userAgent.toLowerCase());
    if(isIOS){setShowIOS(true);return;}
    const h=e=>{e.preventDefault();setPrompt(e);};
    window.addEventListener("beforeinstallprompt",h);
    return()=>window.removeEventListener("beforeinstallprompt",h);
  },[gone]);

  const dismiss=()=>{localStorage.setItem("gado-pwa-ok","1");setGone(true);};
  const install=async()=>{
    if(!prompt)return;
    prompt.prompt();
    await prompt.userChoice;
    dismiss();
  };

  if(gone||(!prompt&&!showIOS))return null;

  return(
    <div style={{
      position:"fixed",bottom:70,left:0,right:0,zIndex:90,
      padding:"0 12px",maxWidth:600,margin:"0 auto"
    }}>
      <div style={{
        background:"rgba(10,15,10,.97)",
        border:"1px solid rgba(22,163,74,.3)",
        borderLeft:"3px solid #16a34a",
        borderRadius:10,padding:"12px 14px",
        display:"flex",alignItems:"center",gap:10,
        boxShadow:"0 4px 24px rgba(0,0,0,.5)"
      }}>
        <div style={{
          width:36,height:36,borderRadius:10,flexShrink:0,
          background:"linear-gradient(135deg,#16a34a,#15803d)",
          display:"flex",alignItems:"center",justifyContent:"center",fontSize:18
        }}>🐂</div>
        <div style={{flex:1,minWidth:0}}>
          {showIOS?(
            <>
              <div style={{fontSize:12,fontWeight:700,color:"#f1f5f9",marginBottom:2}}>Instalar app</div>
              <div style={{fontSize:11,color:"#64748b",lineHeight:1.4}}>
                Toque em <span style={{color:"#4ade80"}}>Compartilhar ⬆</span> → <span style={{color:"#4ade80"}}>Tela Inicial</span>
              </div>
            </>
          ):(
            <>
              <div style={{fontSize:12,fontWeight:700,color:"#f1f5f9",marginBottom:2}}>Instalar GadoControle</div>
              <div style={{fontSize:11,color:"#64748b"}}>Acesso rápido na tela inicial</div>
            </>
          )}
        </div>
        {!showIOS&&(
          <button onClick={install} style={{
            padding:"7px 14px",borderRadius:8,border:"none",
            background:"#16a34a",color:"#fff",fontSize:11,fontWeight:700,
            cursor:"pointer",flexShrink:0
          }}>Instalar</button>
        )}
        <button onClick={dismiss} style={{
          background:"none",border:"none",cursor:"pointer",
          color:"#475569",padding:"4px 6px",flexShrink:0,fontSize:16,lineHeight:1
        }}>✕</button>
      </div>
    </div>
  );
}
