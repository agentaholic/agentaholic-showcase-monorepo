CREATE TABLE outbox (
    -- Auto-incrementing ID for ordering and notification
    id BIGSERIAL PRIMARY KEY,

    -- Topic name for routing messages
    topic_name VARCHAR(255) NOT NULL,

    -- Message data stored as JSON
    message_data JSONB NOT NULL,

    -- Transaction ID linking to events transaction
    transaction_id VARCHAR(255) NOT NULL,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE NULL
);

-- Index for efficient querying of unprocessed messages
CREATE INDEX idx_outbox_unprocessed ON outbox (processed_at) WHERE processed_at IS NULL;

-- Index for transaction-based queries
CREATE INDEX idx_outbox_transaction ON outbox (transaction_id);

-- Index for topic-based queries
CREATE INDEX idx_outbox_topic ON outbox (topic_name);

-- PostgreSQL function for atomic sweep-and-notify of unprocessed outbox messages
CREATE OR REPLACE FUNCTION sweep_and_notify_outbox()
RETURNS void AS $$
DECLARE
    msg RECORD;
BEGIN
    FOR msg IN
        SELECT id, topic_name FROM outbox
        WHERE processed_at IS NULL
        ORDER BY created_at
    LOOP
        PERFORM pg_notify('outbox_message', msg.id::text);
    END LOOP;
END;
$$ LANGUAGE plpgsql;