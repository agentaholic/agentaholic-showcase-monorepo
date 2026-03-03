/* eslint-disable no-relative-import-paths/no-relative-import-paths */
import { convertId } from './convertId'

/**
 * Converts a flickrBase58 ID to bytes16 format for Solidity contracts
 * @param id The flickrBase58 ID to convert
 * @returns The bytes16 representation (0x-prefixed hex string)
 */
export const convertIdToBytes16 = (params: { id: string }): `0x${string}` => {
  const { id } = params

  // Convert flickrBase58 to UUID
  const uuid = convertId({
    from: 'flickrBase58',
    to: 'uuid',
    value: id,
  })

  // Remove hyphens from UUID to get raw hex
  const hexWithoutHyphens = uuid.replace(/-/g, '')

  // Return as 0x-prefixed hex string (bytes16)
  return `0x${hexWithoutHyphens}`
}
