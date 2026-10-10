BEGIN;
CREATE TABLE IF NOT EXISTS assets (
 id text PRIMARY KEY, object_key text NOT NULL, kind text NOT NULL,
 filename text NOT NULL, content_type text NOT NULL, size bigint NOT NULL, created_at bigint NOT NULL
);
CREATE TABLE IF NOT EXISTS tracks (
 id text PRIMARY KEY, title text NOT NULL, asset_id text NOT NULL REFERENCES assets(id),
 duration double precision NOT NULL, lyrics text NOT NULL DEFAULT '', credits text NOT NULL DEFAULT '',
 created_at bigint NOT NULL, deleted_at bigint
);
CREATE TABLE IF NOT EXISTS releases (
 id text PRIMARY KEY, title text NOT NULL, type text NOT NULL, release_date text NOT NULL,
 cover_id text REFERENCES assets(id), description text NOT NULL DEFAULT '', status text NOT NULL DEFAULT 'draft',
 created_at bigint NOT NULL, publish_at bigint, deleted_at bigint
);
CREATE TABLE IF NOT EXISTS release_tracks (
 release_id text NOT NULL REFERENCES releases(id) ON DELETE CASCADE, track_id text NOT NULL REFERENCES tracks(id),
 position integer NOT NULL, PRIMARY KEY(release_id,track_id), UNIQUE(release_id,position)
);
CREATE TABLE IF NOT EXISTS streams (
 id text PRIMARY KEY, dedup_key text NOT NULL UNIQUE, track_id text NOT NULL REFERENCES tracks(id),
 release_id text NOT NULL REFERENCES releases(id), listener_key text NOT NULL, created_at bigint NOT NULL
);
CREATE TABLE IF NOT EXISTS listen_sessions (
 id text PRIMARY KEY, track_id text NOT NULL REFERENCES tracks(id), release_id text NOT NULL REFERENCES releases(id),
 listener_key text NOT NULL, started_at bigint NOT NULL, last_at bigint NOT NULL,
 seconds double precision NOT NULL DEFAULT 0, reported double precision NOT NULL DEFAULT 0, counted integer NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_releases_status_date ON releases(status,release_date);
CREATE INDEX IF NOT EXISTS idx_releases_status_publish_at ON releases(status,publish_at);
CREATE INDEX IF NOT EXISTS idx_release_tracks_track ON release_tracks(track_id);
CREATE INDEX IF NOT EXISTS idx_streams_created ON streams(created_at);
CREATE INDEX IF NOT EXISTS idx_streams_track_created ON streams(track_id,created_at);
CREATE INDEX IF NOT EXISTS idx_streams_release_created ON streams(release_id,created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_listener_started ON listen_sessions(listener_key,started_at);
-- All database access goes through the server. Never expose studio data through
-- Supabase's browser Data API, including for a signed-in creator.
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE release_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE listen_sessions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON assets,tracks,releases,release_tracks,streams,listen_sessions FROM anon,authenticated;
COMMIT;
