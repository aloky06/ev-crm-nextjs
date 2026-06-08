'use client'
import React, { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send, ChevronLeft, User as UserIcon } from 'lucide-react'
import { useQuery, useMutation } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import toast from 'react-hot-toast'

export function ChatWidget() {
  const { user } = useAuthStore()
  const [isOpen, setIsOpen] = useState(false)
  const [activeChatId, setActiveChatId] = useState<number | null>(null)
  const [messageInput, setMessageInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch Conversations List
  const { data: convData, refetch: refetchConvs } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => api.get('/chat/conversations').then(r => r.data),
    refetchInterval: isOpen && !activeChatId ? 10000 : false, // Poll if list is open
  })

  // Fetch Active Chat Messages
  const { data: messagesData, refetch: refetchMsgs } = useQuery({
    queryKey: ['messages', activeChatId],
    queryFn: () => api.get(`/chat/conversations/${activeChatId}/messages`).then(r => r.data),
    enabled: !!activeChatId,
    refetchInterval: isOpen && activeChatId ? 5000 : false, // Poll faster when in chat
  })

  // Start new chat (Dealer/BDE starting support chat)
  const startChatMutation = useMutation({
    mutationFn: () => api.post('/chat/start'),
    onSuccess: (res) => {
      refetchConvs()
      setActiveChatId(res.data.conversation.id)
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Could not start chat')
  })

  // Send message
  const sendMessageMutation = useMutation({
    mutationFn: (msg: string) => api.post(`/chat/conversations/${activeChatId}/messages`, { message: msg }),
    onSuccess: () => {
      setMessageInput('')
      refetchMsgs()
      refetchConvs()
    }
  })

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messagesData])

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageInput.trim()) return
    sendMessageMutation.mutate(messageInput)
  }

  const getOtherUser = (conversation: any) => {
    return conversation.user1_id === user?.id ? conversation.user2 : conversation.user1
  }

  const conversations = convData?.conversations || []
  const messages = messagesData?.messages || []
  
  const activeConversation = conversations.find((c: any) => c.id === activeChatId)
  const activeOtherUser = activeConversation ? getOtherUser(activeConversation) : null

  const totalUnread = conversations.reduce((acc: number, c: any) => acc + (c.unread_count || 0), 0)

  if (!user) return null

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Minimized Bubble */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg shadow-blue-600/30 transition-transform transform hover:scale-105 relative"
        >
          <MessageCircle size={28} />
          {totalUnread > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
              {totalUnread}
            </span>
          )}
        </button>
      )}

      {/* Expanded Chat Window */}
      {isOpen && (
        <div className="bg-white w-80 sm:w-96 rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden fade-in-up" style={{ height: '500px', maxHeight: '80vh' }}>
          
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white flex justify-between items-center shadow-md z-10">
            <div className="flex items-center gap-2">
              {activeChatId && (
                <button onClick={() => setActiveChatId(null)} className="hover:bg-white/20 p-1 rounded-lg transition-colors">
                  <ChevronLeft size={20} />
                </button>
              )}
              <h3 className="font-semibold text-sm">
                {activeChatId && activeOtherUser ? activeOtherUser.name : 'Messages'}
              </h3>
            </div>
            <div className="flex items-center gap-1">
              {activeChatId && activeOtherUser?.mobile && (
                <a 
                  href={`https://wa.me/91${activeOtherUser.mobile.replace(/\D/g, '')}?text=Hi%20${activeOtherUser.name.split(' ')[0]},`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:bg-white/20 p-1.5 rounded-lg transition-colors text-emerald-300 hover:text-emerald-200"
                  title="Chat on WhatsApp"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                </a>
              )}
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto bg-slate-50 flex flex-col">
            
            {/* Conversations List View */}
            {!activeChatId && (
              <div className="p-2 flex-1">
                {conversations.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-4">
                    <MessageCircle size={40} className="text-slate-300" />
                    <p className="text-sm">No active conversations yet.</p>
                    {user.role !== 'admin' && (
                      <button 
                        onClick={() => startChatMutation.mutate()}
                        disabled={startChatMutation.isPending}
                        className="bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        {startChatMutation.isPending ? 'Starting...' : 'Contact Support / Distributor'}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {conversations.map((c: any) => {
                      const otherUser = getOtherUser(c)
                      return (
                        <button 
                          key={c.id} 
                          onClick={() => setActiveChatId(c.id)}
                          className="w-full text-left p-3 rounded-xl hover:bg-slate-100 transition-colors flex gap-3 items-center"
                        >
                          <div className="w-10 h-10 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center flex-shrink-0 text-slate-500">
                            <UserIcon size={20} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center">
                              <span className="font-semibold text-sm text-slate-800 truncate">{otherUser?.name || 'Unknown'}</span>
                              <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                                {new Date(c.updated_at).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex justify-between items-center mt-0.5">
                              <span className="text-xs text-slate-500 truncate capitalize">{otherUser?.role}</span>
                              {c.unread_count > 0 && (
                                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                  {c.unread_count}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Active Chat View */}
            {activeChatId && (
              <div className="flex flex-col h-full">
                <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                  {messages.map((m: any, idx: number) => {
                    const isMe = m.sender_id === user.id
                    return (
                      <div key={m.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                          isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                        }`}>
                          <p className="whitespace-pre-wrap break-words">{m.message}</p>
                          <div className={`text-[9px] mt-1 text-right ${isMe ? 'text-blue-200' : 'text-slate-400'}`}>
                            {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 flex gap-2">
                  <input 
                    type="text" 
                    value={messageInput}
                    onChange={e => setMessageInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <button 
                    type="submit" 
                    disabled={!messageInput.trim() || sendMessageMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
                  >
                    <Send size={16} className="ml-0.5" />
                  </button>
                </form>
              </div>
            )}
            
          </div>
        </div>
      )}
    </div>
  )
}
