// Events in the enclosing query use the alias e. Clearing a draft's dates
// must not erase the start time used by existing registrations.
// Older audit rows may contain a JSON-encoded string rather than an object.
export const REGISTRATION_START_SQL = `COALESCE(e.start_at, (
  SELECT snapshot.start_at::timestamptz
  FROM event_change_logs AS history
  CROSS JOIN LATERAL (
    SELECT ((history.before_data #>> '{}')::jsonb)->>'start_at' AS start_at
  ) AS snapshot
  WHERE history.event_id=e.id AND history.change_type='updated'
    AND snapshot.start_at IS NOT NULL
  ORDER BY (((history.before_data #>> '{}')::jsonb)->>'version')::int DESC NULLS LAST,
    history.created_at DESC, history.id DESC
  LIMIT 1
))`;
