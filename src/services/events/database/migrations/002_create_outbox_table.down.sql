-- Drop the sweep function
DROP FUNCTION IF EXISTS sweep_and_notify_outbox();

-- Drop the outbox table
DROP TABLE IF EXISTS outbox;