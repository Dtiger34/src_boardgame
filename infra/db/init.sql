CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  username VARCHAR(30) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(50),
  avatar_url TEXT,
  rating INTEGER NOT NULL DEFAULT 1200,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY,
  game_type VARCHAR(50) NOT NULL,
  room_id UUID,
  status VARCHAR(20) NOT NULL DEFAULT 'in_progress',
  winner_id UUID REFERENCES users(id),
  is_draw BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS game_players (
  game_id UUID NOT NULL REFERENCES games(id),
  user_id UUID NOT NULL REFERENCES users(id),
  color VARCHAR(20),
  PRIMARY KEY (game_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_game_players_user ON game_players(user_id);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);

CREATE TABLE IF NOT EXISTS game_catalog (
  game_type VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  rules TEXT NOT NULL,
  min_players INTEGER NOT NULL DEFAULT 2,
  max_players INTEGER NOT NULL DEFAULT 2,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO game_catalog (game_type, name, description, rules, min_players, max_players) VALUES (
  'gomoku',
  'Gomoku (Cờ Carô)',
  'Trò chơi chiến thuật cho 2 người trên bàn cờ 15×15. Người chơi lần lượt đặt quân của mình, ai tạo được 5 quân liên tiếp trước sẽ thắng.',
  E'## Thiết lập\n- Bàn cờ 15×15, tất cả ô ban đầu đều trống.\n- Người chơi 1 cầm quân Đen, người chơi 2 cầm quân Trắng.\n- Quân Đen đi trước.\n\n## Lượt chơi\n- Hai người chơi lần lượt đặt 1 quân vào ô trống bất kỳ.\n- Quân đã đặt không được di chuyển.\n\n## Thắng\nNgười đầu tiên tạo được **5 quân liên tiếp** theo hàng ngang, dọc hoặc chéo sẽ thắng.\n\n## Hòa\nBàn cờ đầy mà không ai tạo được 5 quân liên tiếp → hòa.',
  2,
  2
) ON CONFLICT DO NOTHING;

INSERT INTO game_catalog (game_type, name, description, rules, min_players, max_players) VALUES (
  'werewolf',
  'Ma Sói (Werewolf)',
  'Trò chơi suy luận xã hội cho 6–18 người. Dân làng cố tìm và loại bỏ Ma Sói, trong khi Ma Sói âm mưu tiêu diệt dân làng.',
  E'## Vai trò\n- **Dân làng**: Không có kỹ năng đặc biệt, cần suy luận để tìm Ma Sói.\n- **Ma Sói**: Ban đêm chọn 1 người để giết.\n- **Tiên tri**: Ban đêm xem danh tính 1 người.\n- **Bác sĩ**: Ban đêm bảo vệ 1 người khỏi bị giết.\n- **Cảnh sát**: Ban đêm điều tra 1 người.\n- **Sói đầu đàn**: Tiên tri không thể phát hiện là Ma Sói.\n\n## Vòng chơi\n**Đêm**: Ma Sói giết, Bác sĩ bảo vệ, Tiên tri/Cảnh sát điều tra.\n**Thảo luận (2 phút)**: Tất cả thảo luận ai là Ma Sói.\n**Bỏ phiếu (1 phút)**: Bỏ phiếu xử tử 1 người.\n\n## Thắng\n- **Dân làng**: Tiêu diệt toàn bộ Ma Sói.\n- **Ma Sói**: Số Ma Sói ≥ số Dân còn sống.',
  6,
  18
) ON CONFLICT DO NOTHING;
