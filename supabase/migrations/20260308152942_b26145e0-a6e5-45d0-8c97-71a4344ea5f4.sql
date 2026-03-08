-- Add trial_ends_at to empresas
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS trial_ends_at timestamp with time zone DEFAULT (now() + interval '7 days');

-- Add empresa_id to existing tables
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.reboques ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.alugueis ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome text,
  role text NOT NULL DEFAULT 'admin',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reboques ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alugueis ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user's empresa_id
CREATE OR REPLACE FUNCTION public.get_user_empresa_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT empresa_id FROM public.profiles WHERE id = auth.uid()
$$;

-- Helper function: check if user is super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin'
  )
$$;

-- RLS: profiles
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "Super admin reads all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.is_super_admin());

-- RLS: empresas
CREATE POLICY "Users can read own empresa" ON public.empresas FOR SELECT TO authenticated USING (id = public.get_user_empresa_id());
CREATE POLICY "Super admin reads all empresas" ON public.empresas FOR SELECT TO authenticated USING (public.is_super_admin());
CREATE POLICY "Super admin updates empresas" ON public.empresas FOR UPDATE TO authenticated USING (public.is_super_admin());

-- RLS: clientes
CREATE POLICY "Tenant isolation for clientes" ON public.clientes FOR ALL TO authenticated USING (empresa_id = public.get_user_empresa_id());
CREATE POLICY "Super admin reads all clientes" ON public.clientes FOR SELECT TO authenticated USING (public.is_super_admin());

-- RLS: reboques
CREATE POLICY "Tenant isolation for reboques" ON public.reboques FOR ALL TO authenticated USING (empresa_id = public.get_user_empresa_id());
CREATE POLICY "Super admin reads all reboques" ON public.reboques FOR SELECT TO authenticated USING (public.is_super_admin());

-- RLS: alugueis
CREATE POLICY "Tenant isolation for alugueis" ON public.alugueis FOR ALL TO authenticated USING (empresa_id = public.get_user_empresa_id());
CREATE POLICY "Super admin reads all alugueis" ON public.alugueis FOR SELECT TO authenticated USING (public.is_super_admin());

-- Trigger to auto-create profile and empresa on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_empresa_id uuid;
BEGIN
  INSERT INTO public.empresas (nome, email)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'empresa_nome', 'Minha Empresa'),
    NEW.email
  )
  RETURNING id INTO new_empresa_id;

  INSERT INTO public.profiles (id, empresa_id, nome, role)
  VALUES (
    NEW.id,
    new_empresa_id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'admin')
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();