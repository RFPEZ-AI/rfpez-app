-- RFPEZ.AI Specialty Sites Schema
-- Adds support for procurement vertical specialty pages

-- 1. SPECIALTY_SITES table - defines procurement vertical pages
CREATE TABLE IF NOT EXISTS public.specialty_sites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,              -- Display name e.g., "TMC Sourcing"
  slug TEXT NOT NULL UNIQUE,               -- URL slug e.g., "tmc", "home"
  description TEXT,                        -- Description of the specialty
  hero_title TEXT,                         -- Custom hero section title
  hero_subtitle TEXT,                      -- Custom hero section subtitle
  is_default BOOLEAN DEFAULT FALSE,        -- Marks the default specialty (home page)
  is_active BOOLEAN DEFAULT TRUE,          -- Whether this specialty is currently active
  sort_order INTEGER DEFAULT 0,            -- Display order in listings
  metadata JSONB DEFAULT '{}'::jsonb,      -- Additional config (branding, colors, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure only one default specialty site
CREATE UNIQUE INDEX IF NOT EXISTS idx_specialty_sites_default 
  ON public.specialty_sites(is_default) 
  WHERE is_default = TRUE;

-- 2. SPECIALTY_SITE_AGENTS junction table - associates agents with specialty sites
CREATE TABLE IF NOT EXISTS public.specialty_site_agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  specialty_site_id UUID REFERENCES public.specialty_sites(id) ON DELETE CASCADE NOT NULL,
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE NOT NULL,
  is_default_agent BOOLEAN DEFAULT FALSE,  -- Default agent for this specialty
  sort_order INTEGER DEFAULT 0,            -- Display order within specialty
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(specialty_site_id, agent_id)      -- Prevent duplicate assignments
);

-- 3. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_specialty_sites_slug ON public.specialty_sites(slug);
CREATE INDEX IF NOT EXISTS idx_specialty_sites_active ON public.specialty_sites(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_specialty_site_agents_site ON public.specialty_site_agents(specialty_site_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_specialty_site_agents_agent ON public.specialty_site_agents(agent_id);
CREATE INDEX IF NOT EXISTS idx_specialty_site_agents_default ON public.specialty_site_agents(specialty_site_id, is_default_agent) 
  WHERE is_default_agent = TRUE;

-- 4. Row Level Security Policies
ALTER TABLE public.specialty_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specialty_site_agents ENABLE ROW LEVEL SECURITY;

-- Anyone can view active specialty sites
CREATE POLICY "Anyone can view active specialty sites" 
  ON public.specialty_sites FOR SELECT 
  USING (is_active = true);

-- Anyone can view specialty site agent associations
CREATE POLICY "Anyone can view specialty site agents" 
  ON public.specialty_site_agents FOR SELECT 
  USING (true);

-- Only admins can modify (add admin policies later via admin tools)
-- CREATE POLICY "Admins can manage specialty sites" 
--   ON public.specialty_sites FOR ALL 
--   USING (auth.jwt() ->> 'role' = 'administrator');

-- 5. Trigger for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_specialty_sites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_specialty_sites_updated_at ON public.specialty_sites;
CREATE TRIGGER update_specialty_sites_updated_at 
  BEFORE UPDATE ON public.specialty_sites 
  FOR EACH ROW 
  EXECUTE FUNCTION update_specialty_sites_updated_at();

-- 6. Helper function to get agents for a specialty site
CREATE OR REPLACE FUNCTION get_specialty_site_agents(site_slug TEXT)
RETURNS TABLE (
  agent_id UUID,
  agent_name TEXT,
  agent_description TEXT,
  agent_instructions TEXT,
  agent_initial_prompt TEXT,
  agent_avatar_url TEXT,
  is_active BOOLEAN,
  is_default BOOLEAN,
  sort_order INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.name,
    a.description,
    a.instructions,
    a.initial_prompt,
    a.avatar_url,
    a.is_active,
    ssa.is_default_agent,
    ssa.sort_order
  FROM public.agents a
  INNER JOIN public.specialty_site_agents ssa ON a.id = ssa.agent_id
  INNER JOIN public.specialty_sites ss ON ssa.specialty_site_id = ss.id
  WHERE ss.slug = site_slug
    AND ss.is_active = true
    AND a.is_active = true
  ORDER BY ssa.sort_order, a.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
