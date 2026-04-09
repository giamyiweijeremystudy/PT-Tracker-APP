ALTER TABLE public.profiles ADD COLUMN rank text NOT NULL DEFAULT '';

-- Allow users to view all profiles (for demo template)
CREATE POLICY "All authenticated can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Drop narrower select policies now covered by the above
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Finance can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Managers can view managed profiles" ON public.profiles;