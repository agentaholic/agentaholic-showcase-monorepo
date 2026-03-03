#!/usr/bin/env -S npx tsx
export {}

/**
 * Formats a Linear ticket JSON from stdin into a human-readable format.
 *
 * Usage:
 *   cat ticket.json | formatLinearTicket.ts
 *   echo '{"id": "...", ...}' | formatLinearTicket.ts
 */

interface LinearUser {
  id: string
  name: string
}

interface LinearTeam {
  id: string
  key: string
  name: string
}

interface LinearState {
  id: string
  name: string
}

interface LinearCycle {
  id: string
  name: string | null
  number: number
}

interface LinearLabel {
  id: string
  name: string
  color: string
}

interface LinearComment {
  id: string
  body: string
  embeds: unknown[]
  user: LinearUser
  createdAt: string
  updatedAt: string
}

interface LinearTicket {
  id: string
  identifier: string
  title: string
  description: string
  embeds: unknown[]
  state: LinearState
  assignee: LinearUser | null
  team: LinearTeam
  cycle: LinearCycle | null
  priority: number
  labels: LinearLabel[]
  subIssues: unknown[]
  comments: LinearComment[]
  createdAt: string
  updatedAt: string
  branchName: string
}

function formatDate(isoDate: string): string {
  const date = new Date(isoDate)
  return date.toLocaleString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  })
}

function formatPriority(priority: number): string {
  const priorities: Record<number, string> = {
    0: 'No priority',
    1: 'Urgent',
    2: 'High',
    3: 'Medium',
    4: 'Low',
  }
  return priorities[priority] ?? `Unknown (${String(priority)})`
}

function wrapText(text: string, width: number, indent: string = ''): string {
  const lines: string[] = []
  const paragraphs = text.split('\n')

  for (const paragraph of paragraphs) {
    if (paragraph.trim() === '') {
      lines.push('')
      continue
    }

    const words = paragraph.split(' ')
    let currentLine = indent

    for (const word of words) {
      if (
        currentLine.length + word.length + 1 > width &&
        currentLine !== indent
      ) {
        lines.push(currentLine)
        currentLine = indent + word
      } else {
        currentLine += (currentLine === indent ? '' : ' ') + word
      }
    }

    if (currentLine !== indent) {
      lines.push(currentLine)
    }
  }

  return lines.join('\n')
}

function formatTicket(ticket: LinearTicket): string {
  const lines: string[] = []
  const divider = '─'.repeat(60)

  // Header
  lines.push(divider)
  lines.push(`  ${ticket.identifier}: ${ticket.title}`)
  lines.push(divider)
  lines.push('')

  // Metadata
  lines.push(`Status:     ${ticket.state.name}`)
  lines.push(`Priority:   ${formatPriority(ticket.priority)}`)
  lines.push(`Team:       ${ticket.team.name} (${ticket.team.key})`)
  lines.push(`Assignee:   ${ticket.assignee?.name ?? 'Unassigned'}`)

  if (ticket.cycle) {
    const cycleName =
      ticket.cycle.name ?? `Cycle ${String(ticket.cycle.number)}`
    lines.push(`Cycle:      ${cycleName}`)
  }

  if (ticket.labels.length > 0) {
    const labelNames = ticket.labels.map((l) => l.name).join(', ')
    lines.push(`Labels:     ${labelNames}`)
  }

  lines.push('')
  lines.push(`Created:    ${formatDate(ticket.createdAt)}`)
  lines.push(`Updated:    ${formatDate(ticket.updatedAt)}`)
  lines.push('')

  // Branch name
  lines.push(`Branch:     ${ticket.branchName}`)
  lines.push('')

  // Description
  if (ticket.description) {
    lines.push(divider)
    lines.push('  Description')
    lines.push(divider)
    lines.push('')
    lines.push(wrapText(ticket.description, 70, '  '))
    lines.push('')
  }

  // Comments
  if (ticket.comments.length > 0) {
    lines.push(divider)
    lines.push(`  Comments (${String(ticket.comments.length)})`)
    lines.push(divider)

    // Sort comments by creation date (oldest first)
    const sortedComments = [...ticket.comments].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )

    for (const comment of sortedComments) {
      lines.push('')
      lines.push(`  ${comment.user.name} · ${formatDate(comment.createdAt)}`)
      lines.push('  ' + '·'.repeat(40))
      lines.push(wrapText(comment.body, 70, '  '))
    }
    lines.push('')
  }

  lines.push(divider)

  return lines.join('\n')
}

async function main(): Promise<void> {
  const chunks: Buffer[] = []

  for await (const chunk of process.stdin) {
    chunks.push(chunk as Buffer)
  }

  const input = Buffer.concat(chunks).toString('utf-8').trim()

  if (!input) {
    process.stderr.write(
      'Error: No input provided. Pipe Linear ticket JSON to stdin.\n',
    )
    process.exit(1)
  }

  let ticket: LinearTicket
  try {
    ticket = JSON.parse(input) as LinearTicket
  } catch {
    process.stderr.write('Error: Invalid JSON input.\n')
    process.exit(1)
  }

  if (!ticket.identifier || !ticket.title) {
    process.stderr.write(
      'Error: Input does not appear to be a valid Linear ticket.\n',
    )
    process.exit(1)
  }

  process.stdout.write(formatTicket(ticket) + '\n')
}

void main()
