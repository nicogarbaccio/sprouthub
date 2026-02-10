-- Create a security definer function that allows anonymous users to check username availability.
-- This is needed because the profiles table has RLS that prevents anonymous reads,
-- but we need to validate username uniqueness during sign-up before the user is authenticated.
CREATE OR REPLACE FUNCTION public.check_username_available(p_username text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE username = p_username
  );
$$;

-- Grant anonymous users permission to call this function
GRANT EXECUTE ON FUNCTION public.check_username_available(text) TO anon;
GRANT EXECUTE ON FUNCTION public.check_username_available(text) TO authenticated;
