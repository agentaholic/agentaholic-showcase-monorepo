import { ErrorReportAggregate } from '~src/services/errorReports/aggregates/ErrorReport/types/ErrorReportAggregate'
import { loadAggregate } from '~src/services/events/utils/loadAggregate'
import { ErrorReportEvent } from '~src/services/errorReports/aggregates/ErrorReport/ErrorReportEvent'
import { errorReportAggregateReducer } from '~src/services/errorReports/aggregates/ErrorReport/errorReportAggregateReducer'

export async function loadErrorReportAggregate(params: {
  id: string
  namespace: { slug: string }
}): Promise<ErrorReportAggregate | null> {
  return loadAggregate<ErrorReportEvent, ErrorReportAggregate>({
    ...params,
    service: { name: 'errorReports' },
    name: 'ErrorReport',
    reducer: errorReportAggregateReducer,
  })
}
