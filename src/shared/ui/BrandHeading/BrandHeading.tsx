import { usePointerFeedback } from '@shared/lib/pointer/usePointerFeedback'
import { BrandLogo } from '@shared/ui/BrandLogo'

interface BrandHeadingProps {
  title: string
  logoUrl: string | undefined
}

export function BrandHeading({ title, logoUrl }: BrandHeadingProps) {
  const { pointerActive, pointerFeedbackHandlers } = usePointerFeedback()

  return (
    <div
      className="brand-feedback flex items-center gap-3 self-start"
      data-pointer-hover={pointerActive}
      {...pointerFeedbackHandlers}
    >
      <BrandLogo url={logoUrl} />
      <h3 className="brand-title text-xl font-bold tracking-tight text-slate-900 transition-colors dark:text-white">
        {title}
      </h3>
    </div>
  )
}
