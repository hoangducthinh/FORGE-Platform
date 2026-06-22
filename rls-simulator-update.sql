-- Thêm các cột cho simulator_sessions để theo dõi thời gian
ALTER TABLE simulator_sessions ADD COLUMN IF NOT EXISTS started_at timestamp with time zone DEFAULT now();
ALTER TABLE simulator_sessions ADD COLUMN IF NOT EXISTS ended_at timestamp with time zone;
ALTER TABLE simulator_sessions ADD COLUMN IF NOT EXISTS elapsed_seconds integer DEFAULT 0;
ALTER TABLE simulator_sessions ADD COLUMN IF NOT EXISTS max_duration_seconds integer DEFAULT 900; -- Mặc định 15 phút

-- Thêm các cột cho simulator_messages để hỗ trợ logic chấm điểm mới
ALTER TABLE simulator_messages ADD COLUMN IF NOT EXISTS topic_key text;
ALTER TABLE simulator_messages ADD COLUMN IF NOT EXISTS turn_score numeric;
