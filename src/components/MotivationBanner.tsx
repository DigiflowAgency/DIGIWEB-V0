'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Quote } from 'lucide-react';

interface DailyQuote {
  id: string;
  quote: string;
  author: string;
  date: string;
}

export default function MotivationBanner() {
  const [quote, setQuote] = useState<DailyQuote | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDailyQuote();
  }, []);

  const fetchDailyQuote = async () => {
    try {
      const res = await fetch('/api/daily-quote');
      const data = await res.json();
      setQuote(data);
    } catch (error) {
      console.error('Erreur chargement citation:', error);
      // Citation de fallback
      setQuote({
        id: 'fallback',
        quote: "Chaque jour est une nouvelle opportunité de grandir et de s'améliorer.",
        author: "Anonyme",
        date: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 text-white py-3 px-6 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-center">
          <div className="animate-pulse flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm">Chargement de votre dose de motivation...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!quote) return null;

  return (
    <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 text-white py-4 px-6 shadow-lg relative overflow-hidden">
      {/* Effet de brillance */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-shimmer"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex items-start gap-4">
          {/* Icône */}
          <div className="flex-shrink-0 mt-1">
            <div className="bg-white/20 rounded-full p-2 backdrop-blur-sm">
              <Sparkles className="h-5 w-5 text-yellow-300 animate-pulse" />
            </div>
          </div>

          {/* Contenu */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-violet-200">
                💪 Citation du Jour
              </span>
              <span className="text-xs text-violet-200">•</span>
              <span className="text-xs text-violet-200">
                {new Date(quote.date).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </span>
            </div>

            <div className="flex items-start gap-3">
              <Quote className="h-6 w-6 text-violet-200 flex-shrink-0 mt-1 opacity-50" />
              <div>
                <p className="text-lg md:text-xl font-medium leading-relaxed italic mb-2">
                  {quote.quote}
                </p>
                <p className="text-sm text-violet-100 font-semibold">
                  — {quote.author}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Animation CSS pour l'effet de brillance */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%) skewX(-12deg);
          }
          100% {
            transform: translateX(200%) skewX(-12deg);
          }
        }
        .animate-shimmer {
          animation: shimmer 8s infinite;
        }
      `}</style>
    </div>
  );
}
