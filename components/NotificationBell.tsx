'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface Notification {
  id: string
  type: string
  actor_id: string
  read: boolean
  created_at: string
  actor_display_name: string | null
  actor_avatar_url: string | null
}

interface Props {
  userId: string
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function NotificationBell({ userId }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter((n) => !n.read).length

  const loadNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('id, type, actor_id, read, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (!data || data.length === 0) { setNotifications([]); return }

    const actorIds = [...new Set(data.map((n: { actor_id: string }) => n.actor_id))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .in('id', actorIds)

    const profileMap: Record<string, { display_name: string | null; avatar_url: string | null }> = {}
    for (const p of profiles ?? []) profileMap[p.id] = p

    setNotifications(data.map((n: { id: string; type: string; actor_id: string; read: boolean; created_at: string }) => ({
      ...n,
      actor_display_name: profileMap[n.actor_id]?.display_name ?? null,
      actor_avatar_url:   profileMap[n.actor_id]?.avatar_url ?? null,
    })))
  }

  useEffect(() => {
    loadNotifications()

    // Realtime subscription
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, () => loadNotifications())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleOpen = async () => {
    setOpen((p) => !p)
    // Mark all as read
    if (!open && unreadCount > 0) {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false)
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative text-ink-3 hover:text-surface transition-colors p-1"
        aria-label="Notifications"
      >
        <Bell size={18} strokeWidth={2} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-line rounded-2xl shadow-lg overflow-hidden z-50">
          <div className="px-4 py-2.5 border-b border-line">
            <p className="text-xs font-semibold text-ink">Notifications</p>
          </div>
          {notifications.length === 0 ? (
            <p className="text-xs text-ink-3 text-center py-6">No notifications yet.</p>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {notifications.map((n) => (
                <Link
                  key={n.id}
                  href={`/profile/${n.actor_id}`}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 hover:bg-fill transition-colors ${!n.read ? 'bg-fill' : ''}`}
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-fill-2 flex items-center justify-center shrink-0">
                    {n.actor_avatar_url ? (
                      <img src={n.actor_avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-ink-2">
                        {(n.actor_display_name ?? '?').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-ink">
                      <span className="font-semibold">{n.actor_display_name ?? 'Someone'}</span>
                      {' '}started following you.
                    </p>
                    <p className="text-[10px] text-ink-3 mt-0.5">{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-ink shrink-0" />}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
