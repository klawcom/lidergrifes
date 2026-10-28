ALTER TABLE public.clientes ADD COLUMN user_id uuid;
CREATE UNIQUE INDEX clientes_user_id_unique ON public.clientes(user_id) WHERE user_id IS NOT NULL;
ALTER TABLE public.pedidos ADD COLUMN user_id uuid;
CREATE TABLE public.profiles (id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, display_name text, avatar_url text);
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_profile_read ON public.profiles FOR SELECT TO authenticated USING (id=auth.uid());
CREATE POLICY own_profile_update ON public.profiles FOR UPDATE TO authenticated USING (id=auth.uid()) WITH CHECK(id=auth.uid());
DROP POLICY "admin manage roles" ON public.user_roles;
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT EXISTS(SELECT 1 FROM public.user_roles r JOIN auth.users u ON u.id=r.user_id WHERE r.user_id=_user_id AND r.role=_role AND (_role <> 'admin' OR (lower(u.email)='klaw.com@gmail.com' AND u.email_confirmed_at IS NOT NULL))) $$;
CREATE OR REPLACE FUNCTION public.sync_store_account() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 INSERT INTO public.profiles(id,display_name,avatar_url) VALUES(NEW.id,coalesce(NEW.raw_user_meta_data->>'full_name',NEW.raw_user_meta_data->>'name'),coalesce(NEW.raw_user_meta_data->>'avatar_url',NEW.raw_user_meta_data->>'picture')) ON CONFLICT(id) DO NOTHING;
 DELETE FROM public.user_roles WHERE user_id=NEW.id AND role='admin' AND (lower(NEW.email) IS DISTINCT FROM 'klaw.com@gmail.com' OR NEW.email_confirmed_at IS NULL);
 IF NEW.email_confirmed_at IS NOT NULL THEN
 INSERT INTO public.user_roles(user_id,role) VALUES(NEW.id,CASE WHEN lower(NEW.email)='klaw.com@gmail.com' THEN 'admin'::public.app_role ELSE 'user'::public.app_role END) ON CONFLICT(user_id,role) DO NOTHING;
 UPDATE public.clientes SET user_id=NEW.id WHERE lower(email)=lower(NEW.email) AND (user_id IS NULL OR user_id=NEW.id);
 END IF;
 RETURN NEW; END $$;
CREATE TRIGGER store_account_sync AFTER INSERT OR UPDATE OF email,email_confirmed_at ON auth.users FOR EACH ROW EXECUTE FUNCTION public.sync_store_account();
REVOKE ALL ON FUNCTION public.sync_store_account() FROM PUBLIC,anon,authenticated;
INSERT INTO public.profiles(id,display_name,avatar_url) SELECT id,coalesce(raw_user_meta_data->>'full_name',raw_user_meta_data->>'name'),raw_user_meta_data->>'avatar_url' FROM auth.users ON CONFLICT(id) DO NOTHING;
UPDATE public.clientes c SET user_id=u.id FROM auth.users u WHERE lower(c.email)=lower(u.email) AND u.email_confirmed_at IS NOT NULL;
CREATE POLICY own_customer_read ON public.clientes FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE POLICY own_order_read ON public.pedidos FOR SELECT TO authenticated USING(user_id=auth.uid() OR (user_id IS NULL AND EXISTS(SELECT 1 FROM public.clientes c WHERE c.id=cliente_id AND c.user_id=auth.uid())));
CREATE POLICY own_order_items_read ON public.pedido_itens FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.pedidos p WHERE p.id=pedido_id));
REVOKE INSERT ON public.clientes,public.pedidos,public.pedido_itens FROM anon,authenticated;
ALTER TABLE public.configuracoes ALTER COLUMN whatsapp_loja SET DEFAULT '5566996444461';