export function generatePassword(len=8){
  const chars="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let p="";for(let i=0;i<len;i++)p+=chars[Math.floor(Math.random()*chars.length)];return p;
}
export async function sendPasswordEmail(toName,toEmail,tempPassword){
  const res=await fetch("https://mail.financascasa.online/send-password",{method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({to_name:toName,to_email:toEmail,temp_password:tempPassword,app_name:"GadoControle"})});
  if(!res.ok)throw new Error("Falha ao enviar e-mail: "+res.status);
  return true;
}
export async function sendSignupNotification(name,email){
  try{await fetch("https://mail.financascasa.online/notify-signup",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({requester_name:name,requester_email:email,app_name:"GadoControle"})})}catch{}
}
