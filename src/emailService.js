const SERVICE_ID=import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID=import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY=import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

export function generatePassword(len=8){
  const chars="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let p="";for(let i=0;i<len;i++)p+=chars[Math.floor(Math.random()*chars.length)];return p;
}
export async function sendPasswordEmail(toName,toEmail,tempPassword){
  const res=await fetch("https://api.emailjs.com/api/v1.0/email/send",{method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({service_id:SERVICE_ID,template_id:TEMPLATE_ID,user_id:PUBLIC_KEY,
      template_params:{to_name:toName,to_email:toEmail,user_email:toEmail,temp_password:tempPassword}})});
  if(!res.ok)throw new Error("Falha ao enviar e-mail: "+res.status);
  return true;
}
