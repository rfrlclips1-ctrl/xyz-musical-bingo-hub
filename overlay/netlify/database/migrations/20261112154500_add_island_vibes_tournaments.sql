-- Isolated Island Vibes tournaments, does not modify bingo/trivia tables.

CREATE TABLE IF NOT EXISTS iv_tourney_events (
 id TEXT PRIMARY KEY,
 name TEXT NOT NULL,
 game TEXT NOT NULL,
 date TEXT NOT NULL,
 time TEXT NOT NULL,
 venue TEXT NOT NULL DEFAULT 'Island Vibes Kava Bar',
 prize TEXT NOT NULL DEFAULT 'Bar tabs',
 format TEXT NOT NULL DEFAULT 'single-elimination',
 seeding TEXT NOT NULL DEFAULT 'registration',
 swiss_rounds INTEGER NOT NULL DEFAULT 4,
 started INTEGER NOT NULL DEFAULT 0,
 paused INTEGER NOT NULL DEFAULT 0,
 locked INTEGER NOT NULL DEFAULT 0,
 seeds_json TEXT NOT NULL DEFAULT '[]',
 archives_json TEXT NOT NULL DEFAULT '[]',
 created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_iv_tourney_events_date ON iv_tourney_events(date DESC);
CREATE TABLE IF NOT EXISTS iv_tourney_players (
 id TEXT PRIMARY KEY,
 event_id TEXT NOT NULL REFERENCES iv_tourney_events(id) ON DELETE CASCADE,
 name TEXT NOT NULL,
 name_key TEXT NOT NULL,
 source TEXT NOT NULL DEFAULT 'online',
 verified INTEGER NOT NULL DEFAULT 0,
 removed INTEGER NOT NULL DEFAULT 0,
 sort_order INTEGER NOT NULL,
 joined_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_iv_tourney_players_unique_active ON iv_tourney_players(event_id,name_key) WHERE removed=0;
CREATE INDEX IF NOT EXISTS idx_iv_tourney_players_event_order ON iv_tourney_players(event_id,removed,sort_order);
CREATE TABLE IF NOT EXISTS iv_tourney_scores (
 event_id TEXT NOT NULL REFERENCES iv_tourney_events(id) ON DELETE CASCADE,
 match_id TEXT NOT NULL,
 a_id TEXT NOT NULL,
 b_id TEXT NOT NULL,
 a INTEGER NOT NULL,
 b INTEGER NOT NULL,
 updated_at TEXT NOT NULL,
 PRIMARY KEY(event_id,match_id)
);
CREATE INDEX IF NOT EXISTS idx_iv_tourney_scores_event ON iv_tourney_scores(event_id);
CREATE TABLE IF NOT EXISTS iv_tourney_private_rewards (
 event_id TEXT NOT NULL REFERENCES iv_tourney_events(id) ON DELETE CASCADE,
 player_id TEXT NOT NULL REFERENCES iv_tourney_players(id) ON DELETE CASCADE,
 rewards_name TEXT NOT NULL DEFAULT '',
 last4 TEXT NOT NULL DEFAULT '',
 updated_at TEXT NOT NULL,
 PRIMARY KEY(event_id,player_id)
);
CREATE TABLE IF NOT EXISTS iv_tourney_request_limits (
 id TEXT PRIMARY KEY,
 counter INTEGER NOT NULL DEFAULT 0,
 expires_at INTEGER NOT NULL
);
