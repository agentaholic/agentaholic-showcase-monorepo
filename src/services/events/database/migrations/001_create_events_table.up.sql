CREATE TABLE events (
    -- Auto-incrementing revision for ordering
    revision BIGSERIAL PRIMARY KEY,
    
    -- Event identification
    id VARCHAR(255) NOT NULL,
    
    -- Service and aggregate information for querying
    service_name VARCHAR(255) NOT NULL,
    aggregate_name VARCHAR(255) NOT NULL,
    aggregate_id VARCHAR(255) NOT NULL,
    
    -- Namespace for isolation
    namespace_slug VARCHAR(255) NOT NULL,
    
    -- Transaction grouping for atomic event commitment
    transaction_id VARCHAR(255) NOT NULL,
    
    -- Raw event data stored as JSON
    data JSONB NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for efficient querying by namespace and service
CREATE INDEX idx_events_namespace_service ON events (namespace_slug, service_name);

-- Index for aggregate-specific queries
CREATE INDEX idx_events_aggregate ON events (namespace_slug, service_name, aggregate_name, aggregate_id);

-- Index for aggregate type queries (without specific ID)
CREATE INDEX idx_events_aggregate_type ON events (namespace_slug, service_name, aggregate_name);

-- Index for revision ordering (already primary key, but explicit for clarity)
CREATE INDEX idx_events_revision ON events (revision);

-- Index for transaction-based queries
CREATE INDEX idx_events_transaction ON events (transaction_id);

-- Composite index for complete filtering with order
CREATE INDEX idx_events_complete_filter ON events (namespace_slug, service_name, aggregate_name, aggregate_id, revision); 