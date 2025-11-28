'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Send, Search, Plus, Users as UsersIcon, X, Loader2, MessageCircle, User } from 'lucide-react';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar: string | null;
  status: string;
  position?: string;
  department?: string;
}

interface Conversation {
  id: string;
  name: string | null;
  isGroup: boolean;
  avatar: string | null;
  lastMessage: string | null;
  lastMessageAt: Date | null;
  unreadCount: number;
  participants: User[];
  lastMessageSender: string | null;
}

interface Message {
  id: string;
  content: string;
  sentAt: Date;
  users: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
  };
}

export default function MessagesPage() {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isAdmin = session?.user?.role === 'ADMIN';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/messages/conversations');
      const data = await res.json();
      setConversations(data.conversations || []);

      // Auto-sélectionner la première conversation
      if (data.conversations && data.conversations.length > 0 && !selectedConversation) {
        setSelectedConversation(data.conversations[0]);
      }
    } catch (error) {
      console.error('Erreur chargement conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedConversation]);

  const fetchAvailableUsers = async () => {
    try {
      const res = await fetch('/api/messages/users');
      const data = await res.json();
      setAvailableUsers(data.users || []);
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const res = await fetch(`/api/messages/conversations/${conversationId}`);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Erreur chargement messages:', error);
    }
  };

  const markAsRead = async (conversationId: string) => {
    try {
      await fetch(`/api/messages/conversations/${conversationId}`, {
        method: 'PUT',
      });

      // Mettre à jour localement
      setConversations(prev =>
        prev.map(c =>
          c.id === conversationId ? { ...c, unreadCount: 0 } : c
        )
      );
    } catch (error) {
      console.error('Erreur marquage comme lu:', error);
    }
  };

  useEffect(() => {
    fetchConversations();
    fetchAvailableUsers();
  }, [fetchConversations]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
      markAsRead(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedConversation || sending) return;

    setSending(true);
    try {
      const res = await fetch(`/api/messages/conversations/${selectedConversation.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: message }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, data.message]);
        setMessage('');

        // Mettre à jour la conversation
        await fetchConversations();
      }
    } catch (error) {
      console.error('Erreur envoi message:', error);
    } finally {
      setSending(false);
    }
  };

  // Pour les non-admins: créer conversation 1-to-1 directement
  const handleDirectConversation = async (userId: string) => {
    try {
      const res = await fetch('/api/messages/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantIds: [userId],
          isGroup: false,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        await fetchConversations();
        setSelectedConversation(data.conversation);
        setShowNewConversation(false);
      }
    } catch (error) {
      console.error('Erreur création conversation:', error);
    }
  };

  const handleCreateConversation = async () => {
    if (selectedUsers.length === 0) return;

    const isGroupConversation = isAdmin && selectedUsers.length > 1;

    // Pour les groupes admin, le nom est obligatoire
    if (isGroupConversation && !groupName.trim()) {
      return;
    }

    try {
      const res = await fetch('/api/messages/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantIds: selectedUsers,
          isGroup: isGroupConversation,
          name: isGroupConversation ? groupName.trim() : undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        await fetchConversations();
        setSelectedConversation(data.conversation);
        setShowNewConversation(false);
        setSelectedUsers([]);
        setGroupName('');
      }
    } catch (error) {
      console.error('Erreur création conversation:', error);
    }
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)] flex bg-gray-50">
      {/* Conversations List */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <MessageCircle className="h-6 w-6 text-violet-600" />
              Messagerie
            </h2>
            <button
              onClick={() => setShowNewConversation(true)}
              className="p-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
              title="Nouvelle conversation"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              placeholder="Rechercher..."
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Aucune conversation</p>
              <button
                onClick={() => setShowNewConversation(true)}
                className="mt-3 text-violet-600 hover:text-violet-700 font-medium text-sm"
              >
                Démarrer une conversation
              </button>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                className={`w-full p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 text-left ${
                  selectedConversation?.id === conv.id ? 'bg-violet-50 border-l-4 border-l-violet-600' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {conv.avatar ? (
                      <img
                        src={conv.avatar}
                        alt={conv.name || 'User'}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white font-semibold">
                        {conv.isGroup ? (
                          <UsersIcon className="h-6 w-6" />
                        ) : (
                          conv.name?.charAt(0).toUpperCase() || 'U'
                        )}
                      </div>
                    )}
                    {conv.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 bg-violet-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                        {conv.unreadCount}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">{conv.name || 'Sans nom'}</h3>
                      {conv.lastMessageAt && (
                        <span className="text-xs text-gray-500">
                          {new Date(conv.lastMessageAt).toLocaleDateString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>
                    {conv.lastMessage && (
                      <p className="text-sm text-gray-600 truncate">
                        {conv.lastMessageSender && conv.isGroup ? `${conv.lastMessageSender}: ` : ''}
                        {conv.lastMessage}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Messages Area */}
      {selectedConversation ? (
        <div className="flex-1 flex flex-col bg-white">
          {/* Conversation Header */}
          <div className="p-4 border-b border-gray-200 bg-white shadow-sm">
            <div className="flex items-center gap-3">
              {selectedConversation.avatar ? (
                <img
                  src={selectedConversation.avatar}
                  alt={selectedConversation.name || 'User'}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white font-semibold">
                  {selectedConversation.isGroup ? (
                    <UsersIcon className="h-5 w-5" />
                  ) : (
                    selectedConversation.name?.charAt(0).toUpperCase() || 'U'
                  )}
                </div>
              )}
              <div>
                <h3 className="font-semibold text-gray-900">{selectedConversation.name || 'Sans nom'}</h3>
                <p className="text-sm text-gray-500">
                  {selectedConversation.isGroup
                    ? `${selectedConversation.participants.length} participants`
                    : selectedConversation.participants.find(p => p.id !== session?.user?.id)?.email || ''
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((msg) => {
              const isOwn = msg.users.id === session?.user?.id;
              return (
                <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] ${isOwn ? 'order-1' : 'order-2'}`}>
                    {!isOwn && (
                      <p className="text-xs text-gray-500 mb-1 ml-2">
                        {msg.users.firstName} {msg.users.lastName}
                      </p>
                    )}
                    <div
                      className={`rounded-2xl px-4 py-2 ${
                        isOwn
                          ? 'bg-violet-600 text-white'
                          : 'bg-white border border-gray-200 text-gray-900'
                      }`}
                    >
                      <p className="text-sm break-words">{msg.content}</p>
                      <p className={`text-xs mt-1 ${isOwn ? 'text-violet-100' : 'text-gray-500'}`}>
                        {new Date(msg.sentAt).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Votre message..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                disabled={sending}
              />
              <button
                onClick={handleSendMessage}
                disabled={!message.trim() || sending}
                className="px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {sending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    <span>Envoyer</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Sélectionnez une conversation pour commencer</p>
          </div>
        </div>
      )}

      {/* Modal Nouvelle Conversation */}
      {showNewConversation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-gray-900">Nouvelle conversation</h3>
              <button
                onClick={() => {
                  setShowNewConversation(false);
                  setSelectedUsers([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <p className="text-sm text-gray-600 mb-4">
                {isAdmin
                  ? 'Sélectionnez un ou plusieurs collègues pour démarrer une conversation'
                  : 'Sélectionnez un collègue pour démarrer une conversation'
                }
              </p>

              {/* Champ nom du groupe - uniquement pour admin avec plusieurs sélections */}
              {isAdmin && selectedUsers.length > 1 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom du groupe *
                  </label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Ex: Groupe Marketing"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                </div>
              )}

              <div className="space-y-2">
                {availableUsers.map((user) => (
                  isAdmin ? (
                    // Admin: checkboxes pour sélection multiple
                    <label
                      key={user.id}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers([...selectedUsers, user.id]);
                          } else {
                            setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                          }
                        }}
                        className="w-5 h-5 text-violet-600 rounded focus:ring-violet-500"
                      />
                      {user.avatar ? (
                        <img src={user.avatar} alt={`${user.firstName} ${user.lastName}`} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white font-semibold">
                          {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </label>
                  ) : (
                    // Non-admin: clic direct pour créer conversation 1-to-1
                    <button
                      key={user.id}
                      onClick={() => handleDirectConversation(user.id)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg text-left"
                    >
                      {user.avatar ? (
                        <img src={user.avatar} alt={`${user.firstName} ${user.lastName}`} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white font-semibold">
                          {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </button>
                  )
                ))}
              </div>
            </div>

            {/* Footer avec boutons - uniquement pour admin */}
            {isAdmin && (
              <div className="p-6 border-t border-gray-200 flex gap-3">
                <button
                  onClick={handleCreateConversation}
                  disabled={selectedUsers.length === 0 || (selectedUsers.length > 1 && !groupName.trim())}
                  className="flex-1 px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {selectedUsers.length > 1 ? 'Créer le groupe' : 'Créer la conversation'}
                </button>
                <button
                  onClick={() => {
                    setShowNewConversation(false);
                    setSelectedUsers([]);
                    setGroupName('');
                  }}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Annuler
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
