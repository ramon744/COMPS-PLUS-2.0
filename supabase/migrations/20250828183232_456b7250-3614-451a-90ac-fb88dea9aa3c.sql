-- Fix security issue: Restrict profile access to own profile only
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create new policy that only allows users to view their own profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);