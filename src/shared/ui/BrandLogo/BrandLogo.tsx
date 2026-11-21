import { useState } from 'react'

interface BrandLogoProps {
  url: string | undefined
}

export function BrandLogo({ url }: BrandLogoProps) {
  const [hasError, setHasError] = useState(false)

  if (!url || hasError) {
    return null
  }

  return (
    <span
      aria-hidden="true"
      className="brand-logo-tile inline-flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 p-3 shadow-[0_0_15px_rgba(227,132,178,0.1)] transition-[transform,border-color] duration-300 group-hover:scale-110"
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
