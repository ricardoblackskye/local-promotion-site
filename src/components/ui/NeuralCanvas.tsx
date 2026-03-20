import { useEffect, useRef } from 'react'

interface Node {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  opacity: number
}

interface Connection {
  a: number
  b: number
  opacity: number
}

const NODE_COUNT = 60
const MAX_DISTANCE = 120
const ACCENT_COLOR = '0, 212, 255'

function createNode(width: number, height: number): Node {
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.4,
    vy: (Math.random() - 0.5) * 0.4,
    radius: Math.random() * 2 + 1,
    opacity: Math.random() * 0.5 + 0.3,
  }
}

export default function NeuralCanvas({ className = '' }: Readonly<{ className?: string }>) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number | null>(null)
  const nodesRef = useRef<Node[]>([])
  const connectionsRef = useRef<Connection[]>([])

  useEffect(() => {
    const canvas = canvasRef.current
    /* v8 ignore next */
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    /* v8 ignore next */
    if (!ctx) return

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      nodesRef.current = Array.from({ length: NODE_COUNT }, () =>
        createNode(canvas.width, canvas.height),
      )
    }

    resize()

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)

    const buildConnections = () => {
      connectionsRef.current = []
      const nodes = nodesRef.current
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x
          const dy = nodes[i].y - nodes[j].y
          const dist = Math.hypot(dx, dy)
          /* v8 ignore next 4 */
          if (dist < MAX_DISTANCE) {
            connectionsRef.current.push({
              a: i,
              b: j,
              opacity: 1 - dist / MAX_DISTANCE,
            })
          }
        }
      }
    }

    const draw = () => {
      const nodes = nodesRef.current
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Move nodes
      for (const node of nodes) {
        node.x += node.vx
        node.y += node.vy
        /* v8 ignore next 2 */
        if (node.x < 0 || node.x > canvas.width) node.vx *= -1
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1
      }

      buildConnections()

      // Draw connections
      for (const conn of connectionsRef.current) {
        const alpha = conn.opacity * 0.3
        ctx.beginPath()
        ctx.strokeStyle = `rgba(${ACCENT_COLOR}, ${alpha})`
        ctx.lineWidth = 0.5
        ctx.moveTo(nodes[conn.a].x, nodes[conn.a].y)
        ctx.lineTo(nodes[conn.b].x, nodes[conn.b].y)
        ctx.stroke()
      }

      // Draw nodes
      for (const node of nodes) {
        ctx.beginPath()
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${ACCENT_COLOR}, ${node.opacity})`
        ctx.fill()
      }

      animFrameRef.current = requestAnimationFrame(draw)
    }

    animFrameRef.current = requestAnimationFrame(draw)

    return () => {
      /* v8 ignore next */
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      resizeObserver.disconnect()
    }
  }, [])

  return (
    <div className={`w-full h-full ${className}`} aria-hidden="true">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  )
}
