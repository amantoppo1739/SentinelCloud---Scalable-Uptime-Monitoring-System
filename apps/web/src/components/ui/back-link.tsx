import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from './button'
import { cn } from '@/lib/utils'

interface BackLinkProps {
  href: string
  label?: string
  className?: string
}

export function BackLink({ href, label = 'Back', className }: BackLinkProps) {
  return (
    <Link href={href}>
      <Button variant="ghost" size="sm" className={cn('mb-4', className)}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        {label}
      </Button>
    </Link>
  )
}
