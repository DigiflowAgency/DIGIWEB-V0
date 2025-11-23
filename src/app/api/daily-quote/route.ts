import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/daily-quote - Récupérer la citation du jour
export async function GET(_request: NextRequest) {
  try {
    // Créer une date pour aujourd'hui à minuit (UTC)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Vérifier si une citation existe déjà pour aujourd'hui
    let dailyQuote = await prisma.daily_quotes.findUnique({
      where: { date: today },
    });

    // Si pas de citation pour aujourd'hui, en créer une nouvelle
    if (!dailyQuote) {
      try {
        // Fetch depuis l'API ZenQuotes (gratuite)
        const response = await fetch('https://zenquotes.io/api/today');

        if (!response.ok) {
          throw new Error('Erreur API ZenQuotes');
        }

        const data = await response.json();
        const quoteData = data[0]; // ZenQuotes retourne un array

        // Sauvegarder en BDD
        dailyQuote = await prisma.daily_quotes.create({
          data: {
            id: `QUOTE-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            quote: quoteData.q,
            author: quoteData.a,
            date: today,
          },
        });
      } catch (apiError) {
        console.error('Erreur lors du fetch de la citation:', apiError);

        // Fallback: citation par défaut
        dailyQuote = await prisma.daily_quotes.create({
          data: {
            id: `QUOTE-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            quote: "Le succès n'est pas la clé du bonheur. Le bonheur est la clé du succès. Si vous aimez ce que vous faites, vous réussirez.",
            author: "Albert Schweitzer",
            date: today,
          },
        });
      }
    }

    return NextResponse.json(dailyQuote);
  } catch (error) {
    console.error('Erreur GET /api/daily-quote:', error);

    // En cas d'erreur totale, retourner une citation par défaut sans BDD
    return NextResponse.json({
      id: 'fallback',
      quote: "Chaque jour est une nouvelle opportunité de grandir et de s'améliorer.",
      author: "Anonyme",
      date: new Date(),
    });
  }
}
