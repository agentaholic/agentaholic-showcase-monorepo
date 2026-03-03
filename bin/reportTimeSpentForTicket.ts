#!/usr/bin/env -S npx tsx

/**
 * Linear Issue Time Spent Reporter
 *
 * Fetches a Linear issue and recursively crawls all sub-issues,
 * parsing time tracking from comments and displaying a breakdown tree.
 *
 * Usage:
 *   reportTimeSpentForTicket.ts <issue-id>
 *   reportTimeSpentForTicket.ts AGE-1008
 *
 * Parses comments for the format: **Active Time:** Xm (X minutes)
 */

import { execSync } from 'child_process'

interface LinearComment {
  id: string
  body: string
  user: { id: string; name: string }
  createdAt: string
}

interface LinearSubIssue {
  id: string
  identifier: string
  title: string
}

interface LinearIssue {
  id: string
  identifier: string
  title: string
  comments: LinearComment[]
  subIssues: LinearSubIssue[]
}

interface IssueTimeData {
  identifier: string
  title: string
  ownMinutes: number
  totalMinutes: number
  children: IssueTimeData[]
}

function fetchIssue(issueId: string): LinearIssue {
  const output = execSync(`linearis issues read ${issueId}`, {
    encoding: 'utf-8',
  })
  return JSON.parse(output) as LinearIssue
}

function parseMinutesFromComment(body: string): number {
  // Match: **Active Time:** 57m (57 minutes) or **Active Time:** 1h 30m (90 minutes)
  const match = body.match(/\*\*Active Time:\*\*.*?\((\d+)\s*minutes?\)/i)
  if (match) {
    return parseInt(match[1], 10)
  }
  return 0
}

function calculateIssueTime(issueId: string): IssueTimeData {
  const issue = fetchIssue(issueId)

  // Sum minutes from all comments
  const ownMinutes = issue.comments.reduce((sum, comment) => {
    return sum + parseMinutesFromComment(comment.body)
  }, 0)

  // Recursively process sub-issues
  const children = issue.subIssues.map((subIssue) =>
    calculateIssueTime(subIssue.identifier),
  )

  // Total = own + all children's totals
  const childrenTotal = children.reduce(
    (sum, child) => sum + child.totalMinutes,
    0,
  )
  const totalMinutes = ownMinutes + childrenTotal

  return {
    identifier: issue.identifier,
    title: issue.title,
    ownMinutes,
    totalMinutes,
    children,
  }
}

function formatDuration(minutes: number): string {
  if (minutes === 0) return '0m'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

function printTree(
  data: IssueTimeData,
  prefix: string = '',
  isLast: boolean = true,
  isRoot: boolean = true,
): void {
  const connector = isRoot ? '' : isLast ? '└── ' : '├── '

  const ownTime = formatDuration(data.ownMinutes)
  const totalTime = formatDuration(data.totalMinutes)

  const timeDisplay =
    data.children.length > 0 ? `${ownTime} (total: ${totalTime})` : totalTime

  // claude-hooks-ignore-logging-violation
  console.log(
    `${prefix}${connector}[${data.identifier}] ${data.title} - ${timeDisplay}`,
  )

  const childPrefix = isRoot ? '' : prefix + (isLast ? '    ' : '│   ')
  data.children.forEach((child, index) => {
    const isChildLast = index === data.children.length - 1
    printTree(child, childPrefix, isChildLast, false)
  })
}

function main(): void {
  const issueId = process.argv[2]

  if (!issueId) {
    // claude-hooks-ignore-logging-violation
    console.error('Usage: reportTimeSpentForTicket.ts <issue-id>')
    // claude-hooks-ignore-logging-violation
    console.error('Example: reportTimeSpentForTicket.ts AGE-1008')
    process.exit(1)
  }

  // claude-hooks-ignore-logging-violation
  console.log(`Fetching issue ${issueId} and all sub-issues...\n`)

  const data = calculateIssueTime(issueId)

  printTree(data)

  // claude-hooks-ignore-logging-violation
  console.log('')
  // claude-hooks-ignore-logging-violation
  console.log(
    `Grand Total: ${data.totalMinutes} minutes (${formatDuration(data.totalMinutes)})`,
  )
}

main()
