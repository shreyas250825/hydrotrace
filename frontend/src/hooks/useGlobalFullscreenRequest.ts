import { useFloodStore } from '@/store/useFloodStore'
import { useEffect, useRef } from 'react'

/** Listen for top-bar Fullscreen requests and enter the current workspace fullscreen. */
function useGlobalFullscreenRequest(enterFullscreen: () => void) {
  const requestId = useFloodStore((s) => s.fullscreenRequestId)
  const last = useRef(0)

  useEffect(() => {
    if (requestId > 0 && requestId !== last.current) {
      last.current = requestId
      enterFullscreen()
    }
  }, [requestId, enterFullscreen])
}

export { useGlobalFullscreenRequest }
