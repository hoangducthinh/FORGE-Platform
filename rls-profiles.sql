-- Bảng profiles RLS Policies

-- 1. Cho phép Admins và Managers xem toàn bộ profiles
create policy "Admins and managers can view all profiles"
  on public.profiles
  for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('admin', 'manager')
    )
  );

-- 2. Cho phép Admins cập nhật toàn bộ profiles
create policy "Admins can update all profiles"
  on public.profiles
  for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role = 'admin'
    )
  );

-- Lưu ý: Đảm bảo bạn đã có policy cho phép user tự đọc profile của chính mình
-- create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
-- create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
