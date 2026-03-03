import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Surreal } from 'surrealdb'
import { createSurrealProjectionWriter } from '~src/databases/surreal/projectionWriter/createSurrealProjectionWriter'
import type { ProjectionConfig } from '~src/types/architecture/ProjectionConfig'

type TestAggregate = {
  id: string
  name: string
  value: number
}

describe('createSurrealProjectionWriter', () => {
  const mockDatabase = {
    select: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    query: vi.fn(),
  } as unknown as Surreal

  const projectionConfig: ProjectionConfig = {
    service: { name: 'payments' },
    aggregate: { name: 'Payment' },
  }

  const namespace = { slug: 'main' }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('initialize', () => {
    it('should complete without error (no-op)', async () => {
      const writer = createSurrealProjectionWriter<TestAggregate>({
        database: mockDatabase,
      })

      await expect(
        writer.initialize({ projectionConfig }),
      ).resolves.toBeUndefined()
    })
  })

  describe('aggregates.get', () => {
    it('should retrieve a record by composite ID and restore original aggregate ID', async () => {
      // SurrealDB returns records with its internal ID format
      const surrealRecord = {
        id: 'payments_Payment:main:agg_123', // SurrealDB record ID format
        name: 'Test Payment',
        value: 100,
      }
      vi.mocked(mockDatabase.select).mockResolvedValue(surrealRecord)

      const writer = createSurrealProjectionWriter<TestAggregate>({
        database: mockDatabase,
      })

      const result = await writer.aggregates.get({
        projectionConfig,
        namespace,
        aggregate: { id: 'agg_123' },
      })

      // The result should have the original aggregate ID restored
      expect(result).toEqual({
        id: 'agg_123', // Original ID restored
        name: 'Test Payment',
        value: 100,
      })
      expect(mockDatabase.select).toHaveBeenCalledTimes(1)
      expect(mockDatabase.select).toHaveBeenCalledWith(
        expect.objectContaining({
          tb: 'payments_Payment',
          id: 'main:agg_123',
        }),
      )
    })

    it('should return null for non-existent records', async () => {
      vi.mocked(mockDatabase.select).mockResolvedValue(undefined)

      const writer = createSurrealProjectionWriter<TestAggregate>({
        database: mockDatabase,
      })

      const result = await writer.aggregates.get({
        projectionConfig,
        namespace,
        aggregate: { id: 'non_existent' },
      })

      expect(result).toBeNull()
    })

    it('should use correct table name format (service_aggregate)', async () => {
      vi.mocked(mockDatabase.select).mockResolvedValue(undefined)

      const writer = createSurrealProjectionWriter<TestAggregate>({
        database: mockDatabase,
      })

      const customConfig: ProjectionConfig = {
        service: { name: 'internalOrders' },
        aggregate: { name: 'Order' },
      }

      await writer.aggregates.get({
        projectionConfig: customConfig,
        namespace: { slug: 'tenant_1' },
        aggregate: { id: 'ord_456' },
      })

      expect(mockDatabase.select).toHaveBeenCalledWith(
        expect.objectContaining({
          tb: 'internalOrders_Order',
          id: 'tenant_1:ord_456',
        }),
      )
    })
  })

  describe('aggregates.save', () => {
    it('should upsert a record with correct composite ID using SurrealQL query', async () => {
      vi.mocked(mockDatabase.query).mockResolvedValue([])

      const writer = createSurrealProjectionWriter<TestAggregate>({
        database: mockDatabase,
      })

      const aggregate: TestAggregate = {
        id: 'agg_123',
        name: 'Updated Payment',
        value: 200,
      }

      await writer.aggregates.save({
        projectionConfig,
        namespace,
        aggregate,
      })

      expect(mockDatabase.query).toHaveBeenCalledTimes(1)
      expect(mockDatabase.query).toHaveBeenCalledWith(
        `UPSERT type::thing($table, $id) CONTENT $data`,
        {
          table: 'payments_Payment',
          id: 'main:agg_123',
          data: { name: 'Updated Payment', value: 200 }, // id field is excluded
        },
      )
    })
  })

  describe('aggregates.delete', () => {
    it('should delete a record by composite ID', async () => {
      vi.mocked(mockDatabase.delete).mockResolvedValue({})

      const writer = createSurrealProjectionWriter<TestAggregate>({
        database: mockDatabase,
      })

      await writer.aggregates.delete({
        projectionConfig,
        namespace,
        aggregate: { id: 'agg_123' },
      })

      expect(mockDatabase.delete).toHaveBeenCalledTimes(1)
      expect(mockDatabase.delete).toHaveBeenCalledWith(
        expect.objectContaining({
          tb: 'payments_Payment',
          id: 'main:agg_123',
        }),
      )
    })
  })

  describe('aggregates.deleteAll', () => {
    it('should delete all records for a namespace using query', async () => {
      vi.mocked(mockDatabase.query).mockResolvedValue([])

      const writer = createSurrealProjectionWriter<TestAggregate>({
        database: mockDatabase,
      })

      await writer.aggregates.deleteAll({
        projectionConfig,
        namespace,
      })

      expect(mockDatabase.query).toHaveBeenCalledTimes(1)
      expect(mockDatabase.query).toHaveBeenCalledWith(
        `DELETE FROM type::table($table) WHERE string::starts_with(<string>record::id(id), $prefix)`,
        { table: 'payments_Payment', prefix: 'main:' },
      )
    })

    it('should use correct prefix for different namespaces', async () => {
      vi.mocked(mockDatabase.query).mockResolvedValue([])

      const writer = createSurrealProjectionWriter<TestAggregate>({
        database: mockDatabase,
      })

      await writer.aggregates.deleteAll({
        projectionConfig,
        namespace: { slug: 'tenant_abc' },
      })

      expect(mockDatabase.query).toHaveBeenCalledWith(expect.any(String), {
        table: 'payments_Payment',
        prefix: 'tenant_abc:',
      })
    })
  })
})
