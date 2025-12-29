'use client';

import { useState } from 'react';
import { X, Phone, Video, Mail, Calendar, Loader2, Check } from 'lucide-react';

type ActivityType = 'APPEL' | 'EMAIL' | 'REUNION' | 'VISIO';
type ActivityOutcome = 'ANSWERED' | 'VOICEMAIL' | 'NO_ANSWER' | 'CALLBACK' | 'PROPOSAL_SENT';
type Temperature = 'HOT' | 'WARM' | 'COLD';
type NextAction = 'CALLBACK' | 'SEND_QUOTE' | 'MEETING' | 'FOLLOWUP' | 'CLOSE';
type MainObjection = 'PRICE' | 'TIMING' | 'COMPETITOR' | 'NO_NEED' | 'OTHER';

interface ActivityQuickLogProps {
  dealId: string;
  contactId?: string | null;
  type: ActivityType;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const TYPE_CONFIG: Record<ActivityType, { icon: typeof Phone; label: string; color: string }> = {
  APPEL: { icon: Phone, label: 'Logger un appel', color: 'violet' },
  EMAIL: { icon: Mail, label: 'Logger un email', color: 'blue' },
  REUNION: { icon: Calendar, label: 'Logger un RDV', color: 'green' },
  VISIO: { icon: Video, label: 'Logger une visio', color: 'purple' },
};

const OUTCOME_OPTIONS: { value: ActivityOutcome; label: string; emoji: string }[] = [
  { value: 'ANSWERED', label: 'Repondu', emoji: '✅' },
  { value: 'NO_ANSWER', label: 'Pas de reponse', emoji: '📵' },
  { value: 'VOICEMAIL', label: 'Messagerie vocale', emoji: '📱' },
  { value: 'CALLBACK', label: 'Rappel demande', emoji: '🔄' },
  { value: 'PROPOSAL_SENT', label: 'Proposition envoyee', emoji: '📧' },
];

const TEMPERATURE_OPTIONS: { value: Temperature; label: string; emoji: string }[] = [
  { value: 'HOT', label: 'Chaud', emoji: '🔥' },
  { value: 'WARM', label: 'Tiede', emoji: '🌡️' },
  { value: 'COLD', label: 'Froid', emoji: '❄️' },
];

const NEXT_ACTION_OPTIONS: { value: NextAction; label: string }[] = [
  { value: 'CALLBACK', label: 'Rappeler' },
  { value: 'SEND_QUOTE', label: 'Envoyer devis' },
  { value: 'MEETING', label: 'Planifier RDV' },
  { value: 'FOLLOWUP', label: 'Relance' },
  { value: 'CLOSE', label: 'Cloturer' },
];

const OBJECTION_OPTIONS: { value: MainObjection; label: string }[] = [
  { value: 'PRICE', label: 'Prix' },
  { value: 'TIMING', label: 'Timing' },
  { value: 'COMPETITOR', label: 'Concurrent' },
  { value: 'NO_NEED', label: 'Pas de besoin' },
  { value: 'OTHER', label: 'Autre' },
];

const DURATION_OPTIONS = [
  { value: 5, label: '5 min' },
  { value: 10, label: '10 min' },
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1h' },
  { value: 90, label: '1h30' },
];

export default function ActivityQuickLog({
  dealId,
  contactId,
  type,
  isOpen,
  onClose,
  onSuccess,
}: ActivityQuickLogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [outcome, setOutcome] = useState<ActivityOutcome | ''>('');
  const [duration, setDuration] = useState<number | null>(null);
  const [resultNotes, setResultNotes] = useState('');
  const [temperature, setTemperature] = useState<Temperature | ''>('');
  const [budgetDiscussed, setBudgetDiscussed] = useState<boolean | null>(null);
  const [decisionMaker, setDecisionMaker] = useState<boolean | null>(null);
  const [mainObjection, setMainObjection] = useState<MainObjection | ''>('');
  const [nextAction, setNextAction] = useState<NextAction | ''>('');
  const [nextActionDate, setNextActionDate] = useState('');
  const [showQualification, setShowQualification] = useState(false);
  const [showNextAction, setShowNextAction] = useState(false);

  const config = TYPE_CONFIG[type];
  const Icon = config.icon;

  const resetForm = () => {
    setOutcome('');
    setDuration(null);
    setResultNotes('');
    setTemperature('');
    setBudgetDiscussed(null);
    setDecisionMaker(null);
    setMainObjection('');
    setNextAction('');
    setNextActionDate('');
    setShowQualification(false);
    setShowNextAction(false);
  };

  const handleSubmit = async () => {
    if (!outcome && type === 'APPEL') return;

    setIsSubmitting(true);
    try {
      const now = new Date();
      const data: Record<string, any> = {
        title: `${config.label.replace('Logger ', '')} - ${now.toLocaleDateString('fr-FR')}`,
        type,
        status: 'COMPLETEE',
        scheduledAt: now.toISOString(),
        completedAt: now.toISOString(),
        dealId,
        contactId: contactId || undefined,
        outcome: outcome || undefined,
        duration: duration || undefined,
        resultNotes: resultNotes || undefined,
        temperature: temperature || undefined,
        budgetDiscussed,
        decisionMaker,
        mainObjection: mainObjection || undefined,
        nextAction: nextAction || undefined,
        nextActionDate: nextActionDate ? new Date(nextActionDate).toISOString() : undefined,
      };

      // Clean undefined values
      Object.keys(data).forEach(key => {
        if (data[key] === undefined || data[key] === '') {
          delete data[key];
        }
      });

      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la creation');
      }

      resetForm();
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'enregistrement de l\'activite');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b border-gray-200 bg-${config.color}-50`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 bg-${config.color}-100 rounded-lg`}>
              <Icon className={`h-5 w-5 text-${config.color}-600`} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{config.label}</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-lg transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Resultat (pour appels) */}
          {type === 'APPEL' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resultat *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {OUTCOME_OPTIONS.filter(o => o.value !== 'PROPOSAL_SENT').map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setOutcome(option.value)}
                    className={`flex items-center gap-2 p-3 border rounded-lg text-left transition-all ${
                      outcome === option.value
                        ? 'border-violet-500 bg-violet-50 text-violet-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span>{option.emoji}</span>
                    <span className="text-sm">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Resultat (pour emails) */}
          {type === 'EMAIL' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type d'email
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setOutcome('PROPOSAL_SENT')}
                  className={`flex items-center gap-2 p-3 border rounded-lg text-left transition-all ${
                    outcome === 'PROPOSAL_SENT'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span>📧</span>
                  <span className="text-sm">Proposition envoyee</span>
                </button>
                <button
                  onClick={() => setOutcome('ANSWERED')}
                  className={`flex items-center gap-2 p-3 border rounded-lg text-left transition-all ${
                    outcome === 'ANSWERED'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span>✉️</span>
                  <span className="text-sm">Email envoye</span>
                </button>
              </div>
            </div>
          )}

          {/* Duree */}
          {(type === 'APPEL' || type === 'REUNION' || type === 'VISIO') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duree
              </label>
              <div className="flex flex-wrap gap-2">
                {DURATION_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setDuration(option.value)}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${
                      duration === option.value
                        ? 'border-violet-500 bg-violet-50 text-violet-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Section Qualification (collapsible) */}
          <div className="border border-gray-200 rounded-lg">
            <button
              onClick={() => setShowQualification(!showQualification)}
              className="flex items-center justify-between w-full p-3 text-left hover:bg-gray-50"
            >
              <span className="text-sm font-medium text-gray-700">Qualification</span>
              <span className="text-gray-400">{showQualification ? '−' : '+'}</span>
            </button>
            {showQualification && (
              <div className="p-3 pt-0 space-y-3 border-t border-gray-100">
                {/* Temperature */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Temperature</label>
                  <div className="flex gap-2">
                    {TEMPERATURE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setTemperature(option.value)}
                        className={`flex-1 flex items-center justify-center gap-1 p-2 text-sm rounded-lg border transition-all ${
                          temperature === option.value
                            ? 'border-violet-500 bg-violet-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span>{option.emoji}</span>
                        <span>{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Budget discute */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Budget discute</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setBudgetDiscussed(true)}
                      className={`flex-1 p-2 text-sm rounded-lg border transition-all ${
                        budgetDiscussed === true
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      Oui
                    </button>
                    <button
                      onClick={() => setBudgetDiscussed(false)}
                      className={`flex-1 p-2 text-sm rounded-lg border transition-all ${
                        budgetDiscussed === false
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      Non
                    </button>
                  </div>
                </div>

                {/* Decideur */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Decideur identifie</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDecisionMaker(true)}
                      className={`flex-1 p-2 text-sm rounded-lg border transition-all ${
                        decisionMaker === true
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      Oui
                    </button>
                    <button
                      onClick={() => setDecisionMaker(false)}
                      className={`flex-1 p-2 text-sm rounded-lg border transition-all ${
                        decisionMaker === false
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      Non
                    </button>
                  </div>
                </div>

                {/* Objection */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Objection principale</label>
                  <select
                    value={mainObjection}
                    onChange={(e) => setMainObjection(e.target.value as MainObjection)}
                    className="w-full p-2 text-sm border border-gray-200 rounded-lg focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                  >
                    <option value="">Aucune</option>
                    {OBJECTION_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Section Prochaine action (collapsible) */}
          <div className="border border-gray-200 rounded-lg">
            <button
              onClick={() => setShowNextAction(!showNextAction)}
              className="flex items-center justify-between w-full p-3 text-left hover:bg-gray-50"
            >
              <span className="text-sm font-medium text-gray-700">Prochaine etape</span>
              <span className="text-gray-400">{showNextAction ? '−' : '+'}</span>
            </button>
            {showNextAction && (
              <div className="p-3 pt-0 space-y-3 border-t border-gray-100">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Action</label>
                  <select
                    value={nextAction}
                    onChange={(e) => setNextAction(e.target.value as NextAction)}
                    className="w-full p-2 text-sm border border-gray-200 rounded-lg focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                  >
                    <option value="">Selectionner...</option>
                    {NEXT_ACTION_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Date</label>
                  <input
                    type="datetime-local"
                    value={nextActionDate}
                    onChange={(e) => setNextActionDate(e.target.value)}
                    className="w-full p-2 text-sm border border-gray-200 rounded-lg focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes / Compte-rendu
            </label>
            <textarea
              value={resultNotes}
              onChange={(e) => setResultNotes(e.target.value)}
              placeholder="Resume de l'echange..."
              rows={3}
              className="w-full p-3 text-sm border border-gray-200 rounded-lg focus:border-violet-500 focus:ring-1 focus:ring-violet-500 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || (type === 'APPEL' && !outcome)}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Enregistrer
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
