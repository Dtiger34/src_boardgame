CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  username VARCHAR(30) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
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
