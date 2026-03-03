import { ErrorReportEvent } from '~src/services/errorReports/aggregates/ErrorReport/ErrorReportEvent'
import { onErrorReportCreated } from '~src/services/errorReports/aggregates/ErrorReport/events/Created/onErrorReportCreated'
import { ErrorReportAggregate } from '~src/services/errorReports/aggregates/ErrorReport/types/ErrorReportAggregate'
// DO NOT DELETE THIS LINE: this comment indicates where hygen will insert new imports

export const errorReportAggregateReducer = (
  aggregate: ErrorReportAggregate | null,
  event: ErrorReportEvent,
): ErrorReportAggregate | null => {
  switch (event.name) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    case 'ErrorReportCreated':
      return onErrorReportCreated(aggregate, event)

    // DO NOT DELETE THIS LINE: this comment indicates where hygen will insert new event handlers
  }
}
