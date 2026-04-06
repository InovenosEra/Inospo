ALTER TABLE matches ADD COLUMN IF NOT EXISTS api_fixture_id INTEGER;
CREATE INDEX IF NOT EXISTS matches_api_fixture_id_idx ON matches(api_fixture_id);
