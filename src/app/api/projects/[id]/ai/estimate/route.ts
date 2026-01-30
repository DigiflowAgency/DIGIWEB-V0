import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { aiEstimateSchema } from '@/lib/projects/validators';
import {
  PROJECT_ESTIMATION_SYSTEM_PROMPT,
  getEstimationPrompt,
  parseEstimationResponse,
} from '@/lib/projects/ai-prompts';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

const anthropic = new Anthropic();

// POST /api/projects/[id]/ai/estimate - Estimate task story points with AI
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const data = aiEstimateSchema.parse(body);

    // Check if API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'Clé API Anthropic non configurée' }, { status: 500 });
    }

    const userPrompt = getEstimationPrompt(data.taskTitle, data.taskDescription, data.taskType);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      system: PROJECT_ESTIMATION_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    // Extract text content
    const textContent = message.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      return NextResponse.json({ error: 'Pas de réponse textuelle de l\'IA' }, { status: 500 });
    }

    const response = parseEstimationResponse(textContent.text);
    if (!response) {
      return NextResponse.json({
        error: 'Impossible de parser la réponse de l\'IA',
        rawResponse: textContent.text,
      }, { status: 500 });
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error estimating with AI:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 });
    }
    if (error instanceof Anthropic.APIError) {
      return NextResponse.json({ error: `Erreur API Claude: ${error.message}` }, { status: 500 });
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
