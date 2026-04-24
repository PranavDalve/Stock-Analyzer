'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

import { MoonIcon, SunIcon } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

const SwitchIconLabelDemo = () => {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  // ✅ use resolvedTheme instead of theme
  const isDark = resolvedTheme === 'dark'

  return (
    <div className='inline-flex items-center gap-2 ml-auto'>
      <Switch
        id='icon-label'
        checked={isDark}
        onCheckedChange={(checked) =>
          setTheme(checked ? 'dark' : 'light')
        }
        aria-label='Toggle theme'
      />

      <Label htmlFor='icon-label'>
        <span className='sr-only'>Toggle theme</span>
        {isDark ? (
          <MoonIcon className='size-4' />
        ) : (
          <SunIcon className='size-4' />
        )}
      </Label>
    </div>
  )
}

export default SwitchIconLabelDemo