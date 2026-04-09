export function InputMoney({label,value,onChange,style,...props}){
  const handleChange=(e)=>{
    const v=e.target.value.replace(/[^0-9.,]/g,"").replace(",",".");
    onChange({target:{value:v}});
  };
  const handleBlur=(e)=>{
    e.target.style.borderColor="rgba(255,255,255,0.08)";e.target.style.boxShadow="none";
    const n=parseFloat(e.target.value.replace(",","."));
    onChange({target:{value:(!isNaN(n)&&n>=0)?n.toFixed(2):""}});
  };
  return(<div style={{marginBottom:16}}>
    {label&&<label style={{display:"block",color:"#64748b",fontSize:11,marginBottom:6,fontWeight:700,textTransform:"uppercase",letterSpacing:.8}}>{label}</label>}
    <input type="text" inputMode="decimal" value={value??""} onChange={handleChange}
      onFocus={e=>{e.target.style.borderColor="rgba(22,163,74,.7)";e.target.style.boxShadow="0 0 0 3px rgba(22,163,74,.15)"}}
      onBlur={handleBlur}
      style={{width:"100%",padding:"13px 16px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,color:"#f1f5f9",fontSize:15,outline:"none",boxSizing:"border-box",transition:"border .2s,box-shadow .2s",WebkitAppearance:"none",colorScheme:"dark",...(style||{})}}
      {...props}/>
  </div>)
}
export function Input({label,style,onFocus,onBlur,...props}){
  return(<div style={{marginBottom:16}}>
    {label&&<label style={{display:"block",color:"#64748b",fontSize:11,marginBottom:6,fontWeight:700,textTransform:"uppercase",letterSpacing:.8}}>{label}</label>}
    <input {...props}
      onFocus={e=>{e.target.style.borderColor="rgba(22,163,74,.7)";e.target.style.boxShadow="0 0 0 3px rgba(22,163,74,.15)";if(onFocus)onFocus(e)}}
      onBlur={e=>{e.target.style.borderColor="rgba(255,255,255,0.08)";e.target.style.boxShadow="none";if(onBlur)onBlur(e)}}
      style={{width:"100%",padding:"13px 16px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,color:"#f1f5f9",fontSize:15,outline:"none",boxSizing:"border-box",transition:"border .2s,box-shadow .2s",WebkitAppearance:"none",colorScheme:"dark",...(style||{})}}/>
  </div>)
}
export function Select({label,options,...props}){
  return(<div style={{marginBottom:16}}>
    {label&&<label style={{display:"block",color:"#64748b",fontSize:11,marginBottom:6,fontWeight:700,textTransform:"uppercase",letterSpacing:.8}}>{label}</label>}
    <select {...props} style={{width:"100%",padding:"13px 16px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,color:"#f1f5f9",fontSize:15,outline:"none",boxSizing:"border-box",WebkitAppearance:"none",appearance:"none",colorScheme:"dark"}}>
      {options.map(o=><option key={o.value} value={o.value} style={{background:"#0e1a0e",color:"#f1f5f9"}}>{o.label}</option>)}
    </select>
  </div>)
}
export function Btn({children,color,style,disabled,...props}){
  const bg=color||"linear-gradient(135deg,#16a34a,#15803d)";
  return(<button disabled={disabled} {...props}
    style={{background:bg,color:"#fff",border:"none",borderRadius:14,padding:"14px 20px",fontSize:15,fontWeight:700,cursor:disabled?"not-allowed":"pointer",width:"100%",opacity:disabled?.5:1,transition:"opacity .15s",letterSpacing:.2,...(style||{})}}>
    {children}
  </button>)
}
