import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { lovable } from '@/integrations/lovable';
import { useAuth } from '@/lib/auth';
import { brandLogo, privateHead } from '@/lib/identity';
export const Route=createFileRoute('/auth')({head:()=>privateHead('Entrar','Acesse sua conta com Google ou Microsoft.'),component:AuthPage});
function AuthPage(){
 const {user,ready}=useAuth(); const navigate=useNavigate();const [busy,setBusy]=useState<string|null>(null);const [error,setError]=useState('');
 useEffect(()=>{if(ready && user)void navigate({to:'/meus-pedidos',replace:true});},[ready,user,navigate]);
 async function login(provider:'google'|'microsoft'){
 setBusy(provider);setError('');try{const result=await lovable.auth.signInWithOAuth(provider,{redirect_uri:`${window.location.origin}/auth`,...(provider==='google'?{extraParams:{prompt:'select_account'}}:{})});if(result.error)setError('Não foi possível entrar. Tente novamente.');}catch{setError('Não foi possível entrar. Tente novamente.');}finally{setBusy(null);}
 }
 return <section className="mx-auto max-w-sm px-4 py-10 text-center"><img src={brandLogo} alt="Líder Grifes" width={128} height={128} className="mx-auto h-32 w-32 object-contain"/><h1 className="mt-5 text-2xl font-semibold">Líder Grifes Atacado</h1><div className="mt-8 flex flex-col gap-3"><Button variant="outline" className="h-12 text-base" disabled={!!busy} onClick={()=>login('google')}><LogIn/> {busy==='google'?'Conectando…':'Entrar com Google'}</Button><Button variant="outline" className="h-12 text-base" disabled={!!busy} onClick={()=>login('microsoft')}><LogIn/> {busy==='microsoft'?'Conectando…':'Entrar com Microsoft'}</Button></div>{error && <p role="alert" className="mt-4 text-destructive">{error}</p>}<Button asChild variant="link" className="mt-5 h-11"><Link to="/">Continuar sem entrar</Link></Button></section>;
}
