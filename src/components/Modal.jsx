import{useRef,useEffect}from"react";
export default function Modal({open,onClose,title,children}){
  const ignore=useRef(false);
  useEffect(()=>{
    const fn=()=>{if(document.hidden){ignore.current=true}else{setTimeout(()=>{ignore.current=false},800)}};
    document.addEventListener("visibilitychange",fn);
    return()=>document.removeEventListener("visibilitychange",fn);
  },[]);
  if(!open)return null;
  return(<div onClick={()=>{if(!ignore.current)onClose()}} style={{position:"fixed",inset:0,zIndex:1000,background:"rgba(0,0,0,.8)",display:"flex",alignItems:"flex-end",justifyContent:"center",backdropFilter:"blur(4px)",animation:"fadeIn .2s ease"}}>
    <div onClick={e=>e.stopPropagation()} style={{background:"#0e1a0e",borderRadius:"28px 28px 0 0",padding:"20px 20px 36px",width:"100%",maxWidth:480,maxHeight:"90vh",overflowY:"auto",animation:"slideUp .25s ease",border:"1px solid rgba(255,255,255,0.07)",borderBottom:"none"}}>
      <div style={{width:36,height:4,background:"rgba(255,255,255,0.12)",borderRadius:2,margin:"0 auto 20px"}}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h3 style={{margin:0,color:"#f1f5f9",fontSize:18,fontWeight:700}}>{title}</h3>
        <button onClick={onClose} style={{background:"rgba(255,255,255,0.06)",border:"none",color:"#94a3b8",fontSize:16,cursor:"pointer",padding:"6px 10px",borderRadius:10}}>✕</button>
      </div>{children}
    </div></div>);
}
