-- 1. Bổ sung các cột cấu hình quyền riêng tư cho courses
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'public';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS allow_self_enroll boolean DEFAULT true;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS invite_code text UNIQUE;

-- Đảm bảo giá trị hợp lệ
ALTER TABLE public.courses ADD CONSTRAINT courses_visibility_check CHECK (visibility IN ('public', 'private', 'unlisted'));

-- 2. Tạo bảng course_members
CREATE TABLE IF NOT EXISTS public.course_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  member_role text DEFAULT 'student' CHECK (member_role IN ('student', 'instructor', 'manager')),
  added_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  joined_at timestamp with time zone DEFAULT now(),
  UNIQUE(course_id, user_id)
);

-- 3. Tạo bảng course_invitations
CREATE TABLE IF NOT EXISTS public.course_invitations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  invited_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  token uuid DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked')),
  expires_at timestamp with time zone NOT NULL,
  accepted_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(course_id, email)
);

-- 4. Bật RLS
ALTER TABLE public.course_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_invitations ENABLE ROW LEVEL SECURITY;

-- 5. Helper Function kiểm tra Member và Admin
CREATE OR REPLACE FUNCTION public.is_course_member_or_owner(course_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM courses WHERE id = course_uuid AND created_by = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM course_members WHERE course_id = course_uuid AND user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager')
  );
$$;

-- 6. Cập nhật RLS Policies cho courses
-- Xoá policy cũ nếu có (bạn có thể tuỳ chỉnh theo tên policy hiện tại của dự án)
DROP POLICY IF EXISTS "Public courses are viewable by everyone" ON public.courses;
DROP POLICY IF EXISTS "Courses are viewable by everyone" ON public.courses;
DROP POLICY IF EXISTS "Anyone can view courses" ON public.courses;

CREATE POLICY "View courses based on visibility and membership"
ON public.courses
FOR SELECT
TO authenticated
USING (
  visibility = 'public'
  OR created_by = auth.uid()
  OR EXISTS (SELECT 1 FROM course_members WHERE course_id = id AND user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

-- Policy Update (chỉ owner/admin mới được sửa) - giả định policy update cũ vẫn đang đúng, 
-- nhưng ta cứ tạo 1 policy cover toàn bộ.
-- Lưu ý: Policy update/insert courses nên giữ nguyên của dự án, hoặc mình ghi đè để an toàn:
-- DROP POLICY IF EXISTS "Users can create courses" ON public.courses;
-- DROP POLICY IF EXISTS "Users can update own courses" ON public.courses;

-- 7. Cập nhật RLS Policies cho lessons
DROP POLICY IF EXISTS "Lessons are viewable by everyone" ON public.lessons;
DROP POLICY IF EXISTS "Anyone can view lessons" ON public.lessons;

CREATE POLICY "View lessons if course is accessible"
ON public.lessons
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM courses c 
    WHERE c.id = course_id 
    AND (
      c.visibility = 'public'
      OR c.created_by = auth.uid()
      OR EXISTS (SELECT 1 FROM course_members WHERE course_id = c.id AND user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
    )
  )
);

-- 8. RLS cho course_members
CREATE POLICY "View course members"
ON public.course_members
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() -- Tự xem mình
  OR EXISTS (SELECT 1 FROM courses WHERE id = course_id AND created_by = auth.uid()) -- Owner xem tất cả
  OR EXISTS (SELECT 1 FROM course_members cm WHERE cm.course_id = course_id AND cm.user_id = auth.uid() AND cm.member_role IN ('instructor', 'manager')) -- Quản lý khóa học
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager')) -- Admin
);

CREATE POLICY "Insert course members"
ON public.course_members
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM courses WHERE id = course_id AND created_by = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  OR user_id = auth.uid() -- Cho phép tự join nếu có logic kiểm tra (VD: accept lời mời)
);

CREATE POLICY "Update course members"
ON public.course_members
FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM courses WHERE id = course_id AND created_by = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

CREATE POLICY "Delete course members"
ON public.course_members
FOR DELETE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM courses WHERE id = course_id AND created_by = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  OR user_id = auth.uid() -- Tự rời khóa
);

-- 9. RLS cho course_invitations
CREATE POLICY "View course invitations"
ON public.course_invitations
FOR SELECT
TO authenticated
USING (
  email = auth.jwt()->>'email' -- Người được mời
  OR EXISTS (SELECT 1 FROM courses WHERE id = course_id AND created_by = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

CREATE POLICY "Insert course invitations"
ON public.course_invitations
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM courses WHERE id = course_id AND created_by = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

CREATE POLICY "Update course invitations"
ON public.course_invitations
FOR UPDATE
TO authenticated
USING (
  email = auth.jwt()->>'email'
  OR EXISTS (SELECT 1 FROM courses WHERE id = course_id AND created_by = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);
