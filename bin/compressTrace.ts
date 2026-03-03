#!/usr/bin/env -S npx tsx

import { readFileSync } from 'fs'

// claude-hooks-ignore-logging-violation
const printError = (msg: string) => process.stderr.write(`${msg}\n`)
// claude-hooks-ignore-logging-violation
const die = (msg: string): never => {
  printError(msg)
  process.exit(1)
}
// claude-hooks-ignore-logging-violation
const printUsage = () => {
  printError('Usage: compressTrace <file.json>')
  printError('       cat file.json | compressTrace')
}

// --- BigInt-safe JSON parsing ---
// trace_id.high, trace_id.low, span_id, parent_span_id are uint64 values that
// exceed Number.MAX_SAFE_INTEGER. We convert them to strings before JSON.parse
// to preserve precision, then use BigInt for encoding.

function preserveUint64Fields(json: string): string {
  return json.replace(
    /"(high|low|span_id|parent_span_id)"\s*:\s*(\d+)/g,
    '"$1": "$2"',
  )
}

// --- Raw input types ---

interface TraceId {
  high: string
  low: string
}

interface RawEvent {
  trace_id: TraceId
  span_id: string
  event_id: number
  event_time: { seconds: number; nanos: number }
  Event: {
    SpanStart?: {
      parent_trace_id?: TraceId
      parent_span_id?: string
      caller_event_id?: number
      Data: {
        Request?: {
          service_name: string
          endpoint_name: string
          http_method: string
          path: string
          path_params?: string[]
          request_headers?: Record<string, string>
          request_payload?: string
        }
        PubsubMessage?: {
          service_name: string
          topic_name: string
          subscription_name: string
          message_id: string
          attempt?: number
          publish_time?: { seconds: number; nanos: number }
          message_payload?: string
        }
      }
    }
    SpanEnd?: {
      duration_nanos: number
      error?: { msg: string }
      panic_stack?: {
        frames: Array<{ filename: string; func: string; line: number }>
      }
      status_code?: number
      parent_trace_id?: TraceId
      parent_span_id?: string
      Data: {
        Request?: {
          service_name: string
          endpoint_name: string
          http_status_code: number
          response_headers?: Record<string, string>
          response_payload?: string
          caller_event_id?: number
        }
        PubsubMessage?: {
          service_name: string
          topic_name: string
          subscription_name: string
          message_id: string
        }
      }
    }
    SpanEvent?: {
      correlation_event_id?: number
      Data: {
        LogMessage?: {
          level: number
          msg: string
          fields?: Array<{ key: string; Value: Record<string, unknown> }>
        }
        DbQueryStart?: { query: string }
        DbQueryEnd?: Record<string, never>
        RpcCallStart?: {
          target_service_name: string
          target_endpoint_name: string
        }
        RpcCallEnd?: { err?: { msg: string } }
      }
    }
  }
}

// --- Output types ---

interface PanicFrame {
  filename: string
  func: string
  line: number
}

interface CompressedSpan {
  spanId: string
  call: string
  method?: string
  path?: string
  statusCode?: number
  durationMs?: number
  error?: string
  panicStack?: PanicFrame[]
  request?: unknown
  response?: unknown
  logs: Array<{ level: string; msg: string; fields?: Record<string, unknown> }>
  children: CompressedSpan[]
}

interface CompressedTrace {
  traceId: string
  spans: CompressedSpan
}

// --- Base32 encoding (RFC 4648 style, MSB-first, matching Go's encoding/base32) ---

const BASE32_ALPHABET = '0123456789abcdefghijklmnopqrstuv'

function bigintToLittleEndianBytes(value: bigint): Uint8Array {
  const bytes = new Uint8Array(8)
  for (let i = 0; i < 8; i++) {
    bytes[i] = Number((value >> BigInt(i * 8)) & 0xffn)
  }
  return bytes
}

function base32Encode(bytes: Uint8Array): string {
  let result = ''
  let buffer = 0
  let bits = 0

  for (const byte of bytes) {
    buffer = (buffer << 8) | byte
    bits += 8
    while (bits >= 5) {
      bits -= 5
      result += BASE32_ALPHABET[(buffer >> bits) & 0x1f]
    }
  }

  if (bits > 0) {
    result += BASE32_ALPHABET[(buffer << (5 - bits)) & 0x1f]
  }

  return result
}

function encodeTraceId(traceId: TraceId): string {
  const lowBytes = bigintToLittleEndianBytes(BigInt(traceId.low))
  const highBytes = bigintToLittleEndianBytes(BigInt(traceId.high))
  const combined = new Uint8Array(16)
  combined.set(lowBytes, 0)
  combined.set(highBytes, 8)
  return base32Encode(combined).slice(0, 26)
}

function encodeSpanId(spanId: string): string {
  const bytes = bigintToLittleEndianBytes(BigInt(spanId))
  return base32Encode(bytes).slice(0, 13)
}

// --- Payload decoding ---

function decodePayload(base64: string | undefined): unknown {
  if (!base64) return undefined
  try {
    const json = Buffer.from(base64, 'base64').toString('utf-8')
    return JSON.parse(json)
  } catch {
    return base64
  }
}

// --- Log level mapping ---

const LOG_LEVELS: Record<number, string> = {
  0: 'debug',
  1: 'info',
  2: 'error',
  3: 'warn',
}

const AUTO_GENERATED_MESSAGES = new Set([
  'starting request',
  'request completed',
  'request failed',
])

function extractFieldValue(value: Record<string, unknown>): unknown {
  const keys = Object.keys(value)
  if (keys.length === 1) return value[keys[0]]
  return value
}

// --- Core algorithm ---

interface SpanData {
  spanId: string
  parentSpanId?: string
  call: string
  method?: string
  path?: string
  statusCode?: number
  durationMs?: number
  error?: string
  panicStack?: PanicFrame[]
  request?: unknown
  response?: unknown
  logs: Array<{ level: string; msg: string; fields?: Record<string, unknown> }>
}

function processTrace(traceKey: string, events: RawEvent[]): CompressedTrace {
  const spanMap = new Map<string, RawEvent[]>()

  for (const event of events) {
    const spanId = event.span_id
    const existing = spanMap.get(spanId)
    if (existing) {
      existing.push(event)
    } else {
      spanMap.set(spanId, [event])
    }
  }

  const spans = new Map<string, SpanData>()

  for (const [spanId, spanEvents] of spanMap) {
    const data: SpanData = {
      spanId,
      call: '',
      logs: [],
    }

    for (const event of spanEvents) {
      const { Event } = event

      if (Event.SpanStart) {
        const start = Event.SpanStart
        data.parentSpanId = start.parent_span_id

        if (start.Data.Request) {
          const req = start.Data.Request
          data.call = `${req.service_name}.${req.endpoint_name}`
          data.method = req.http_method
          data.path = req.path
          data.request = decodePayload(req.request_payload)
        } else if (start.Data.PubsubMessage) {
          const pub = start.Data.PubsubMessage
          data.call = `${pub.service_name}/${pub.topic_name}:${pub.subscription_name}`
          data.request = decodePayload(pub.message_payload)
          if (pub.attempt && pub.attempt > 1) {
            data.method = `attempt ${pub.attempt}`
          }
        }
      }

      if (Event.SpanEnd) {
        const end = Event.SpanEnd
        data.durationMs = end.duration_nanos / 1_000_000

        if (end.error) {
          try {
            const parsed: unknown = JSON.parse(end.error.msg)
            if (
              typeof parsed === 'object' &&
              parsed !== null &&
              'internal_message' in parsed &&
              typeof (parsed as Record<string, unknown>).internal_message ===
                'string'
            ) {
              data.error = (parsed as Record<string, unknown>)
                .internal_message as string
            } else if (
              typeof parsed === 'object' &&
              parsed !== null &&
              'message' in parsed &&
              typeof (parsed as Record<string, unknown>).message === 'string'
            ) {
              data.error = (parsed as Record<string, unknown>).message as string
            } else {
              data.error = end.error.msg
            }
          } catch {
            data.error = end.error.msg
          }
        }

        if (end.panic_stack?.frames.length) {
          data.panicStack = end.panic_stack.frames
        }

        if (end.Data.Request) {
          data.statusCode = end.Data.Request.http_status_code
          data.response = decodePayload(end.Data.Request.response_payload)
        }
      }

      if (Event.SpanEvent?.Data.LogMessage) {
        const log = Event.SpanEvent.Data.LogMessage
        if (AUTO_GENERATED_MESSAGES.has(log.msg)) continue

        const entry: {
          level: string
          msg: string
          fields?: Record<string, unknown>
        } = {
          level: LOG_LEVELS[log.level] ?? String(log.level),
          msg: log.msg,
        }

        if (log.fields?.length) {
          entry.fields = {}
          for (const field of log.fields) {
            entry.fields[field.key] = extractFieldValue(field.Value)
          }
        }

        data.logs.push(entry)
      }
    }

    if (data.call === 'events.getEventStream') continue
    spans.set(spanId, data)
  }

  // Build tree
  const childMap = new Map<string, SpanData[]>()
  const rootSpans: SpanData[] = []

  for (const span of spans.values()) {
    if (span.parentSpanId != null && spans.has(span.parentSpanId)) {
      const children = childMap.get(span.parentSpanId)
      if (children) {
        children.push(span)
      } else {
        childMap.set(span.parentSpanId, [span])
      }
    } else {
      rootSpans.push(span)
    }
  }

  function buildCompressedSpan(data: SpanData): CompressedSpan {
    const span: CompressedSpan = {
      spanId: encodeSpanId(data.spanId),
      call: data.call,
      ...(data.method ? { method: data.method } : {}),
      ...(data.path ? { path: data.path } : {}),
      ...(data.statusCode != null ? { statusCode: data.statusCode } : {}),
      ...(data.durationMs != null
        ? { durationMs: Math.round(data.durationMs * 100) / 100 }
        : {}),
      ...(data.error ? { error: data.error } : {}),
      ...(data.panicStack ? { panicStack: data.panicStack } : {}),
      ...(data.request !== undefined ? { request: data.request } : {}),
      ...(data.response !== undefined ? { response: data.response } : {}),
      logs: data.logs,
      children: (childMap.get(data.spanId) ?? []).map(buildCompressedSpan),
    }
    return span
  }

  const encodedTraceId =
    events.length > 0 ? encodeTraceId(events[0].trace_id) : traceKey

  if (rootSpans.length === 1) {
    return {
      traceId: encodedTraceId,
      spans: buildCompressedSpan(rootSpans[0]),
    }
  }

  // Multiple roots — wrap in synthetic root
  const syntheticRoot: CompressedSpan = {
    spanId: 'root',
    call: '(multiple roots)',
    logs: [],
    children: rootSpans.map(buildCompressedSpan),
  }

  return {
    traceId: encodedTraceId,
    spans: syntheticRoot,
  }
}

// --- CLI ---

function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    process.stdin.on('data', (chunk: Buffer) => {
      chunks.push(chunk)
    })
    process.stdin.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf-8'))
    })
    process.stdin.on('error', reject)
  })
}

async function readInput(args: string[]): Promise<string> {
  if (args.length > 0) {
    const filePath = args[0]
    try {
      return readFileSync(filePath, 'utf-8')
    } catch (err) {
      die(`Error reading file: ${filePath}\n${(err as Error).message}`)
    }
  }
  if (!process.stdin.isTTY) {
    return readStdin()
  }
  printUsage()
  return process.exit(1)
}

async function main() {
  const args = process.argv.slice(2)

  if (args.includes('--help') || args.includes('-h')) {
    printUsage()
    process.exit(0)
  }

  const input = await readInput(args)

  const safeParsed = preserveUint64Fields(input)
  const raw = JSON.parse(safeParsed) as Record<string, RawEvent[]>
  const result: Record<string, CompressedTrace> = {}

  for (const [traceKey, events] of Object.entries(raw)) {
    result[traceKey] = processTrace(traceKey, events)
  }

  process.stdout.write(JSON.stringify(result, null, 2) + '\n')
}

void main()
