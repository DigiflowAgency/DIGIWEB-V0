import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { aiGenerationSchema } from '@/lib/projects/validators';
import {
  PROJECT_GENERATION_SYSTEM_PROMPT,
  PROJECT_IMPORT_SYSTEM_PROMPT,
  getGenerationPrompt,
  getImportPrompt,
  parseGenerationResponse,
  parseImportResponse,
  validateGenerationResponse,
  validateImportResponse,
} from '@/lib/projects/ai-prompts';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

const anthropic = new Anthropic();

// POST /api/projects/[id]/ai/generate - Generate project structure with AI
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
    const data = aiGenerationSchema.parse(body);

    // Check if API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'Clé API Anthropic non configurée' }, { status: 500 });
    }

    const isImportMode = data.mode === 'import';
    const systemPrompt = isImportMode ? PROJECT_IMPORT_SYSTEM_PROMPT : PROJECT_GENERATION_SYSTEM_PROMPT;
    const userPrompt = isImportMode
      ? getImportPrompt(data.prompt, data.projectType)
      : getGenerationPrompt(data.prompt, data.projectType);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 16384,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    console.log('AI response received, stop_reason:', message.stop_reason);

    // Extract text content
    const textContent = message.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      return NextResponse.json({ error: 'Pas de réponse textuelle de l\'IA' }, { status: 500 });
    }

    if (isImportMode) {
      const response = parseImportResponse(textContent.text);
      if (!response) {
        return NextResponse.json({
          error: 'Impossible de parser la réponse de l\'IA',
          rawResponse: textContent.text,
        }, { status: 500 });
      }

      const validationErrors = validateImportResponse(response);
      if (validationErrors.length > 0) {
        return NextResponse.json({
          error: 'Réponse invalide de l\'IA',
          validationErrors,
          response,
        }, { status: 400 });
      }

      return NextResponse.json({ ...response, mode: 'import' });
    }

    const response = parseGenerationResponse(textContent.text);
    if (!response) {
      return NextResponse.json({
        error: 'Impossible de parser la réponse de l\'IA',
        rawResponse: textContent.text,
      }, { status: 500 });
    }

    const validationErrors = validateGenerationResponse(response);
    if (validationErrors.length > 0) {
      return NextResponse.json({
        error: 'Réponse invalide de l\'IA',
        validationErrors,
        response,
      }, { status: 400 });
    }

    return NextResponse.json({ ...response, mode: 'new' });
  } catch (error) {
    console.error('Error generating with AI:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 });
    }
    if (error instanceof Anthropic.APIError) {
      return NextResponse.json({ error: `Erreur API Claude: ${error.message}` }, { status: 500 });
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
