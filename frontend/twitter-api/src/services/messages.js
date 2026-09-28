import api from './api'

export const MESSAGES_CHANGED = 'blink:messages-changed'
export const notifyMessagesChanged = () => window.dispatchEvent(new Event(MESSAGES_CHANGED))
export const openConversation = userId => api.post(`/conversations/with/${userId}`).then(r => r.data)
export const listConversations = (page, signal) => api.get('/conversations', { params: { page, size: 20 }, signal }).then(r => r.data)
export const getConversation = (id, signal) => api.get(`/conversations/${id}`, { signal }).then(r => r.data)
export const getMessages = (id, before, signal) => api.get(`/conversations/${id}/messages`, { params: { before, size: 30 }, signal }).then(r => r.data)
export const sendMessage = (id, content) => api.post(`/conversations/${id}/messages`, { content }).then(r => r.data)
export const markMessagesRead = (id, through, signal) => api.put(`/conversations/${id}/read`, null, { params: { through }, signal })
export const getUnreadCount = signal => api.get('/conversations/unread-count', { signal }).then(r => r.data.count)
