-- Bảng lessons RLS Policies

-- 1. Cho phép tất cả mọi người được ĐỌC (SELECT) lessons
-- Bạn có thể giới hạn chỉ user đã enroll, nhưng mặc định cho phép đọc để hiển thị danh sách
create policy "Allow public read access to lessons" 
  on public.lessons
  for select 
  using (true);

-- 2. Cho phép Admin, Manager được INSERT/UPDATE/DELETE
create policy "Allow admin and manager full access to lessons"
  on public.lessons
  for all 
  using (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() 
      and role in ('admin', 'manager')
    )
  );

-- 3. Cho phép Premium User được INSERT lesson vào course do HỌ TẠO
create policy "Allow premium user insert lesson to owned course"
  on public.lessons
  for insert
  with check (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() 
      and (is_premium = true or plan = 'premium')
    )
    and exists (
      select 1 from public.courses
      where id = course_id 
      and created_by = auth.uid()
    )
  );

-- 4. Cho phép Premium User được UPDATE lesson trong course do HỌ TẠO
create policy "Allow premium user update lesson in owned course"
  on public.lessons
  for update
  using (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() 
      and (is_premium = true or plan = 'premium')
    )
    and exists (
      select 1 from public.courses
      where id = course_id 
      and created_by = auth.uid()
    )
  );

-- 5. Cho phép Premium User được DELETE lesson trong course do HỌ TẠO
create policy "Allow premium user delete lesson in owned course"
  on public.lessons
  for delete
  using (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() 
      and (is_premium = true or plan = 'premium')
    )
    and exists (
      select 1 from public.courses
      where id = course_id 
      and created_by = auth.uid()
    )
  );
