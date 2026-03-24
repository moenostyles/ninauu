'use client'

import { useState } from 'react'
import { CATEGORY_TREE, PARENT_CATEGORIES } from '@/types'

interface Props {
  value: string
  onChange: (category: string) => void
  className?: string
}

export default function CategorySelect({ value, onChange, className = '' }: Props) {
  // Derive current parent from value
  const currentParent =
    Object.entries(CATEGORY_TREE).find(([, children]) => children.includes(value))?.[0] ??
    PARENT_CATEGORIES[0]

  const [parent, setParent] = useState(currentParent)
  const children = CATEGORY_TREE[parent] ?? []

  const handleParentChange = (p: string) => {
    setParent(p)
    onChange(CATEGORY_TREE[p][0])
  }

  const selectClass = `w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink ${className}`

  return (
    <div className="flex flex-col gap-1.5">
      {/* Parent */}
      <select value={parent} onChange={(e) => handleParentChange(e.target.value)} className={selectClass}>
        {PARENT_CATEGORIES.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>
      {/* Child */}
      <select value={value} onChange={(e) => onChange(e.target.value)} className={selectClass}>
        {children.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
    </div>
  )
}
