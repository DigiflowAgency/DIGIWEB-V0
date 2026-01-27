'use client';

import { useState, useEffect } from 'react';
import { Phone, Mail, Calendar, Video, Activity, Clock, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import ActivityQuickLog from './ActivityQuickLog';

type ActivityType = 'APPEL' | 'EMAIL' | 'REUNION' | 'VISIO';

interface Activity {
  id: string;
  title: string;
  type: ActivityType;
  status: string;
  scheduledAt: string;
  completedAt?: string | null;
  duration?: number | null;
  outcome?: string | null;
  resultNotes?: string | null;
  temperature?: string | null;
  users?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

interface DealSidebarActivitiesProps {
  dealId: string;
  contactId?: string | null;
}

const TYPE_CONFIG: Record<ActivityType, { icon: typeof Phone; label: string; bgColor: string; textColor: string }> = {
  APPEL: { icon: Phone, label: 'Appel', bgColor: 'bg-violet-100', textColor: 'text-violet-600' },
  EMAIL: { icon: Mail, label: 'Email', bgColor: 'bg-blue-100', textColor: 'text-blue-600' },
  REUNION: { icon: Calendar, label: 'RDV', bgColor: 'bg-green-100', textColor: 'text-green-600' },
  VISIO: { icon: Video, label: 'Visio', bgColor: 'bg-purple-100', textColor: 'text-purple-600' },
};

const OUTCOME_LABELS: Record<string, { label: string; emoji: string }> = {
  ANSWERED: { label: 'Repondu', emoji: '✅' },
  NO_ANSWER: { label: 'Pas de reponse', emoji: '📵' },
  VOICEMAIL: { label: 'Messagerie', emoji: '📱' },
  CALLBACK: { label: 'Rappel demande', emoji: '🔄' },
  PROPOSAL_SENT: { label: 'Envoye', emoji: '📧' },
};

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) return `il y a ${diffMins} min`;
  if (diffHours < 24) return `il y a ${diffHours}h`;
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `il y a ${diffDays}j`;
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

export default function DealSidebarActivities({ dealId, contactId }: DealSidebarActivitiesProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [modalType, setModalType] = useState<ActivityType | null>(null);
  const [stats, setStats] = useState({ appels: 0, rdv: 0, emails: 0, total: 0 });
  const [lastContactDays, setLastContactDays] = useState<number | null>(null);
  const [expandedNotes, setExpandedNotes] = useState<string[]>([]);

  const toggleExpandNote = (id: string) => {
    setExpandedNotes(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const fetchActivities = async () => {
    try {
      const response = await fetch(`/api/activities?dealId=${dealId}&orderBy=scheduledAt&order=desc&limit=20`);
      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities || []);

        // Calculer les stats
        const appels = data.activities?.filter((a: Activity) => a.type === 'APPEL').length || 0;
        const rdv = data.activities?.filter((a: Activity) => a.type === 'REUNION' || a.type === 'VISIO').length || 0;
        const emails = data.activities?.filter((a: Activity) => a.type === 'EMAIL').length || 0;
        setStats({ appels, rdv, emails, total: data.activities?.length || 0 });

        // Calculer le dernier contact
        if (data.activities?.length > 0) {
          const lastActivity = data.activities.find((a: Activity) => a.status === 'COMPLETEE');
          if (lastActivity) {
            const diffDays = Math.floor((new Date().getTime() - new Date(lastActivity.scheduledAt).getTime()) / (1000 * 60 * 60 * 24));
            setLastContactDays(diffDays);
          }
        }
      }
    } catch (error) {
      console.error('Erreur chargement activites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [dealId]);

  const displayedActivities = showAll ? activities : activities.slice(0, 5);
  const needsFollowUp = lastContactDays !== null && lastContactDays > 7;

  return (
    <div>
      {/* Header */}
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Activity className="h-5 w-5 text-violet-600" />
        Activites
        {needsFollowUp && (
          <span className="ml-auto flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
            <AlertCircle className="h-3 w-3" />
            Relance
          </span>
        )}
      </h3>

      {/* Quick Action Buttons */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setModalType('APPEL')}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-violet-50 hover:bg-violet-100 text-violet-700 rounded-lg transition-colors text-sm font-medium"
        >
          <Phone className="h-4 w-4" />
          Appel
        </button>
        <button
          onClick={() => setModalType('REUNION')}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors text-sm font-medium"
        >
          <Calendar className="h-4 w-4" />
          RDV
        </button>
        <button
          onClick={() => setModalType('EMAIL')}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors text-sm font-medium"
        >
          <Mail className="h-4 w-4" />
          Email
        </button>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 mb-4 text-sm text-gray-500">
        <span className="flex items-center gap-1">
          <Phone className="h-3.5 w-3.5" />
          {stats.appels}
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          {stats.rdv}
        </span>
        <span className="flex items-center gap-1">
          <Mail className="h-3.5 w-3.5" />
          {stats.emails}
        </span>
        {lastContactDays !== null && (
          <span className={`ml-auto text-xs ${needsFollowUp ? 'text-amber-600 font-medium' : ''}`}>
            Dernier contact: {lastContactDays === 0 ? "aujourd'hui" : `il y a ${lastContactDays}j`}
          </span>
        )}
      </div>

      {/* Timeline */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin h-6 w-6 border-2 border-violet-500 border-t-transparent rounded-full" />
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-6 text-gray-500">
          <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Aucune activite enregistree</p>
          <p className="text-xs mt-1">Commencez par logger un appel ou un RDV</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedActivities.map((activity) => {
            const config = TYPE_CONFIG[activity.type];
            const Icon = config.icon;
            const outcomeInfo = activity.outcome ? OUTCOME_LABELS[activity.outcome] : null;

            return (
              <div
                key={activity.id}
                className="flex gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className={`p-2 ${config.bgColor} rounded-lg h-fit`}>
                  <Icon className={`h-4 w-4 ${config.textColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 text-sm">
                      {config.label}
                    </span>
                    {outcomeInfo && (
                      <span className="text-xs text-gray-500">
                        {outcomeInfo.emoji} {outcomeInfo.label}
                      </span>
                    )}
                    {activity.duration && (
                      <span className="flex items-center gap-0.5 text-xs text-gray-400">
                        <Clock className="h-3 w-3" />
                        {activity.duration} min
                      </span>
                    )}
                  </div>
                  {activity.resultNotes && (
                    <div>
                      <p className={`text-sm text-gray-600 mt-1 ${
                        expandedNotes.includes(activity.id) ? 'whitespace-pre-wrap' : 'line-clamp-2'
                      }`}>
                        "{activity.resultNotes}"
                      </p>
                      {activity.resultNotes.length > 100 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpandNote(activity.id);
                          }}
                          className="text-xs text-violet-600 hover:underline mt-1"
                        >
                          {expandedNotes.includes(activity.id) ? 'Réduire' : 'Voir plus'}
                        </button>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                    <span>{formatRelativeTime(activity.scheduledAt)}</span>
                    {activity.users && (
                      <span>
                        par {activity.users.firstName} {activity.users.lastName?.charAt(0)}.
                      </span>
                    )}
                    {activity.temperature && (
                      <span className="ml-auto">
                        {activity.temperature === 'HOT' && '🔥'}
                        {activity.temperature === 'WARM' && '🌡️'}
                        {activity.temperature === 'COLD' && '❄️'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {activities.length > 5 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="flex items-center justify-center gap-1 w-full py-2 text-sm text-violet-600 hover:text-violet-700 hover:bg-violet-50 rounded-lg transition-colors"
            >
              {showAll ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Voir moins
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Voir tout ({activities.length})
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Modal */}
      {modalType && (
        <ActivityQuickLog
          dealId={dealId}
          contactId={contactId}
          type={modalType}
          isOpen={true}
          onClose={() => setModalType(null)}
          onSuccess={fetchActivities}
        />
      )}
    </div>
  );
}
