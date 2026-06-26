-- =============================================
-- FORGE EdTech Demo — Migration + Seed Script
-- =============================================
-- HƯỚNG DẪN:
-- 1. Tạo 8 tài khoản qua /auth/signup (hoặc Supabase Dashboard > Authentication > Users)
-- 2. Chạy TOÀN BỘ file SQL này trong Supabase SQL Editor
-- 3. Script sẽ tự update profiles, tạo courses, lessons, invitations
-- =============================================

-- ============================================
-- PHẦN A: MIGRATION — Tạo bảng course_certificates
-- BẢN FIX: tránh lỗi policy already exists
-- ============================================

CREATE TABLE IF NOT EXISTS public.course_certificates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  certificate_number text UNIQUE NOT NULL,
  progress_percent numeric DEFAULT 100,
  average_ai_score numeric DEFAULT 0,
  issued_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, course_id)
);

ALTER TABLE public.course_certificates ENABLE ROW LEVEL SECURITY;

-- Xóa policy cũ nếu đã tồn tại
DROP POLICY IF EXISTS "Users can view own certificates"
ON public.course_certificates;

DROP POLICY IF EXISTS "Owners and admins can view course certificates"
ON public.course_certificates;

DROP POLICY IF EXISTS "Service can insert certificates"
ON public.course_certificates;

-- User xem chứng chỉ của mình
CREATE POLICY "Users can view own certificates"
ON public.course_certificates
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
);

-- Owner/Admin xem chứng chỉ trong khóa của mình
CREATE POLICY "Owners and admins can view course certificates"
ON public.course_certificates
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.courses
    WHERE courses.id = course_certificates.course_id
      AND courses.created_by = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
  )
);

-- Cho user insert chứng chỉ của chính mình nếu app cần.
-- Nếu API dùng service_role thì service_role sẽ bypass RLS.
CREATE POLICY "Service can insert certificates"
ON public.course_certificates
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
);

-- ============================================
-- PHẦN B: SEED — Cập nhật Profiles
-- ============================================
-- LƯU Ý: Chỉ chạy sau khi 8 tài khoản đã signup!
-- Script dùng email để tìm user, nên an toàn nếu user chưa tồn tại (sẽ bỏ qua)

-- 1. Set Nguyễn Xuân Hưng = Manager + Team
UPDATE public.profiles SET
  full_name = 'Nguyễn Xuân Hưng',
  role = 'manager',
  plan = 'team',
  is_premium = true,
  seat_limit = 30
WHERE email = 'nguyenxuanhung@gmail.com';

-- 2–8. Set các học viên = Student + Free
UPDATE public.profiles SET full_name = 'Phạm Minh Hoàng', role = 'student', plan = 'free' WHERE email = 'phamminhhoang@gmail.com';
UPDATE public.profiles SET full_name = 'Nguyễn Minh Châu', role = 'student', plan = 'free' WHERE email = 'nguyenminhchau@gmail.com';
UPDATE public.profiles SET full_name = 'Cao Trà My', role = 'student', plan = 'free' WHERE email = 'caotramy@gmail.com';
UPDATE public.profiles SET full_name = 'Nguyễn Minh Hùng', role = 'student', plan = 'free' WHERE email = 'nguyenminhhung@gmail.com';
UPDATE public.profiles SET full_name = 'Phạm Ngọc Tân', role = 'student', plan = 'free' WHERE email = 'phamngoctan@gmail.com';
UPDATE public.profiles SET full_name = 'Trần Minh Phương', role = 'student', plan = 'free' WHERE email = 'tranminhphuong@gmail.com';
UPDATE public.profiles SET full_name = 'Lê Hoàng Minh', role = 'student', plan = 'free' WHERE email = 'lehoangminh@gmail.com';

-- ============================================
-- PHẦN C: SEED — Tạo 3 Khóa học EdTech Private
-- ============================================
-- Sử dụng DO block để lấy user_id của Hưng

DO $$
DECLARE
  v_hung_id uuid;
  v_course1_id uuid;
  v_course2_id uuid;
  v_course3_id uuid;
BEGIN
  -- Lấy user_id của Nguyễn Xuân Hưng
  SELECT id INTO v_hung_id FROM public.profiles WHERE email = 'nguyenxuanhung@gmail.com';
  
  IF v_hung_id IS NULL THEN
    RAISE NOTICE 'Tài khoản nguyenxuanhung@gmail.com chưa tồn tại. Vui lòng signup trước.';
    RETURN;
  END IF;

  -- ========== KHÓA HỌC 1: AI trong Thiết Kế Bài Giảng EdTech ==========
  INSERT INTO public.courses (id, title, description, category, level, is_published, visibility, allow_self_enroll, created_by)
  VALUES (
    gen_random_uuid(),
    'AI trong Thiết Kế Bài Giảng EdTech',
    'Khóa học giúp học viên hiểu cách ứng dụng AI để thiết kế bài giảng số, xây dựng mục tiêu học tập, chia nhỏ nội dung, tạo câu hỏi kiểm tra và cá nhân hóa trải nghiệm học tập cho người học trên nền tảng EdTech.',
    'AI & EdTech',
    'Beginner',
    true,
    'private',
    false,
    v_hung_id
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_course1_id;

  -- Nếu đã tồn tại, lấy id cũ
  IF v_course1_id IS NULL THEN
    SELECT id INTO v_course1_id FROM public.courses WHERE title = 'AI trong Thiết Kế Bài Giảng EdTech' AND created_by = v_hung_id;
  END IF;

  -- ========== KHÓA HỌC 2: AI Tutor Và Cá Nhân Hóa Học Tập ==========
  INSERT INTO public.courses (id, title, description, category, level, is_published, visibility, allow_self_enroll, created_by)
  VALUES (
    gen_random_uuid(),
    'AI Tutor Và Cá Nhân Hóa Học Tập',
    'Khóa học hướng dẫn học viên hiểu cách AI Tutor hỗ trợ người học thông qua hỏi đáp, gợi ý lộ trình học, phản hồi tự động và cá nhân hóa nội dung dựa trên năng lực, tốc độ học và kết quả tương tác của từng học viên.',
    'AI & EdTech',
    'Intermediate',
    true,
    'private',
    false,
    v_hung_id
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_course2_id;

  IF v_course2_id IS NULL THEN
    SELECT id INTO v_course2_id FROM public.courses WHERE title = 'AI Tutor Và Cá Nhân Hóa Học Tập' AND created_by = v_hung_id;
  END IF;

  -- ========== KHÓA HỌC 3: Ứng Dụng AI Để Đánh Giá Và Theo Dõi Tiến Độ Học Viên ==========
  INSERT INTO public.courses (id, title, description, category, level, is_published, visibility, allow_self_enroll, created_by)
  VALUES (
    gen_random_uuid(),
    'Ứng Dụng AI Để Đánh Giá Và Theo Dõi Tiến Độ Học Viên',
    'Khóa học giúp học viên hiểu cách sử dụng AI và dữ liệu học tập để đánh giá tiến độ, phát hiện học viên có nguy cơ bỏ học, phân tích thời gian học, điểm số, mức độ hoàn thành và đề xuất can thiệp phù hợp trong hệ thống đào tạo số.',
    'AI & EdTech',
    'Intermediate',
    true,
    'private',
    false,
    v_hung_id
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_course3_id;

  IF v_course3_id IS NULL THEN
    SELECT id INTO v_course3_id FROM public.courses WHERE title = 'Ứng Dụng AI Để Đánh Giá Và Theo Dõi Tiến Độ Học Viên' AND created_by = v_hung_id;
  END IF;

  -- ========== THÊM OWNER VÀO COURSE_MEMBERS ==========
  INSERT INTO public.course_members (course_id, user_id, member_role, added_by)
  VALUES
    (v_course1_id, v_hung_id, 'manager', v_hung_id),
    (v_course2_id, v_hung_id, 'manager', v_hung_id),
    (v_course3_id, v_hung_id, 'manager', v_hung_id)
  ON CONFLICT (course_id, user_id) DO NOTHING;

  -- ============================================
  -- PHẦN D: SEED — Tạo Lessons cho 3 khóa học
  -- ============================================

  -- ===== Lessons cho Khóa 1: AI trong Thiết Kế Bài Giảng EdTech =====
  
  -- Bài 1: Nội dung text
  INSERT INTO public.lessons (course_id, title, content, order_index, lesson_type, is_published)
  VALUES (v_course1_id, 'Tổng Quan Về AI Trong EdTech', 
    E'# Tổng Quan Về AI Trong EdTech\n\n## AI là gì?\nTrí tuệ nhân tạo (AI) là lĩnh vực khoa học máy tính tập trung vào việc tạo ra các hệ thống có khả năng thực hiện các tác vụ thường đòi hỏi trí thông minh của con người.\n\n## AI trong EdTech\nAI đang thay đổi cách chúng ta dạy và học:\n- **Cá nhân hóa học tập**: AI phân tích dữ liệu học viên để điều chỉnh nội dung phù hợp.\n- **Tự động hóa đánh giá**: Chấm bài, phản hồi tự động.\n- **Trợ lý ảo**: Chatbot hỗ trợ học viên 24/7.\n- **Phân tích học tập**: Theo dõi tiến độ và dự đoán kết quả.\n\n## Lợi ích chính\n1. Tiết kiệm thời gian cho giảng viên\n2. Trải nghiệm học tập được cá nhân hóa\n3. Phản hồi tức thời\n4. Mở rộng quy mô đào tạo\n5. Ra quyết định dựa trên dữ liệu\n\n## Các công cụ AI phổ biến trong EdTech\n- ChatGPT / Gemini cho tạo nội dung\n- Adaptive Learning Platforms\n- AI-powered LMS\n- Automated Assessment Tools',
    1, 'content', true)
  ON CONFLICT DO NOTHING;

  -- Bài 2: Nội dung text
  INSERT INTO public.lessons (course_id, title, content, order_index, lesson_type, is_published)
  VALUES (v_course1_id, 'Cách Thiết Kế Bài Giảng Số Với AI',
    E'# Cách Thiết Kế Bài Giảng Số Với AI\n\n## Quy trình 5 bước\n\n### Bước 1: Xác định mục tiêu học tập\nSử dụng AI để phân tích và tạo mục tiêu học tập theo mô hình Bloom Taxonomy:\n- Remember → Understand → Apply → Analyze → Evaluate → Create\n\n### Bước 2: Chia nhỏ nội dung (Chunking)\nAI giúp chia nội dung lớn thành các module nhỏ 5-10 phút:\n- Micro-learning modules\n- Spaced repetition\n- Progressive difficulty\n\n### Bước 3: Tạo nội dung đa phương tiện\n- AI tạo slide, infographic\n- Text-to-speech cho audio lessons\n- AI-generated quizzes\n\n### Bước 4: Thiết kế bài kiểm tra\n- Multiple choice tự động\n- Open-ended với AI grading\n- Scenario-based assessment\n\n### Bước 5: Cá nhân hóa lộ trình\n- Adaptive pathways\n- Pre-assessment placement\n- Remediation paths\n\n## Công cụ gợi ý\n- FORGE AI Simulator cho luyện tập\n- Canva AI cho visual\n- Notion AI cho outline',
    2, 'content', true)
  ON CONFLICT DO NOTHING;

  -- Bài 3: AI Knowledge Check
  INSERT INTO public.lessons (course_id, title, content, order_index, lesson_type, is_published, simulator_config)
  VALUES (v_course1_id, 'AI Kiểm Tra Kiến Thức Về Thiết Kế Bài Giảng',
    'Bài kiểm tra kiến thức sử dụng AI để đánh giá hiểu biết của bạn về thiết kế bài giảng EdTech.',
    3, 'ai_simulator', true,
    '{"mode":"knowledge_check","productName":"Thiết Kế Bài Giảng EdTech","productDescription":"Kiến thức về ứng dụng AI trong thiết kế bài giảng số, bao gồm Bloom Taxonomy, chunking, micro-learning, adaptive learning và assessment design.","scenarioDescription":"Kiểm tra kiến thức học viên về các khái niệm thiết kế bài giảng với AI.","openingCustomerMessage":"Chào bạn! Tôi sẽ kiểm tra kiến thức của bạn về thiết kế bài giảng EdTech với AI. Hãy sẵn sàng nhé!","keyFeatures":["Bloom Taxonomy và mục tiêu học tập","Chunking và micro-learning","AI-powered assessment","Adaptive learning paths","Cá nhân hóa trải nghiệm học tập"],"salesTips":["Trả lời đầy đủ và chính xác","Đưa ví dụ cụ thể khi có thể","Liên hệ lý thuyết với thực tế"]}'::jsonb)
  ON CONFLICT DO NOTHING;

  -- Bài 4: AI Sales Simulation
  INSERT INTO public.lessons (course_id, title, content, order_index, lesson_type, is_published, simulator_config)
  VALUES (v_course1_id, 'AI Mô Phỏng Tình Huống Thiết Kế Bài Giảng',
    'Mô phỏng tình huống thực tế: Bạn là chuyên viên EdTech cần tư vấn cho một trường đại học về việc ứng dụng AI vào thiết kế bài giảng.',
    4, 'ai_simulator', true,
    '{"mode":"sales","productName":"Giải pháp AI EdTech cho Đại học","productDescription":"Nền tảng ứng dụng AI để thiết kế bài giảng số, tự động tạo quiz, cá nhân hóa lộ trình học tập và phân tích kết quả học viên cho các trường đại học.","scenarioDescription":"Bạn là chuyên viên tư vấn EdTech. Một trưởng khoa CNTT của trường đại học muốn tìm hiểu về giải pháp AI để nâng cấp chương trình đào tạo online. Nhiệm vụ: tư vấn giải pháp phù hợp, giải đáp thắc mắc và chốt được buổi demo.","customerRole":"Trưởng khoa CNTT trường đại học","goal":"Thuyết phục khách hàng đặt lịch demo giải pháp AI EdTech","openingCustomerMessage":"Chào bạn, tôi là trưởng khoa CNTT. Trường chúng tôi đang muốn chuyển đổi sang đào tạo online nhưng chưa biết bắt đầu từ đâu. Bạn có thể giới thiệu giải pháp AI cho thiết kế bài giảng không?","keyFeatures":["Tự động tạo quiz và bài kiểm tra","Cá nhân hóa lộ trình cho từng sinh viên","Dashboard phân tích kết quả học tập","Tích hợp LMS hiện có","Hỗ trợ đa ngôn ngữ"],"commonObjections":["Chi phí triển khai quá cao","Giảng viên không quen công nghệ","Lo ngại về chất lượng nội dung AI tạo","Bảo mật dữ liệu sinh viên"],"salesTips":["Nhấn mạnh ROI: tiết kiệm thời gian giảng viên","Demo case study từ trường khác","Đề xuất pilot program miễn phí","Cam kết đào tạo giảng viên sử dụng"]}'::jsonb)
  ON CONFLICT DO NOTHING;

  -- ===== Lessons cho Khóa 2: AI Tutor Và Cá Nhân Hóa Học Tập =====
  
  INSERT INTO public.lessons (course_id, title, content, order_index, lesson_type, is_published)
  VALUES (v_course2_id, 'AI Tutor Là Gì Và Vì Sao Quan Trọng Trong EdTech',
    E'# AI Tutor Là Gì?\n\n## Định nghĩa\nAI Tutor là hệ thống trí tuệ nhân tạo đóng vai trò như một gia sư cá nhân, hỗ trợ học viên 24/7 thông qua:\n- Hỏi đáp tự động\n- Gợi ý tài liệu phù hợp\n- Phản hồi bài tập\n- Điều chỉnh độ khó\n\n## Vì sao AI Tutor quan trọng?\n\n### 1. Khả năng mở rộng\n- 1 giảng viên phục vụ hàng ngàn học viên\n- Không giới hạn thời gian hỗ trợ\n\n### 2. Cá nhân hóa\n- Mỗi học viên có lộ trình riêng\n- Tốc độ học phù hợp năng lực\n- Nội dung được điều chỉnh theo kết quả\n\n### 3. Phản hồi tức thời\n- Không cần đợi giảng viên chấm bài\n- Gợi ý cải thiện ngay lập tức\n- Motivation loop liên tục\n\n## Các loại AI Tutor\n1. **Rule-based**: Theo kịch bản có sẵn\n2. **ML-based**: Học từ dữ liệu tương tác\n3. **LLM-based**: Sử dụng GPT/Gemini cho hội thoại tự nhiên\n4. **Hybrid**: Kết hợp nhiều phương pháp',
    1, 'content', true)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.lessons (course_id, title, content, order_index, lesson_type, is_published)
  VALUES (v_course2_id, 'Cá Nhân Hóa Lộ Trình Học Tập',
    E'# Cá Nhân Hóa Lộ Trình Học Tập\n\n## Adaptive Learning là gì?\nHệ thống tự điều chỉnh nội dung và lộ trình dựa trên:\n- Kết quả pre-test\n- Tốc độ hoàn thành bài\n- Điểm quiz/assessment\n- Thời gian dành cho mỗi module\n- Pattern tương tác\n\n## Các mô hình cá nhân hóa\n\n### Mô hình 1: Mastery-based\n- Học viên phải đạt 80%+ mới sang bài tiếp\n- Tự động gợi ý bài ôn tập\n- Spaced repetition schedule\n\n### Mô hình 2: Competency-based\n- Map theo khung năng lực\n- Skip nội dung đã biết\n- Focus vào gaps\n\n### Mô hình 3: Interest-based\n- Gợi ý theo sở thích\n- Elective paths\n- Project-based options\n\n## Dữ liệu cần thu thập\n1. Time on task\n2. Completion rate\n3. Assessment scores\n4. Engagement metrics\n5. Help-seeking behavior\n\n## Implementation với FORGE\n- Pre-assessment quiz\n- AI phân loại level\n- Dynamic content delivery\n- Progress tracking\n- Automated interventions',
    2, 'content', true)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.lessons (course_id, title, content, order_index, lesson_type, is_published, simulator_config)
  VALUES (v_course2_id, 'AI Kiểm Tra Kiến Thức Về AI Tutor',
    'Bài kiểm tra kiến thức về AI Tutor và cá nhân hóa học tập.',
    3, 'ai_simulator', true,
    '{"mode":"knowledge_check","productName":"AI Tutor & Personalized Learning","productDescription":"Kiến thức về AI Tutor, adaptive learning, cá nhân hóa lộ trình học tập, mastery-based learning và competency-based education.","scenarioDescription":"Kiểm tra hiểu biết của học viên về AI Tutor và các mô hình cá nhân hóa học tập.","openingCustomerMessage":"Xin chào! Bài kiểm tra này sẽ đánh giá kiến thức của bạn về AI Tutor và cá nhân hóa học tập. Bạn đã sẵn sàng chưa?","keyFeatures":["Adaptive Learning","Mastery-based vs Competency-based","AI Tutor architecture","Learning analytics","Personalization strategies"],"salesTips":["Giải thích rõ khái niệm","So sánh các mô hình","Đưa ví dụ thực tế"]}'::jsonb)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.lessons (course_id, title, content, order_index, lesson_type, is_published, simulator_config)
  VALUES (v_course2_id, 'AI Mô Phỏng Tình Huống Hỗ Trợ Người Học',
    'Mô phỏng: Bạn là AI Tutor Designer cần tư vấn cho công ty EdTech về việc xây dựng hệ thống AI Tutor.',
    4, 'ai_simulator', true,
    '{"mode":"sales","productName":"Hệ thống AI Tutor cho Doanh nghiệp","productDescription":"Giải pháp AI Tutor tích hợp vào nền tảng đào tạo nội bộ doanh nghiệp, hỗ trợ nhân viên học tập cá nhân hóa 24/7 với chatbot AI, adaptive quizzes và progress tracking.","scenarioDescription":"Bạn là chuyên viên tư vấn AI Tutor. Giám đốc HR của một công ty công nghệ 500 nhân viên muốn triển khai hệ thống đào tạo nội bộ thông minh. Nhiệm vụ: tư vấn giải pháp AI Tutor phù hợp.","customerRole":"Giám đốc HR công ty công nghệ","goal":"Thuyết phục khách hàng pilot AI Tutor cho 1 phòng ban","openingCustomerMessage":"Xin chào, công ty chúng tôi có 500 nhân viên và đang gặp khó khăn trong đào tạo onboarding. Mỗi quý có 20-30 nhân viên mới nhưng team L&D chỉ có 3 người. Bạn có giải pháp gì không?","keyFeatures":["AI Chatbot hỗ trợ 24/7","Adaptive learning path","Auto-generated quizzes","Progress dashboard cho manager","Integration với Slack/Teams"],"commonObjections":["Nhân viên quen học truyền thống","Ngân sách L&D hạn chế","Lo ngại AI trả lời sai","Khó đo ROI đào tạo"],"salesTips":["Tính ROI: giảm thời gian onboarding 50%","Case study công ty tương tự","Pilot miễn phí 1 tháng","So sánh chi phí thuê thêm trainer"]}'::jsonb)
  ON CONFLICT DO NOTHING;

  -- ===== Lessons cho Khóa 3: Ứng Dụng AI Để Đánh Giá Và Theo Dõi Tiến Độ =====
  
  INSERT INTO public.lessons (course_id, title, content, order_index, lesson_type, is_published)
  VALUES (v_course3_id, 'Dữ Liệu Học Tập Trong Nền Tảng EdTech',
    E'# Dữ Liệu Học Tập Trong Nền Tảng EdTech\n\n## Learning Analytics là gì?\nLearning Analytics là việc thu thập, đo lường, phân tích và báo cáo dữ liệu về người học và bối cảnh học tập, nhằm hiểu và tối ưu hóa quá trình học tập.\n\n## Các loại dữ liệu quan trọng\n\n### 1. Dữ liệu hành vi (Behavioral Data)\n- Thời gian truy cập\n- Số lần đăng nhập\n- Thứ tự xem bài\n- Click patterns\n- Search queries\n\n### 2. Dữ liệu kết quả (Performance Data)\n- Điểm quiz/test\n- Completion rate\n- Submission attempts\n- Error patterns\n- Grade distribution\n\n### 3. Dữ liệu tương tác (Interaction Data)\n- Forum posts\n- Chat messages\n- Peer reviews\n- Group activities\n- Help requests\n\n## Cách thu thập\n1. **Event tracking**: Ghi lại mọi action\n2. **Session recording**: Thời gian học\n3. **Assessment logs**: Kết quả bài kiểm tra\n4. **API integrations**: Kết nối hệ thống\n\n## Bảo mật dữ liệu\n- GDPR compliance\n- Anonymization\n- Consent management\n- Data retention policies',
    1, 'content', true)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.lessons (course_id, title, content, order_index, lesson_type, is_published)
  VALUES (v_course3_id, 'Theo Dõi Tiến Độ Và Thời Gian Học',
    E'# Theo Dõi Tiến Độ Và Thời Gian Học\n\n## Tại sao theo dõi tiến độ quan trọng?\n- Phát hiện sớm học viên gặp khó khăn\n- Tối ưu nội dung khóa học\n- Đo lường hiệu quả đào tạo\n- Báo cáo cho stakeholders\n\n## Metrics cần theo dõi\n\n### Course-level metrics\n- Enrollment rate\n- Completion rate\n- Average time to complete\n- Drop-off points\n- NPS score\n\n### Learner-level metrics\n- Progress percentage\n- Time spent per lesson\n- Assessment scores\n- Login frequency\n- Engagement score\n\n### AI-specific metrics\n- AI interaction quality\n- Simulation scores\n- Knowledge check accuracy\n- Improvement over time\n\n## Dashboard cho Manager\nMột dashboard tốt cần:\n1. **Overview cards**: Tổng quan nhanh\n2. **Learner table**: Chi tiết từng người\n3. **Filters**: Lọc theo khóa, trạng thái\n4. **Alerts**: Cảnh báo học viên nguy cơ\n5. **Export**: Xuất báo cáo\n\n## Cảnh báo At-risk\nHọc viên có nguy cơ bỏ học khi:\n- Không đăng nhập > 7 ngày\n- Progress < 20% sau 2 tuần\n- Điểm AI < 50%\n- Không hoàn thành deadline',
    2, 'content', true)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.lessons (course_id, title, content, order_index, lesson_type, is_published, simulator_config)
  VALUES (v_course3_id, 'AI Kiểm Tra Kiến Thức Về Learning Analytics',
    'Bài kiểm tra kiến thức về Learning Analytics và theo dõi tiến độ học viên.',
    3, 'ai_simulator', true,
    '{"mode":"knowledge_check","productName":"Learning Analytics","productDescription":"Kiến thức về learning analytics, các loại dữ liệu học tập, metrics theo dõi tiến độ, dashboard design và phát hiện học viên at-risk.","scenarioDescription":"Kiểm tra hiểu biết về learning analytics và ứng dụng AI trong đánh giá tiến độ học viên.","openingCustomerMessage":"Chào bạn! Bài kiểm tra này sẽ đánh giá kiến thức của bạn về Learning Analytics. Bạn sẵn sàng chưa?","keyFeatures":["Learning Analytics concepts","Performance metrics","Behavioral data analysis","At-risk detection","Dashboard design"],"salesTips":["Giải thích rõ từng metric","Phân biệt các loại dữ liệu","Đưa ví dụ dashboard thực tế"]}'::jsonb)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.lessons (course_id, title, content, order_index, lesson_type, is_published, simulator_config)
  VALUES (v_course3_id, 'AI Mô Phỏng Phân Tích Học Viên Có Nguy Cơ Bỏ Học',
    'Mô phỏng: Bạn là Learning Analytics Specialist cần tư vấn cho tổ chức giáo dục về hệ thống phát hiện và can thiệp học viên at-risk.',
    4, 'ai_simulator', true,
    '{"mode":"sales","productName":"AI Learning Analytics Platform","productDescription":"Nền tảng phân tích dữ liệu học tập sử dụng AI để theo dõi tiến độ, phát hiện học viên có nguy cơ bỏ học, đề xuất can thiệp và tạo báo cáo tự động cho quản lý đào tạo.","scenarioDescription":"Bạn là chuyên viên Learning Analytics. Phó hiệu trưởng phụ trách đào tạo online của một trường cao đẳng lo ngại tỷ lệ bỏ học online lên tới 40%. Nhiệm vụ: tư vấn giải pháp AI analytics để giảm tỷ lệ bỏ học.","customerRole":"Phó hiệu trưởng phụ trách đào tạo online","goal":"Thuyết phục khách hàng triển khai hệ thống early warning","openingCustomerMessage":"Xin chào, trường chúng tôi đang có vấn đề nghiêm trọng: tỷ lệ bỏ học các khóa online lên tới 40%. Ban giám hiệu yêu cầu tôi tìm giải pháp. Bạn có kinh nghiệm về learning analytics không?","keyFeatures":["Early warning system tự động","Predictive analytics với ML","Dashboard real-time cho giảng viên","Automated intervention emails","ROI reporting cho ban giám hiệu"],"commonObjections":["Trường thiếu nhân sự IT","Giảng viên không muốn bị theo dõi","Ngân sách hạn chế","Dữ liệu học viên phân tán nhiều hệ thống"],"salesTips":["Dùng số liệu: giảm drop-out 40% → 20%","ROI: mỗi sinh viên giữ lại = X triệu doanh thu","Demo dashboard trực quan","Cam kết integration với LMS hiện tại"]}'::jsonb)
  ON CONFLICT DO NOTHING;

  -- ============================================
  -- PHẦN E: SEED — Tạo Invitations cho 7 học viên
  -- ============================================

  -- Mời 7 học viên vào cả 3 khóa = 21 invitations
  DECLARE
    v_emails text[] := ARRAY[
      'phamminhhoang@gmail.com',
      'nguyenminhchau@gmail.com',
      'caotramy@gmail.com',
      'nguyenminhhung@gmail.com',
      'phamngoctan@gmail.com',
      'tranminhphuong@gmail.com',
      'lehoangminh@gmail.com'
    ];
    v_email text;
    v_course_ids uuid[] := ARRAY[v_course1_id, v_course2_id, v_course3_id];
    v_cid uuid;
    v_invited_uid uuid;
  BEGIN
    FOREACH v_email IN ARRAY v_emails LOOP
      -- Tìm user_id nếu đã signup
      SELECT id INTO v_invited_uid FROM public.profiles WHERE email = v_email;

      FOREACH v_cid IN ARRAY v_course_ids LOOP
        INSERT INTO public.course_invitations (course_id, email, invited_user_id, invited_by, expires_at, status)
        VALUES (v_cid, v_email, v_invited_uid, v_hung_id, now() + interval '30 days', 'pending')
        ON CONFLICT (course_id, email) DO NOTHING;
      END LOOP;
    END LOOP;
  END;

  RAISE NOTICE 'Seed hoàn tất! 3 khóa học + 12 lessons + 21 invitations đã được tạo.';
END $$;
