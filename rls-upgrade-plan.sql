-- Script to upgrade profiles schema for 3-tier pricing (Free, Team, Enterprise)

-- 1. Add new columns
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'active',
ADD COLUMN IF NOT EXISTS subscription_started_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS subscription_ends_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS organization_id uuid,
ADD COLUMN IF NOT EXISTS seat_limit integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS seats_used integer DEFAULT 1;

-- 2. If 'plan' is an ENUM type, this might fail, so we might need to alter the ENUM.
-- Assuming 'plan' is a text column with a check constraint, we might need to drop the constraint first if it exists.
-- (This step is specific to your DB setup, but usually in Next.js+Supabase tutorials, it's just a text column).
-- If it's an ENUM type named 'user_plan':
-- ALTER TYPE user_plan ADD VALUE IF NOT EXISTS 'team';
-- ALTER TYPE user_plan ADD VALUE IF NOT EXISTS 'enterprise';

-- 3. Migrate existing 'premium' users to 'team'
UPDATE public.profiles
SET 
  plan = 'team',
  is_premium = true,
  seat_limit = 20,
  subscription_status = 'active',
  subscription_started_at = COALESCE(created_at, now()),
  subscription_ends_at = premium_until
WHERE plan = 'premium';

-- 4. Set defaults for 'free'
UPDATE public.profiles
SET 
  seat_limit = 1,
  subscription_status = 'active'
WHERE plan = 'free' OR plan IS NULL;

-- 5. Optional constraint update if needed
-- ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;
-- ALTER TABLE public.profiles ADD CONSTRAINT profiles_plan_check CHECK (plan IN ('free', 'team', 'enterprise'));
