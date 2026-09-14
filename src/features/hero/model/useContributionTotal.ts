import { useEffect, useState } from 'react'

import { fetchContributionTotal } from './contributions'

type ContributionResult =
  | { readonly status: 'loading' | 'error'; readonly total: null }
  | { readonly status: 'success'; readonly total: number }

type ContributionState = ContributionResult & { readonly githubUsername: string }

const CONTRIBUTION_REQUEST_TIMEOUT_MS = 8000

export function useContributionTotal(githubUsername: string): ContributionResult {
  const [state, setState] = useState<ContributionState>(() => ({
    githubUsername,
    status: 'loading',
    total: null,
  }))

  // Reset during render so changing back to a previous username cannot reveal its
  // old result while a new request is pending.
  if (state.githubUsername !== githubUsername) {
    setState({ githubUsername, status: 'loading', total: null })
  }

  useEffect(() => {
    const controller = new AbortController()
    let isActive = true
    const timeoutId = window.setTimeout(() => {
      controller.abort()
      if (isActive) {
        setState({ githubUsername, status: 'error', total: null })
      }
    }, CONTRIBUTION_REQUEST_TIMEOUT_MS)

    void fetchContributionTotal({ githubUsername, signal: controller.signal })
      .then((total) => {
        if (isActive && !controller.signal.aborted) {
          setState({ githubUsername, status: 'success', total })
        }
      })
      .catch(() => {
        if (isActive && !controller.signal.aborted) {
          setState({ githubUsername, status: 'error', total: null })
        }
      })
      .finally(() => {
        window.clearTimeout(timeoutId)
      })

    return () => {
      isActive = false
      window.clearTimeout(timeoutId)
      controller.abort()
    }
  }, [githubUsername])

  return state.githubUsername === githubUsername
    ? state
    : { status: 'loading', total: null }
}
