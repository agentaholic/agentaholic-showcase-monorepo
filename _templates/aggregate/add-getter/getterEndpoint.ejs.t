---
to: src/services/<%= serviceName %>/api/get<%= aggregateName %>.ts
---
import { api, APIError, ErrCode, Header } from 'encore.dev/api'
import type { <%= aggregateName %>Aggregate } from '~src/services/<%= serviceName %>/aggregates/<%= aggregateName %>/types/<%= aggregateName %>Aggregate'
import { load<%= aggregateName %>Aggregate } from '~src/services/<%= serviceName %>/aggregates/<%= aggregateName %>/load<%= aggregateName %>Aggregate'

interface Get<%= aggregateName %>Request {
  id: string
  namespaceSlug?: Header<'X-Namespace-Slug'>
}

interface Get<%= aggregateName %>Response {
  aggregate: <%= aggregateName %>Aggregate
}

export const get<%= aggregateName %> = api(
  { expose: true, method: 'GET', path: '/<%= serviceName.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '') %>-<%= aggregateName.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '') %>s/:id' },
  async (params: Get<%= aggregateName %>Request): Promise<Get<%= aggregateName %>Response> => {
    const { id, namespaceSlug = 'main' } = params

    const namespace = { slug: namespaceSlug }

    const aggregate = await load<%= aggregateName %>Aggregate({ id, namespace })

    /* v8 ignore start */
    if (aggregate == null) {
      throw new APIError(ErrCode.NotFound, `<%= aggregateName %> with ID ${id} not found`)
    }
    /* v8 ignore stop */

    return { aggregate }
  },
)
