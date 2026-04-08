export default function Card({children,style,onClick}){
  return(<div onClick={onClick} style={{background:"#111a11",borderRadius:18,padding:16,marginBottom:10,border:"1px solid rgba(255,255,255,0.06)",cursor:onClick?"pointer":"default",transition:"all .15s",...(style||{})}}>{children}</div>);
}
