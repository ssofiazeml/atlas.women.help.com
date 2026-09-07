CREATE TABLE public.site_content (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_content TO anon, authenticated;
GRANT ALL ON public.site_content TO service_role;

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public content is readable"
ON public.site_content
FOR SELECT
TO anon, authenticated
USING (true);

CREATE OR REPLACE FUNCTION public.set_site_content_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER site_content_set_updated_at
BEFORE UPDATE ON public.site_content
FOR EACH ROW
EXECUTE FUNCTION public.set_site_content_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.site_content;