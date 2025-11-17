'use client';

import { useState } from 'react';
import { Send, Search, Paperclip, MoreVertical, Phone, Video, Loader2 } from 'lucide-react';
import { useWhatsApp, WhatsAppConversation } from '@/hooks/useWhatsApp';

const getScoreBadge = (score: number) => {
  if (score >= 90) return { label: 'TRES_CHAUD', color: 'bg-red-500' };
  if (score >= 75) return { label: 'CHAUD', color: 'bg-orange-500' };
  if (score >= 50) return { label: 'TIEDE', color: 'bg-yellow-500' };
  return { label: 'FROID', color: 'bg-blue-500' };
};

export default function WhatsAppPage() {
  const { conversations, isLoading, isError } = useWhatsApp();
  const [selectedConversation, setSelectedConversation] = useState<WhatsAppConversation | null>(null);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-orange-600" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">Erreur lors du chargement</p>
      </div>
    );
  }

  const filteredConversations = conversations.filter((conv) =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Set initial selected conversation if not set
  if (!selectedConversation && filteredConversations.length > 0) {
    setSelectedConversation(filteredConversations[0]);
  }

  const handleSendMessage = () => {
    if (message.trim()) {
      // Logique d'envoi du message (mock)
      console.log('Message envoyé:', message);
      setMessage('');
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] flex gradient-mesh">
      {/* Conversations List */}
      <div className="w-96 glass-dark border-r border-white/20 flex flex-col shadow-premium">
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <h2 className="text-xl font-bold bg-gradient-to-r from-violet-700 to-orange-500 bg-clip-text text-transparent mb-3">WhatsApp Business</h2>
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-premium w-full text-sm"
              placeholder="Rechercher une conversation..."
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map((conv) => {
            const badge = getScoreBadge(conv.score || 0);
            const initials = conv.avatar || conv.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
            return (
              <div
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition ${
                  selectedConversation?.id === conv.id ? 'bg-violet-50' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-600 to-orange-500 flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">{initials}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">{conv.name}</h3>
                      <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                        {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate mb-2">{conv.lastMessage || 'Aucun message'}</p>
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 text-xs font-bold text-white ${badge.color} rounded`}>
                        {conv.score || 0}
                      </span>
                      {conv.unread > 0 && (
                        <span className="px-2 py-0.5 text-xs font-bold bg-violet-600 text-white rounded-full">
                          {conv.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-orange-500 flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {selectedConversation.avatar || selectedConversation.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{selectedConversation.name}</h3>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-0.5 text-xs font-bold text-white ${
                          getScoreBadge(selectedConversation.score || 0).color
                        } rounded`}
                      >
                        Score: {selectedConversation.score || 0}
                      </span>
                      <span className="text-xs text-green-600">En ligne</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">
                    <Phone className="h-5 w-5" />
                  </button>
                  <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">
                    <Video className="h-5 w-5" />
                  </button>
                  <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {selectedConversation.messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-md ${msg.sender === 'user' ? 'order-2' : 'order-1'}`}>
                <div
                  className={`px-4 py-3 rounded-2xl ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-violet-600 to-orange-500 text-white'
                      : 'bg-white text-gray-900 shadow-sm'
                  }`}
                >
                  <p className="text-sm">{msg.text}</p>
                </div>
                <p className={`text-xs text-gray-500 mt-1 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                  {new Date(msg.sentAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">
              <Paperclip className="h-5 w-5" />
            </button>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-full text-sm focus:ring-2 focus:ring-violet-600 focus:border-transparent outline-none"
              placeholder="Écrivez votre message..."
            />
            <button
              onClick={handleSendMessage}
              className="p-3 bg-gradient-to-r from-violet-600 to-orange-500 text-white rounded-full hover:from-violet-700 hover:to-orange-600 transition shadow-sm"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500">Sélectionnez une conversation pour commencer</p>
          </div>
        )}
      </div>
    </div>
  );
}
