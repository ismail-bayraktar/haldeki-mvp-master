-- Create trigger on auth.users for new user registration
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Manually fix existing users who signed up but trigger didn't run
-- User 1: test.bayi@haldeki.com (dealer)
INSERT INTO public.profiles (id, email, full_name)
VALUES ('2b1d6898-5ea6-4a17-b222-8544c6eeb543', 'test.bayi@haldeki.com', 'Bayi Test')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
VALUES ('2b1d6898-5ea6-4a17-b222-8544c6eeb543', 'dealer')
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.dealers (user_id, name, contact_name, contact_phone, contact_email, region_ids)
VALUES (
  '2b1d6898-5ea6-4a17-b222-8544c6eeb543',
  'Test Bayi Ltd.',
  'Ahmet Yılmaz',
  '0532 111 2233',
  'test.bayi@haldeki.com',
  ARRAY['f3f99886-d57e-4e7d-ac30-b5c0c160eabb', 'ec3bbce1-a8cc-4700-8125-d65b1ee66132']::UUID[]
)
ON CONFLICT DO NOTHING;

-- Mark invite as used
UPDATE public.pending_invites 
SET used_at = now() 
WHERE email = 'test.bayi@haldeki.com' AND used_at IS NULL;

-- User 2: test.tedarikci@haldeki.com (supplier)
INSERT INTO public.profiles (id, email, full_name)
VALUES ('98b713e1-9f60-49df-a6e0-aa285b0c54f2', 'test.tedarikci@haldeki.com', 'Tedarikci')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
VALUES ('98b713e1-9f60-49df-a6e0-aa285b0c54f2', 'supplier')
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.suppliers (user_id, name, contact_name, contact_phone, contact_email)
VALUES (
  '98b713e1-9f60-49df-a6e0-aa285b0c54f2',
  'Test Tedarik A.Ş.',
  'Mehmet Kaya',
  '0533 444 5566',
  'test.tedarikci@haldeki.com'
)
ON CONFLICT DO NOTHING;

-- Mark invite as used
UPDATE public.pending_invites 
SET used_at = now() 
WHERE email = 'test.tedarikci@haldeki.com' AND used_at IS NULL;