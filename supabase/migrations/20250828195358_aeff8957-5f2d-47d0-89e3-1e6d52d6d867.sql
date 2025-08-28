-- Enable real-time for tables
ALTER TABLE public.comps REPLICA IDENTITY FULL;
ALTER TABLE public.comp_types REPLICA IDENTITY FULL;
ALTER TABLE public.waiters REPLICA IDENTITY FULL;
ALTER TABLE public.managers REPLICA IDENTITY FULL;
ALTER TABLE public.closings REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.comps;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comp_types;
ALTER PUBLICATION supabase_realtime ADD TABLE public.waiters;
ALTER PUBLICATION supabase_realtime ADD TABLE public.managers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.closings;