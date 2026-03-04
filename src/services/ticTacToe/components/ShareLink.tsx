import { useState } from 'react'

interface ShareLinkProps {
  gameId: string
  currentPlayer: 'X' | 'O'
}

export const ShareLink = ({ gameId, currentPlayer }: ShareLinkProps) => {
  const [copied, setCopied] = useState(false)

  const opponent = currentPlayer === 'X' ? 'O' : 'X'
  const shareUrl = `${window.location.origin}/tic-tac-toe/${gameId}?player=${opponent}`

  const handleCopy = () => {
    void navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
      }, 2000)
    })
  }

  return (
    <div className="flex flex-col items-center gap-2 bg-white rounded-lg p-4 shadow-sm w-full max-w-md">
      <p className="text-sm text-gray-500">Share with player {opponent}:</p>
      <div className="flex items-center gap-2 w-full">
        <span className="flex-1 text-sm text-gray-700 bg-gray-50 rounded px-3 py-2 truncate">
          {shareUrl}
        </span>
        <button
          onClick={handleCopy}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  )
}
