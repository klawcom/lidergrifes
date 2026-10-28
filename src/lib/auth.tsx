import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { accountQuery } from './account.functions';
const AuthContext = createContext<{user:User|null; ready:boolean; admin:boolean; signOut:()=>Promise<void>}>({user:null,ready:false,admin:false,signOut:async()=>{}});
export function AuthProvider({children}:{children:ReactNode}) {
 const [user,setUser]=useState<User|null>(null); const [ready,setReady]=useState(false);
 const queryClient=useQueryClient(); const router=useRouter();
 const account=useQuery({...accountQuery,queryKey:['account',user?.id ?? 'signed-out'],enabled:!!user});
 useEffect(()=>{
 let active=true; let generation=0;
 const refresh=async()=>{ const g=++generation; const {data}=await supabase.auth.getUser(); if(active && g===generation){setUser(data.user);setReady(true);} };
 const {data:{subscription}}=supabase.auth.onAuthStateChange(event=>{
 if(!['SIGNED_IN','SIGNED_OUT','USER_UPDATED'].includes(event))return;
 if(event==='SIGNED_OUT'){++generation;setUser(null);setReady(true);queryClient.clear();void router.invalidate();}
 else {void refresh().then(()=>{void router.invalidate();void queryClient.invalidateQueries();});}
 });
 void refresh(); return ()=>{active=false;subscription.unsubscribe();};
 },[queryClient,router]);
 const signOut=async()=>{await queryClient.cancelQueries();queryClient.clear();await supabase.auth.signOut();await router.navigate({to:'/auth',replace:true});};
 return <AuthContext.Provider value={{user,ready,admin:account.data?.admin===true,signOut}}>{children}</AuthContext.Provider>;
}
export const useAuth=()=>useContext(AuthContext);
