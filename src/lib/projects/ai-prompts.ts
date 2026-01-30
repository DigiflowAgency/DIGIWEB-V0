// AI Prompts for Project Generation with Claude

import type { ProjectType, AIGenerationResponse, AIEstimateResponse, AIImportResponse, AITaskStatus } from '@/types/projects';

// ============================================
// SYSTEM PROMPTS
// ============================================

export const PROJECT_GENERATION_SYSTEM_PROMPT = `Tu es un expert en gestion de projet agile et en développement logiciel.
Tu aides à structurer des projets en créant des epics, user stories et tâches techniques.

Règles importantes:
1. Génère une structure réaliste et professionnelle
2. Les epics représentent de grandes fonctionnalités ou modules
3. Chaque epic contient des user stories au format "En tant que [utilisateur], je veux [action] afin de [bénéfice]"
4. Les tâches techniques décomposent les stories en travail concret
5. Les estimations en story points suivent la suite de Fibonacci (1, 2, 3, 5, 8, 13, 21)
6. Sois concis mais complet

Réponds UNIQUEMENT en JSON valide, sans texte avant ou après.`;

export const PROJECT_IMPORT_SYSTEM_PROMPT = `Tu es un expert en gestion de projet.
Tu aides à importer des projets existants dans un système de gestion.

Règles importantes:
1. Analyse le récapitulatif du projet existant fourni par l'utilisateur
2. Identifie les epics, stories et tâches mentionnées
3. DÉTERMINE LE STATUT de chaque élément basé sur le contexte:
   - "DONE" si explicitement terminé/complété/livré/fait/fini
   - "IN_PROGRESS" si en cours/commencé/en développement
   - "TODO" si à faire/pas commencé/planifié/prévu
4. Estime la progression globale du projet (0-100%)
5. Calcule les statistiques (tâches terminées, en cours, à faire)
6. Les estimations en story points suivent la suite de Fibonacci (1, 2, 3, 5, 8, 13, 21)

Réponds UNIQUEMENT en JSON valide, sans texte avant ou après.`;

export const PROJECT_ESTIMATION_SYSTEM_PROMPT = `Tu es un expert en estimation de projets logiciels.
Tu estimes les tâches en story points (Fibonacci: 1, 2, 3, 5, 8, 13, 21) et en heures.

Critères d'estimation:
- 1 point: Tâche triviale, moins de 2h
- 2 points: Tâche simple, 2-4h
- 3 points: Tâche modérée, demi-journée
- 5 points: Tâche significative, une journée
- 8 points: Tâche complexe, 1-2 jours
- 13 points: Tâche très complexe, 2-3 jours
- 21 points: Epic-sized, devrait être découpée

Réponds UNIQUEMENT en JSON valide, sans texte avant ou après.`;

// ============================================
// USER PROMPTS
// ============================================

export function getGenerationPrompt(
  projectDescription: string,
  projectType?: ProjectType
): string {
  const typeContext = projectType
    ? `\n\nType de projet: ${getProjectTypeDescription(projectType)}`
    : '';

  return `Génère la structure complète du projet suivant:

${projectDescription}${typeContext}

Réponds avec ce format JSON exact:
{
  "projectName": "Nom suggéré du projet",
  "projectDescription": "Description résumée en 1-2 phrases",
  "epics": [
    {
      "title": "Titre de l'epic",
      "description": "Description de l'epic",
      "color": "#HEXCOLOR",
      "stories": [
        {
          "title": "En tant que X, je veux Y afin de Z",
          "description": "Description détaillée",
          "type": "STORY",
          "priority": "MEDIUM",
          "storyPoints": 5,
          "acceptanceCriteria": "- Critère 1\\n- Critère 2",
          "subtasks": [
            {
              "title": "Tâche technique",
              "type": "TASK",
              "storyPoints": 2
            }
          ]
        }
      ]
    }
  ],
  "estimatedTotalPoints": 100
}`;
}

export function getImportPrompt(
  projectDescription: string,
  projectType?: ProjectType
): string {
  const typeContext = projectType
    ? `\n\nType de projet: ${getProjectTypeDescription(projectType)}`
    : '';

  return `Importe ce projet existant en analysant son état d'avancement:

${projectDescription}${typeContext}

Réponds avec ce format JSON exact:
{
  "projectName": "Nom du projet",
  "projectDescription": "Description résumée en 1-2 phrases",
  "projectProgress": 45,
  "epics": [
    {
      "title": "Titre de l'epic",
      "description": "Description de l'epic",
      "color": "#HEXCOLOR",
      "status": "IN_PROGRESS",
      "progress": 60,
      "tasks": [
        {
          "title": "Tâche terminée",
          "description": "Description",
          "type": "TASK",
          "priority": "MEDIUM",
          "storyPoints": 3,
          "status": "DONE",
          "completedAt": "2024-01-15T00:00:00Z"
        },
        {
          "title": "Tâche en cours",
          "type": "TASK",
          "priority": "HIGH",
          "storyPoints": 5,
          "status": "IN_PROGRESS"
        },
        {
          "title": "Tâche à faire",
          "type": "TASK",
          "priority": "LOW",
          "storyPoints": 2,
          "status": "TODO"
        }
      ]
    }
  ],
  "stats": {
    "totalTasks": 10,
    "completedTasks": 4,
    "inProgressTasks": 2,
    "todoTasks": 4
  },
  "estimatedTotalPoints": 50
}`;
}

export function getEstimationPrompt(
  taskTitle: string,
  taskDescription?: string,
  taskType?: string
): string {
  return `Estime cette tâche:

Titre: ${taskTitle}
${taskDescription ? `Description: ${taskDescription}` : ''}
${taskType ? `Type: ${taskType}` : ''}

Réponds avec ce format JSON exact:
{
  "storyPoints": 5,
  "estimatedHours": 8,
  "confidence": 0.8,
  "reasoning": "Explication courte de l'estimation"
}`;
}

export function getSplitTaskPrompt(
  taskTitle: string,
  taskDescription?: string,
  currentPoints?: number
): string {
  return `Cette tâche est trop grosse et devrait être découpée:

Titre: ${taskTitle}
${taskDescription ? `Description: ${taskDescription}` : ''}
${currentPoints ? `Points actuels: ${currentPoints}` : ''}

Propose un découpage en sous-tâches plus petites (max 8 points chacune).

Réponds avec ce format JSON exact:
{
  "reasoning": "Pourquoi ce découpage",
  "subtasks": [
    {
      "title": "Sous-tâche 1",
      "description": "Description",
      "type": "TASK",
      "storyPoints": 3
    }
  ],
  "totalPoints": 13
}`;
}

// ============================================
// HELPERS
// ============================================

function getProjectTypeDescription(type: ProjectType): string {
  const descriptions: Record<ProjectType, string> = {
    WEB: 'Site web (vitrine, institutionnel, blog)',
    MOBILE: 'Application mobile (iOS, Android, hybride)',
    ECOMMERCE: 'Boutique en ligne / E-commerce',
    SAAS: 'Application SaaS (Software as a Service)',
    BRANDING: 'Projet de branding / identité visuelle',
    MARKETING: 'Campagne marketing digital',
    OTHER: 'Autre type de projet',
  };
  return descriptions[type] || type;
}

// ============================================
// RESPONSE PARSERS
// ============================================

function extractJSON(response: string): string {
  let jsonStr = response.trim();

  // 1. Try to extract from markdown code blocks
  const codeBlockMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1].trim();
  }

  // 2. If still not valid JSON, try to find JSON object in the response
  if (!jsonStr.startsWith('{')) {
    const jsonStart = response.indexOf('{');
    const jsonEnd = response.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      jsonStr = response.substring(jsonStart, jsonEnd + 1);
    }
  }

  return jsonStr;
}

export function parseGenerationResponse(response: string): AIGenerationResponse | null {
  try {
    const jsonStr = extractJSON(response);
    console.log('Parsing generation response, extracted JSON length:', jsonStr.length);

    const parsed = JSON.parse(jsonStr);

    // Validate structure
    if (!parsed.epics || !Array.isArray(parsed.epics)) {
      console.error('Invalid generation response: missing epics array');
      return null;
    }

    return {
      projectName: parsed.projectName || undefined,
      projectDescription: parsed.projectDescription || undefined,
      epics: parsed.epics.map((epic: Record<string, unknown>) => ({
        title: String(epic.title || ''),
        description: String(epic.description || ''),
        color: String(epic.color || '#8B5CF6'),
        stories: Array.isArray(epic.stories) ? epic.stories.map((story: Record<string, unknown>) => ({
          title: String(story.title || ''),
          description: String(story.description || ''),
          type: String(story.type || 'STORY'),
          priority: String(story.priority || 'MEDIUM'),
          storyPoints: Number(story.storyPoints) || undefined,
          acceptanceCriteria: String(story.acceptanceCriteria || ''),
          subtasks: Array.isArray(story.subtasks) ? story.subtasks.map((sub: Record<string, unknown>) => ({
            title: String(sub.title || ''),
            type: 'SUBTASK' as const,
            storyPoints: Number(sub.storyPoints) || undefined,
          })) : [],
        })) : [],
      })),
      estimatedTotalPoints: Number(parsed.estimatedTotalPoints) || undefined,
    };
  } catch (error) {
    console.error('Failed to parse AI generation response:', error);
    return null;
  }
}

export function parseImportResponse(response: string): AIImportResponse | null {
  try {
    const jsonStr = extractJSON(response);
    console.log('Parsing import response, extracted JSON length:', jsonStr.length);

    const parsed = JSON.parse(jsonStr);

    if (!parsed.epics || !Array.isArray(parsed.epics)) {
      console.error('Invalid import response: missing epics array. Got:', Object.keys(parsed));
      return null;
    }

    const parseStatus = (status: unknown): AITaskStatus => {
      const s = String(status || 'TODO').toUpperCase();
      if (s === 'DONE' || s === 'IN_PROGRESS' || s === 'TODO') return s;
      return 'TODO';
    };

    let totalTasks = 0;
    let completedTasks = 0;
    let inProgressTasks = 0;
    let todoTasks = 0;

    const epics = parsed.epics.map((epic: Record<string, unknown>) => {
      const tasks = Array.isArray(epic.tasks) ? epic.tasks.map((task: Record<string, unknown>) => {
        const taskStatus = parseStatus(task.status);
        totalTasks++;
        if (taskStatus === 'DONE') completedTasks++;
        else if (taskStatus === 'IN_PROGRESS') inProgressTasks++;
        else todoTasks++;

        const subtasks = Array.isArray(task.subtasks) ? task.subtasks.map((sub: Record<string, unknown>) => {
          const subStatus = parseStatus(sub.status);
          totalTasks++;
          if (subStatus === 'DONE') completedTasks++;
          else if (subStatus === 'IN_PROGRESS') inProgressTasks++;
          else todoTasks++;

          return {
            title: String(sub.title || ''),
            description: sub.description ? String(sub.description) : undefined,
            type: 'SUBTASK' as const,
            priority: String(sub.priority || 'MEDIUM') as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
            storyPoints: Number(sub.storyPoints) || undefined,
            status: subStatus,
            completedAt: sub.completedAt ? String(sub.completedAt) : undefined,
          };
        }) : [];

        return {
          title: String(task.title || ''),
          description: task.description ? String(task.description) : undefined,
          type: String(task.type || 'TASK') as 'STORY' | 'FEATURE' | 'TASK' | 'BUG' | 'IMPROVEMENT' | 'SUBTASK',
          priority: String(task.priority || 'MEDIUM') as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
          storyPoints: Number(task.storyPoints) || undefined,
          status: taskStatus,
          completedAt: task.completedAt ? String(task.completedAt) : undefined,
          subtasks: subtasks.length > 0 ? subtasks : undefined,
        };
      }) : [];

      const epicStatus = parseStatus(epic.status);

      return {
        title: String(epic.title || ''),
        description: epic.description ? String(epic.description) : undefined,
        color: String(epic.color || '#8B5CF6'),
        status: epicStatus,
        progress: Number(epic.progress) || 0,
        tasks,
      };
    });

    const projectProgress = totalTasks > 0
      ? Math.round((completedTasks / totalTasks) * 100)
      : Number(parsed.projectProgress) || 0;

    return {
      projectName: parsed.projectName ? String(parsed.projectName) : undefined,
      projectDescription: parsed.projectDescription ? String(parsed.projectDescription) : undefined,
      projectProgress,
      epics,
      stats: {
        totalTasks,
        completedTasks,
        inProgressTasks,
        todoTasks,
      },
      estimatedTotalPoints: Number(parsed.estimatedTotalPoints) || undefined,
    };
  } catch (error) {
    console.error('Failed to parse AI import response:', error);
    return null;
  }
}

export function parseEstimationResponse(response: string): AIEstimateResponse | null {
  try {
    let jsonStr = response;
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const parsed = JSON.parse(jsonStr);

    return {
      storyPoints: Number(parsed.storyPoints) || 3,
      estimatedHours: Number(parsed.estimatedHours) || 4,
      confidence: Number(parsed.confidence) || 0.7,
      reasoning: String(parsed.reasoning || ''),
    };
  } catch (error) {
    console.error('Failed to parse AI estimation response:', error);
    return null;
  }
}

// ============================================
// VALIDATION
// ============================================

export function validateGenerationResponse(response: AIGenerationResponse): string[] {
  const errors: string[] = [];

  if (!response.epics || response.epics.length === 0) {
    errors.push('Aucun epic généré');
  }

  response.epics.forEach((epic, i) => {
    if (!epic.title) {
      errors.push(`Epic ${i + 1}: titre manquant`);
    }
    if (!epic.stories || epic.stories.length === 0) {
      errors.push(`Epic "${epic.title}": aucune story`);
    }
  });

  return errors;
}

export function validateImportResponse(response: AIImportResponse): string[] {
  const errors: string[] = [];

  if (!response.epics || response.epics.length === 0) {
    errors.push('Aucun epic importé');
  }

  response.epics.forEach((epic, i) => {
    if (!epic.title) {
      errors.push(`Epic ${i + 1}: titre manquant`);
    }
    if (!epic.tasks || epic.tasks.length === 0) {
      errors.push(`Epic "${epic.title}": aucune tâche`);
    }
  });

  return errors;
}
