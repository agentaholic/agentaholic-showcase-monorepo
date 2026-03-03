/* v8 ignore start */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router'
import { App } from '~src/app/App'
import { ErrorBoundary } from '~src/app/components/ErrorBoundary'
import '~src/index.css'
import { TicTacToePage } from '../services/ticTacToe/pages/TicTacToePage'
import { HangmanPage } from '~src/services/hangman/pages/HangmanPage'

const rootElement = document.getElementById('root')

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <BrowserRouter>
        <ErrorBoundary namespaceSlug="main">
          <App
            routes={
              <Routes>
                <>
                  <Route path="/tic-tac-toe" element={<TicTacToePage />} />
                  <Route
                    path="/tic-tac-toe/:gameId"
                    element={<TicTacToePage />}
                  />
                  <Route path="/hangman" element={<HangmanPage />} />
                  <Route path="/hangman/:roundId" element={<HangmanPage />} />
                </>
              </Routes>
            }
          />
        </ErrorBoundary>
      </BrowserRouter>
    </StrictMode>,
  )
}
/* v8 ignore stop */
