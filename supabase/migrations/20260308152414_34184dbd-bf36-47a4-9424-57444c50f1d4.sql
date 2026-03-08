ALTER TABLE public.clientes
ADD COLUMN IF NOT EXISTS cpf text,
ADD COLUMN IF NOT EXISTS endereco text,
ADD COLUMN IF NOT EXISTS observacoes text;