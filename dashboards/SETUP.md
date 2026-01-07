# Environment Variables Setup

Create a `.env.local` file in the `dashboards/` directory with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenRouter API Configuration
OPENROUTER_API_KEY=your_openrouter_api_key

# Site URL (for OpenRouter referer)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Getting Your Keys

### Supabase
1. Go to [supabase.com](https://supabase.com) and create a project
2. Go to Settings > API
3. Copy the Project URL and anon/public key
4. Copy the service_role key (keep this secret!)

### OpenRouter
1. Go to [openrouter.ai](https://openrouter.ai)
2. Sign up and go to Keys
3. Create a new API key

## Supabase Table Setup

Run this SQL in your Supabase SQL Editor:

```sql
CREATE TABLE reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT NOT NULL,
  ai_response TEXT,
  ai_summary TEXT,
  ai_actions TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (you can restrict later)
CREATE POLICY "Allow all" ON reviews FOR ALL USING (true);
```
