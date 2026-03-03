import { SQLDatabase } from 'encore.dev/storage/sqldb'

export const eventsDatabase = new SQLDatabase('events', {
  migrations: './migrations',
})
