-- Create function invocations table first, then add policies
CREATE TABLE IF NOT EXISTS public.function_invocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name text NOT NULL,
  payload jsonb,
  user_id text,
  status text,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.function_invocations ENABLE ROW LEVEL SECURITY;

-- Then add the policy
CREATE POLICY "Service role can manage function invocations"
ON public.function_invocations
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');