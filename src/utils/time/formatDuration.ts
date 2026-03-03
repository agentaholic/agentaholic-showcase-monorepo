export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)

  if (totalSeconds < 60) {
    return `${totalSeconds}s`
  }

  const totalMinutes = Math.floor(totalSeconds / 60)

  if (totalMinutes < 60) {
    const remainingSeconds = totalSeconds % 60
    return remainingSeconds > 0
      ? `${totalMinutes}m ${remainingSeconds}s`
      : `${totalMinutes}m`
  }

  const hours = Math.floor(totalMinutes / 60)
  const remainingMinutes = totalMinutes % 60
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
}
