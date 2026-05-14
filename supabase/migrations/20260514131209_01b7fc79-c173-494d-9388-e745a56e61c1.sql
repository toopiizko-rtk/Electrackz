CREATE TABLE public.work_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  detail text NOT NULL,
  unit text NOT NULL DEFAULT 'm',
  use_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (category, detail)
);

ALTER TABLE public.work_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read presets" ON public.work_presets FOR SELECT USING (true);
CREATE POLICY "public write presets" ON public.work_presets FOR INSERT WITH CHECK (true);
CREATE POLICY "public update presets" ON public.work_presets FOR UPDATE USING (true);
CREATE POLICY "public delete presets" ON public.work_presets FOR DELETE USING (true);