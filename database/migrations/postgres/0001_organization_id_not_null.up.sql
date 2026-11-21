-- sdkwork:migration
-- id: 0001_organization_id_not_null
-- engine: postgres
-- module: sdkwork-dezhou
-- purpose: Enforce organization_id NOT NULL DEFAULT on all tables in the
--   consolidated baseline. NULL rows (pre-standard data anomalies) are
--   backfilled with the platform sentinel before NOT NULL is set, and
--   NOT NULL columns without an explicit default receive the sentinel
--   default, keeping existing deployments consistent with fresh baseline
--   installs.
-- reversible: false
-- rollback: forward-fix (sentinel backfill is the canonical fix; NULL
--   organization rows are data anomalies)
-- transactional: true
-- lock: lightweight
-- lock_timeout: 2s
-- statement_timeout: 30s

BEGIN;

ALTER TABLE dezhou_table ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT '0';
UPDATE dezhou_table SET organization_id = '0' WHERE organization_id IS NULL;
ALTER TABLE dezhou_table ALTER COLUMN organization_id SET DEFAULT '0';
ALTER TABLE dezhou_table ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE dezhou_seat ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT '0';
UPDATE dezhou_seat SET organization_id = '0' WHERE organization_id IS NULL;
ALTER TABLE dezhou_seat ALTER COLUMN organization_id SET DEFAULT '0';
ALTER TABLE dezhou_seat ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE dezhou_hand ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT '0';
UPDATE dezhou_hand SET organization_id = '0' WHERE organization_id IS NULL;
ALTER TABLE dezhou_hand ALTER COLUMN organization_id SET DEFAULT '0';
ALTER TABLE dezhou_hand ALTER COLUMN organization_id SET NOT NULL;

COMMIT;
