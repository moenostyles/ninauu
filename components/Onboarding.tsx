'use client'

import { Check } from 'lucide-react'

interface Big3Item {
  label: string
  icon: string
  query: string        // pre-fill search with this
  category: string     // leaf category to check completion
}

const BIG3: Big3Item[] = [
  { label: 'Tent',         icon: '⛺', query: 'tent',         category: 'Tent'         },
  { label: 'Backpack',     icon: '🎒', query: 'backpack',     category: 'Backpack'     },
  { label: 'Sleeping Bag', icon: '🛌', query: 'sleeping bag', category: 'Sleeping Bag' },
]

interface Props {
  /** leaf categories already in the user's gear list */
  registeredCategories: Set<string>
  /** called when user clicks "Add X" — pass the search query */
  onAdd: (query: string) => void
  onSkip: () => void
}

export default function Onboarding({ registeredCategories, onAdd, onSkip }: Props) {
  const done = BIG3.filter((b) => registeredCategories.has(b.category))
  const remaining = BIG3.filter((b) => !registeredCategories.has(b.category))

  return (
    <div className="mb-6 bg-fill border border-line rounded-2xl px-5 pt-5 pb-4">
      {/* Header */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-ink-3 uppercase tracking-wider mb-1">Getting started</p>
        <h2 className="text-base font-semibold text-ink leading-snug">
          Start with the Big 3
        </h2>
        <p className="text-xs text-ink-3 mt-1">
          Tent · Backpack · Sleeping Bag — the three heaviest items in any pack.
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex items-center gap-1.5 mb-4">
        {BIG3.map((b) => {
          const isDone = registeredCategories.has(b.category)
          return (
            <div
              key={b.category}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
                isDone ? 'bg-ink text-surface' : 'bg-line text-ink-3'
              }`}
            >
              {isDone && <Check size={9} strokeWidth={3} />}
              {b.label}
            </div>
          )
        })}
      </div>

      {/* Action buttons — only show remaining items */}
      <div className="flex flex-col gap-2 mb-3">
        {remaining.map((b) => (
          <button
            key={b.category}
            onClick={() => onAdd(b.query)}
            className="flex items-center gap-3 w-full text-left px-4 py-3 bg-surface border border-line rounded-xl hover:border-ink hover:bg-white transition-colors"
          >
            <span className="text-xl leading-none">{b.icon}</span>
            <div>
              <p className="text-sm font-medium text-ink">Add {b.label}</p>
              <p className="text-[10px] text-ink-3 mt-0.5">Search the database or enter manually</p>
            </div>
            <span className="ml-auto text-ink-3 text-xs">→</span>
          </button>
        ))}

        {/* Completed items (muted) */}
        {done.map((b) => (
          <div
            key={b.category}
            className="flex items-center gap-3 w-full px-4 py-3 bg-fill-2 border border-line rounded-xl opacity-60"
          >
            <span className="text-xl leading-none">{b.icon}</span>
            <p className="text-sm font-medium text-ink-3 line-through">{b.label}</p>
            <Check size={14} strokeWidth={2.5} className="ml-auto text-ink-3" />
          </div>
        ))}
      </div>

      {/* Skip */}
      <button
        onClick={onSkip}
        className="w-full text-center text-xs text-ink-3 hover:text-ink transition-colors py-1"
      >
        Skip for now
      </button>
    </div>
  )
}
