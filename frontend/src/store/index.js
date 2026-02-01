import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (userData, token) => {
        console.log('Login called with user:', userData)
        set({ user: userData, token, isAuthenticated: true })
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false })
      },

      updateUser: (userData) => {
        set({ user: { ...get().user, ...userData } })
      },
    }),
    {
      name: 'ascendra-auth',
    }
  )
)

export const useChatStore = create((set, get) => ({
  messages: [],
  conversations: [],
  currentConversationId: null,
  isLoading: false,
  showReasoning: true,

  addMessage: (message) => {
    set({ messages: [...get().messages, message] })
  },

  setMessages: (messages) => {
    set({ messages })
  },

  setConversations: (conversations) => {
    set({ conversations })
  },

  setCurrentConversation: (id) => {
    set({ currentConversationId: id })
  },

  setLoading: (isLoading) => {
    set({ isLoading })
  },

  toggleReasoning: () => {
    set({ showReasoning: !get().showReasoning })
  },

  clearChat: () => {
    set({ messages: [], currentConversationId: null })
  },
}))

export const useUIStore = create((set) => ({
  sidebarOpen: true,
  theme: 'dark',

  toggleSidebar: () => {
    set((state) => ({ sidebarOpen: !state.sidebarOpen }))
  },

  setSidebarOpen: (open) => {
    set({ sidebarOpen: open })
  },
}))
