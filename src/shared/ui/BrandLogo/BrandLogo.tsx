import { useState } from 'react'

import { cn } from '@shared/lib/cn'
import { usePointerHover } from '@shared/lib/pointer/usePointerHover'

interface BrandLogoProps {
  url: string | undefined
  active?: boolean
}

export function BrandLogo({ url, active = false }: BrandLogoProps) {
  const [hasError, setHasError] = useState(false)
  const { pointerHovered, pointerHoverHandlers } = usePointerHover()

  if (!url || hasError) {
    return null
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        'brand-logo-tile inline-flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 p-3 shadow-[0_0_15px_rgba(227,132,178,0.1)] transition-[transform,border-color] duration-300',
        (active || pointerHovered) && 'scale-110'
      )}
      {...pointerHoverHandlers}
    >
      <img
        alt=""
        className="h-6 w-6 object-contain"
        decoding="async"
        height={24}
        loading="lazy"
        onError={() => {
          setHasError(true)
        }}
        referrerPolicy="no-referrer"
        src={url}
        width={24}
      />
    </span>
  )
}
