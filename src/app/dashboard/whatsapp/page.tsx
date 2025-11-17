'use client';

import { useState } from 'react';
import { Send, Search, Paperclip, MoreVertical, Phone, Video } from 'lucide-react';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'client';
  timestamp: string;
}

interface Conversation {
  id: number;
  name: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  score: number;
  avatar: string;
  messages: Message[];
}

const mockConversations: Conversation[] = [
  {
    id: 1,
    name: 'Pierre Martin',
    lastMessage: 'Parfait, je suis intéressé par votre offre',
    timestamp: '10:30',
    unread: 2,
    score: 95,
    avatar: 'PM',
    messages: [
      { id: 1, text: 'Bonjour, je cherche un site web pour mon restaurant', sender: 'client', timestamp: '10:15' },
      { id: 2, text: 'Bonjour Pierre ! Excellent timing, nous avons des offres spéciales pour les restaurants. Quel type de site recherchez-vous ?', sender: 'user', timestamp: '10:16' },
      { id: 3, text: 'Un site vitrine avec menu en ligne et réservation', sender: 'client', timestamp: '10:18' },
      { id: 4, text: 'Parfait ! Nous proposons un package complet : site responsive, module réservation, menu dynamique et SEO local à partir de 4 500€. Vous avez un moment cette semaine pour en discuter ?', sender: 'user', timestamp: '10:20' },
      { id: 5, text: 'Parfait, je suis intéressé par votre offre', sender: 'client', timestamp: '10:30' },
    ],
  },
  {
    id: 2,
    name: 'Sophie Dubois',
    lastMessage: 'Je peux voir des exemples ?',
    timestamp: 'Hier',
    unread: 0,
    score: 88,
    avatar: 'SD',
    messages: [
      { id: 1, text: 'Bonjour, j\'ai une boutique de mode et je veux un e-commerce', sender: 'client', timestamp: 'Hier 14:30' },
      { id: 2, text: 'Bonjour Sophie ! Nous sommes spécialisés dans les e-commerce pour la mode. Combien de produits environ ?', sender: 'user', timestamp: 'Hier 14:35' },
      { id: 3, text: 'Environ 200 produits pour commencer', sender: 'client', timestamp: 'Hier 14:40' },
      { id: 4, text: 'Je peux voir des exemples ?', sender: 'client', timestamp: 'Hier 15:00' },
    ],
  },
  {
    id: 3,
    name: 'Jean Dupont',
    lastMessage: 'D\'accord, merci',
    timestamp: 'Hier',
    unread: 0,
    score: 82,
    avatar: 'JD',
    messages: [
      { id: 1, text: 'Bonjour, je suis avocat et j\'ai besoin d\'un site vitrine', sender: 'client', timestamp: 'Hier 09:00' },
      { id: 2, text: 'Bonjour Jean ! Pour un cabinet d\'avocat, nous recommandons un site sobre et professionnel avec présentation des domaines de compétence. Budget envisagé ?', sender: 'user', timestamp: 'Hier 09:10' },
      { id: 3, text: 'D\'accord, merci', sender: 'client', timestamp: 'Hier 09:15' },
    ],
  },
  {
    id: 4,
    name: 'Marie Laurent',
    lastMessage: 'Oui pourquoi pas',
    timestamp: 'Mar',
    unread: 1,
    score: 76,
    avatar: 'ML',
    messages: [
      { id: 1, text: 'Salut, j\'ai un salon de coiffure', sender: 'client', timestamp: 'Mar 16:00' },
      { id: 2, text: 'Bonjour Marie ! Parfait, nous avons une solution avec prise de RDV en ligne. Vous utilisez déjà un logiciel de gestion ?', sender: 'user', timestamp: 'Mar 16:05' },
      { id: 3, text: 'Oui pourquoi pas', sender: 'client', timestamp: 'Mar 16:20' },
    ],
  },
  {
    id: 5,
    name: 'Luc Bernard',
    lastMessage: 'Combien ça coûte ?',
    timestamp: 'Lun',
    unread: 0,
    score: 70,
    avatar: 'LB',
    messages: [
      { id: 1, text: 'Bonjour, je cherche un site pour mon garage', sender: 'client', timestamp: 'Lun 11:00' },
      { id: 2, text: 'Bonjour Luc ! Site vitrine avec présentation des services, galerie photos et formulaire de contact ?', sender: 'user', timestamp: 'Lun 11:10' },
      { id: 3, text: 'Combien ça coûte ?', sender: 'client', timestamp: 'Lun 11:30' },
    ],
  },
];

const getScoreBadge = (score: number) => {
  if (score >= 90) return { label: 'TRES_CHAUD', color: 'bg-red-500' };
  if (score >= 75) return { label: 'CHAUD', color: 'bg-orange-500' };
  if (score >= 50) return { label: 'TIEDE', color: 'bg-yellow-500' };
  return { label: 'FROID', color: 'bg-blue-500' };
};

export default function WhatsAppPage() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation>(mockConversations[0]);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = mockConversations.filter((conv) =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            const badge = getScoreBadge(conv.score);
            return (
              <div
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition ${
                  selectedConversation.id === conv.id ? 'bg-violet-50' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-600 to-orange-500 flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">{conv.avatar}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">{conv.name}</h3>
                      <span className="text-xs text-gray-500 ml-2 flex-shrink-0">{conv.timestamp}</span>
                    </div>
                    <p className="text-sm text-gray-600 truncate mb-2">{conv.lastMessage}</p>
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 text-xs font-bold text-white ${badge.color} rounded`}>
                        {conv.score}
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
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-orange-500 flex items-center justify-center">
                <span className="text-white font-semibold text-sm">{selectedConversation.avatar}</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedConversation.name}</h3>
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2 py-0.5 text-xs font-bold text-white ${
                      getScoreBadge(selectedConversation.score).color
                    } rounded`}
                  >
                    Score: {selectedConversation.score}
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
                  {msg.timestamp}
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
      </div>
    </div>
  );
}
