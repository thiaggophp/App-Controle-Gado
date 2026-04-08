import{exportAllData,importAllData}from"./db";
export async function exportBackup(ownerEmail){
  try{
    const data=await exportAllData(ownerEmail);const json=JSON.stringify(data,null,2);
    const blob=new Blob([json],{type:"application/json"});
    const fn="gado-backup-"+new Date().toISOString().slice(0,10)+".json";
    if(navigator.share&&navigator.canShare){
      try{const file=new File([blob],fn,{type:"application/json"});const sd={files:[file],title:"Backup GadoControle"};if(navigator.canShare(sd)){await navigator.share(sd);return{success:true,method:"share"}}}catch(shareErr){if(shareErr.name==="AbortError")return{success:false,cancelled:true}}
    }
    const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=fn;document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);
    return{success:true,method:"download"};
  }catch(err){if(err.name==="AbortError")return{success:false,cancelled:true};return{success:false,error:err.message}}
}
export function importBackupFile(){
  return new Promise(resolve=>{
    const input=document.createElement("input");input.type="file";input.accept=".json";
    input.onchange=async e=>{const file=e.target.files?.[0];if(!file){resolve({success:false});return}
      try{const text=await file.text();const data=JSON.parse(text);
        if(data.appName!=="GadoControle"){resolve({success:false,error:"Arquivo inválido"});return}
        resolve({success:true,data,info:{date:data.exportDate?new Date(data.exportDate).toLocaleDateString("pt-BR"):"?",fazendas:data.fazendas?.length||0,lotes:data.lotes?.length||0,animais:data.animais?.length||0,pesagens:data.pesagens?.length||0,custos:data.custos?.length||0,vendas:data.vendas?.length||0,saude:data.saude?.length||0}});
      }catch{resolve({success:false,error:"Arquivo corrompido"})}
    };input.click();
  });
}
export async function confirmImport(data){try{await importAllData(data);return{success:true}}catch(err){return{success:false,error:err.message}}}
