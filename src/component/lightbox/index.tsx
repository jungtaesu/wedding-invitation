import {
  ReactNode,
  TouchEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

type LightboxImage = {
  src: string
  alt?: string
  caption?: ReactNode
}

type LightboxImageInput = string | LightboxImage

type LightboxProps = {
  images: LightboxImageInput[]
  index?: number
  defaultIndex?: number
  onIndexChange?: (nextIndex: number) => void
  onRequestClose?: () => void
  loop?: boolean
  showCounter?: boolean
  showThumbnails?: boolean
  className?: string
}

type Point = {
  x: number
  y: number
}

type TouchPoint = {
  clientX: number
  clientY: number
}

type TouchGesture =
  | { mode: "none" }
  | {
      mode: "pan"
      startX: number
      startY: number
      startOffsetX: number
      startOffsetY: number
    }
  | {
      mode: "pinch"
      startDistance: number
      startScale: number
      startOffsetX: number
      startOffsetY: number
      startMidX: number
      startMidY: number
    }

const MIN_SCALE = 1
const MAX_SCALE = 4

const normalizeImages = (images: LightboxImageInput[]): LightboxImage[] =>
  images.map((image, idx) =>
    typeof image === "string"
      ? { src: image, alt: `lightbox-image-${idx}` }
      : {
          src: image.src,
          alt: image.alt ?? `lightbox-image-${idx}`,
          caption: image.caption,
        },
  )

const clampIndex = (value: number, length: number) => {
  if (length === 0) return 0
  if (value < 0) return 0
  if (value > length - 1) return length - 1
  return value
}

const getDistance = (a: TouchPoint, b: TouchPoint) => {
  const dx = b.clientX - a.clientX
  const dy = b.clientY - a.clientY
  return Math.hypot(dx, dy)
}

const getMidpoint = (a: TouchPoint, b: TouchPoint): Point => ({
  x: (a.clientX + b.clientX) / 2,
  y: (a.clientY + b.clientY) / 2,
})

export const Lightbox = ({
  images,
  index,
  defaultIndex = 0,
  onIndexChange,
  onRequestClose,
  loop = true,
  showCounter = true,
  showThumbnails = false,
  className,
}: LightboxProps) => {
  const normalizedImages = useMemo(() => normalizeImages(images), [images])
  const isControlled = typeof index === "number"

  const imageWrapperRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const touchGestureRef = useRef<TouchGesture>({ mode: "none" })

  const [scale, setScale] = useState(1)
  const scaleRef = useRef(1)
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 })
  const offsetRef = useRef<Point>({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)

  const setScaleWithRef = useCallback((nextScale: number) => {
    scaleRef.current = nextScale
    setScale(nextScale)
  }, [])

  const setOffsetWithRef = useCallback((nextOffset: Point) => {
    offsetRef.current = nextOffset
    setOffset(nextOffset)
  }, [])

  const clampOffset = useCallback((targetScale: number, targetOffset: Point) => {
    if (targetScale <= 1) return { x: 0, y: 0 }

    const wrapper = imageWrapperRef.current
    const image = imageRef.current
    if (!wrapper || !image) return { x: 0, y: 0 }

    const wrapperRect = wrapper.getBoundingClientRect()
    const naturalWidth = image.naturalWidth || image.clientWidth
    const naturalHeight = image.naturalHeight || image.clientHeight
    if (!naturalWidth || !naturalHeight) return targetOffset

    const fitScale = Math.min(
      wrapperRect.width / naturalWidth,
      wrapperRect.height / naturalHeight,
    )
    const baseWidth = naturalWidth * fitScale
    const baseHeight = naturalHeight * fitScale
    const scaledWidth = baseWidth * targetScale
    const scaledHeight = baseHeight * targetScale

    const maxX = Math.max(0, (scaledWidth - wrapperRect.width) / 2)
    const maxY = Math.max(0, (scaledHeight - wrapperRect.height) / 2)

    return {
      x: Math.min(maxX, Math.max(-maxX, targetOffset.x)),
      y: Math.min(maxY, Math.max(-maxY, targetOffset.y)),
    }
  }, [])

  const resetZoom = useCallback(() => {
    setScaleWithRef(1)
    setOffsetWithRef({ x: 0, y: 0 })
    touchGestureRef.current = { mode: "none" }
    setIsPanning(false)
  }, [setOffsetWithRef, setScaleWithRef])

  const [internalIndex, setInternalIndex] = useState(() =>
    clampIndex(defaultIndex, normalizedImages.length),
  )

  useEffect(() => {
    if (!isControlled) {
      setInternalIndex((prevIndex) => clampIndex(prevIndex, normalizedImages.length))
    }
  }, [isControlled, normalizedImages.length])

  const currentIndex = isControlled
    ? clampIndex(index as number, normalizedImages.length)
    : internalIndex

  useEffect(() => {
    resetZoom()
  }, [currentIndex, resetZoom])

  useEffect(() => {
    const onResize = () => {
      const clamped = clampOffset(scaleRef.current, offsetRef.current)
      setOffsetWithRef(clamped)
    }

    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [clampOffset, setOffsetWithRef])

  const setIndex = useCallback(
    (nextIndex: number) => {
      const safeIndex = clampIndex(nextIndex, normalizedImages.length)
      if (!isControlled) {
        setInternalIndex(safeIndex)
      }
      onIndexChange?.(safeIndex)
    },
    [isControlled, normalizedImages.length, onIndexChange],
  )

  const move = useCallback(
    (step: number) => {
      if (normalizedImages.length === 0) return

      const nextIndex = currentIndex + step
      if (loop) {
        setIndex((nextIndex + normalizedImages.length) % normalizedImages.length)
        return
      }

      setIndex(clampIndex(nextIndex, normalizedImages.length))
    },
    [currentIndex, loop, normalizedImages.length, setIndex],
  )

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault()
        move(-1)
      } else if (e.key === "ArrowRight") {
        e.preventDefault()
        move(1)
      } else if (e.key === "Escape") {
        onRequestClose?.()
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [move, onRequestClose])

  const onTouchStart = useCallback(
    (e: TouchEvent<HTMLDivElement>) => {
      if (e.touches.length === 2) {
        e.preventDefault()

        const [a, b] = [e.touches[0], e.touches[1]]
        const midpoint = getMidpoint(a, b)
        touchGestureRef.current = {
          mode: "pinch",
          startDistance: Math.max(1, getDistance(a, b)),
          startScale: scaleRef.current,
          startOffsetX: offsetRef.current.x,
          startOffsetY: offsetRef.current.y,
          startMidX: midpoint.x,
          startMidY: midpoint.y,
        }
        setIsPanning(false)
        return
      }

      if (e.touches.length === 1 && scaleRef.current > 1) {
        e.preventDefault()

        const touch = e.touches[0]
        touchGestureRef.current = {
          mode: "pan",
          startX: touch.clientX,
          startY: touch.clientY,
          startOffsetX: offsetRef.current.x,
          startOffsetY: offsetRef.current.y,
        }
        setIsPanning(true)
      }
    },
    [],
  )

  const onTouchMove = useCallback(
    (e: TouchEvent<HTMLDivElement>) => {
      const gesture = touchGestureRef.current

      if (e.touches.length === 2) {
        e.preventDefault()
        const [a, b] = [e.touches[0], e.touches[1]]

        if (gesture.mode !== "pinch") {
          const midpoint = getMidpoint(a, b)
          touchGestureRef.current = {
            mode: "pinch",
            startDistance: Math.max(1, getDistance(a, b)),
            startScale: scaleRef.current,
            startOffsetX: offsetRef.current.x,
            startOffsetY: offsetRef.current.y,
            startMidX: midpoint.x,
            startMidY: midpoint.y,
          }
          return
        }

        const currentDistance = Math.max(1, getDistance(a, b))
        const midpoint = getMidpoint(a, b)
        const nextScale = Math.min(
          MAX_SCALE,
          Math.max(
            MIN_SCALE,
            gesture.startScale * (currentDistance / gesture.startDistance),
          ),
        )

        const nextOffset = clampOffset(nextScale, {
          x: gesture.startOffsetX + (midpoint.x - gesture.startMidX),
          y: gesture.startOffsetY + (midpoint.y - gesture.startMidY),
        })

        setScaleWithRef(nextScale)
        setOffsetWithRef(nextOffset)
        setIsPanning(nextScale > 1)
        return
      }

      if (e.touches.length === 1 && gesture.mode === "pan" && scaleRef.current > 1) {
        e.preventDefault()

        const touch = e.touches[0]
        const nextOffset = clampOffset(scaleRef.current, {
          x: gesture.startOffsetX + (touch.clientX - gesture.startX),
          y: gesture.startOffsetY + (touch.clientY - gesture.startY),
        })

        setOffsetWithRef(nextOffset)
      }
    },
    [clampOffset, setOffsetWithRef, setScaleWithRef],
  )

  const onTouchEnd = useCallback((e: TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 0) {
      touchGestureRef.current = { mode: "none" }
      setIsPanning(false)
      if (scaleRef.current <= 1) {
        setScaleWithRef(1)
        setOffsetWithRef({ x: 0, y: 0 })
      }
      return
    }

    if (e.touches.length === 1 && scaleRef.current > 1) {
      const touch = e.touches[0]
      touchGestureRef.current = {
        mode: "pan",
        startX: touch.clientX,
        startY: touch.clientY,
        startOffsetX: offsetRef.current.x,
        startOffsetY: offsetRef.current.y,
      }
      setIsPanning(true)
      return
    }

    touchGestureRef.current = { mode: "none" }
    setIsPanning(false)
  }, [setOffsetWithRef, setScaleWithRef])

  const onImageLoad = useCallback(() => {
    const clamped = clampOffset(scaleRef.current, offsetRef.current)
    setOffsetWithRef(clamped)
  }, [clampOffset, setOffsetWithRef])

  if (normalizedImages.length === 0) return null

  const currentImage = normalizedImages[currentIndex]
  const imageStyle = {
    transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})`,
  }

  return (
    <div className={`lightbox${className ? ` ${className}` : ""}`}>
      <div className="lightbox-stage">
        <div
          className={`lightbox-image-wrapper${scale > 1 ? " zoomed" : ""}${isPanning ? " panning" : ""}`}
          ref={imageWrapperRef}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onTouchCancel={onTouchEnd}
        >
          <img
            className="lightbox-image"
            src={currentImage.src}
            alt={currentImage.alt}
            draggable={false}
            ref={imageRef}
            style={imageStyle}
            onLoad={onImageLoad}
          />
        </div>
      </div>

      {currentImage.caption && (
        <div className="lightbox-caption">{currentImage.caption}</div>
      )}

      {showCounter && (
        <div className="lightbox-counter">
          {currentIndex + 1} / {normalizedImages.length}
        </div>
      )}

      {showThumbnails && (
        <div className="lightbox-thumbnails">
          {normalizedImages.map((image, idx) => (
            <button
              key={`${image.src}-${idx}`}
              className={`lightbox-thumbnail${idx === currentIndex ? " active" : ""}`}
              onClick={() => setIndex(idx)}
              aria-label={`Open image ${idx + 1}`}
            >
              <img src={image.src} alt={image.alt} draggable={false} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export type { LightboxProps, LightboxImage, LightboxImageInput }