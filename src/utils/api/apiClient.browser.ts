/* v8 ignore start */
import ApiClient, { Local } from '~src/utils/api/generated/ApiClient'

// TODO: support configuring an environment name via an environment variable
export const apiClient = new ApiClient(Local)
