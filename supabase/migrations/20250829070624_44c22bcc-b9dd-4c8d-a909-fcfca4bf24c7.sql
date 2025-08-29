-- Create settings table for application configuration
CREATE TABLE public.settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  config_key TEXT NOT NULL,
  config_value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own settings" 
ON public.settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own settings" 
ON public.settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" 
ON public.settings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings" 
ON public.settings 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create unique index to prevent duplicate config keys per user
CREATE UNIQUE INDEX settings_user_config_key_idx ON public.settings(user_id, config_key);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_settings_updated_at
BEFORE UPDATE ON public.settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();