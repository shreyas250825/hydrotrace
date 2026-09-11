import { DEFAULT_SCENE_LAYERS } from '@/config/defaults'
import { DamScene2D } from '@/scene/DamScene2D'
import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  compact?: boolean
  preserveWebGL?: boolean
  onFail?: () => void
}

interface State {
  hasError: boolean
}

class SceneErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn('Scene subtree failed.', error.message, info.componentStack)
    this.props.onFail?.()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback !== undefined) return this.props.fallback
      return (
        <DamScene2D
          eventType="DAM_BREAK"
          layers={DEFAULT_SCENE_LAYERS}
          cameraView="default"
          quality={this.props.compact ? 'preview' : 'high'}
          breached
        />
      )
    }
    return this.props.children
  }
}

export { SceneErrorBoundary }
