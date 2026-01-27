'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { X, Play, CheckCircle, Loader2, Users, Shuffle, Zap, RotateCcw } from 'lucide-react';
import SpinWheel from './spin-wheel';

interface MetaLead {
  id: string;
  fullName: string | null;
  email: string | null;
  pageName: string | null;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
}

interface Counter {
  userId: string;
  firstName: string;
  lastName: string;
  count: number;
}

interface AutoAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  leads: MetaLead[];
  users: User[];
  onComplete: () => void;
  onLeadAssigned?: () => void;
}

interface Assignment {
  leadId: string;
  leadName: string;
  userId: string;
  userName: string;
  success: boolean;
}

// Fonction pour calculer l'ordre d'attribution equitable
function calculateAssignmentOrder(
  users: User[],
  counters: Counter[],
  leadCount: number
): string[] {
  // Creer une copie des compteurs pour simulation
  const simCounters = new Map<string, number>(
    counters.map((c) => [c.userId, c.count])
  );

  // Pour les nouveaux commerciaux sans compteur, initialiser a 0
  users.forEach((u) => {
    if (!simCounters.has(u.id)) simCounters.set(u.id, 0);
  });

  const assignments: string[] = [];

  for (let i = 0; i < leadCount; i++) {
    // Trouver le commercial avec le moins de leads
    const entries: [string, number][] = [];
    simCounters.forEach((count, id) => {
      if (users.some((u) => u.id === id)) {
        entries.push([id, count]);
      }
    });
    const sorted = entries.sort((a, b) =>
      a[1] !== b[1] ? a[1] - b[1] : a[0].localeCompare(b[0])
    );

    const [nextUserId] = sorted[0];
    assignments.push(nextUserId);

    // Incrementer le compteur simule
    simCounters.set(nextUserId, simCounters.get(nextUserId)! + 1);
  }

  return assignments;
}

// Trouver le prochain commercial (le moins charge)
function getNextUser(users: User[], counters: Counter[]): User | null {
  if (users.length === 0) return null;

  const counterMap = new Map(counters.map((c) => [c.userId, c.count]));

  // Trier les utilisateurs par compteur puis par ID
  const sorted = [...users].sort((a, b) => {
    const countA = counterMap.get(a.id) || 0;
    const countB = counterMap.get(b.id) || 0;
    return countA !== countB ? countA - countB : a.id.localeCompare(b.id);
  });

  return sorted[0];
}

export default function AutoAssignModal({
  isOpen,
  onClose,
  leads,
  users,
  onComplete,
  onLeadAssigned,
}: AutoAssignModalProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [currentLeadIndex, setCurrentLeadIndex] = useState(0);
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [counters, setCounters] = useState<Counter[]>([]);
  const [isLoadingCounters, setIsLoadingCounters] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Refs pour eviter les problemes de closure
  const currentLeadIndexRef = useRef(0);
  const countersRef = useRef<Counter[]>([]);
  const leadsRef = useRef(leads);
  const usersRef = useRef(users);

  // Mettre a jour les refs quand les props changent
  leadsRef.current = leads;
  usersRef.current = users;
  countersRef.current = counters;

  const onLeadAssignedRef = useRef(onLeadAssigned);
  onLeadAssignedRef.current = onLeadAssigned;

  // Charger les compteurs au demarrage
  const loadCounters = useCallback(async () => {
    setIsLoadingCounters(true);
    try {
      const response = await fetch('/api/settings/lead-assignment');
      const data = await response.json();
      if (data.counters) {
        setCounters(data.counters);
        countersRef.current = data.counters;
      }
    } catch (err) {
      console.error('Erreur chargement compteurs:', err);
      setCounters([]);
    } finally {
      setIsLoadingCounters(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && !isRunning && !isComplete) {
      loadCounters();
    }
  }, [isOpen, isRunning, isComplete, loadCounters]);

  // Incrementer le compteur en DB
  const incrementCounter = async (userId: string) => {
    try {
      await fetch('/api/settings/lead-assignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      // Mettre a jour les compteurs locaux
      setCounters((prev) =>
        prev.map((c) =>
          c.userId === userId ? { ...c, count: c.count + 1 } : c
        )
      );
    } catch (err) {
      console.error('Erreur increment compteur:', err);
    }
  };

  const assignLead = async (leadId: string, userId: string) => {
    try {
      const response = await fetch(`/api/meta-leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedToId: userId }),
      });
      return response.ok;
    } catch (error) {
      console.error('Error assigning lead:', error);
      return false;
    }
  };

  const processNextLead = useCallback(async () => {
    const leadIndex = currentLeadIndexRef.current;
    const currentLeads = leadsRef.current;
    const currentUsers = usersRef.current;
    const currentCounters = countersRef.current;

    if (leadIndex >= currentLeads.length) {
      setIsComplete(true);
      setIsRunning(false);
      return;
    }

    const lead = currentLeads[leadIndex];
    // Trouver le prochain commercial (le moins charge)
    const nextUser = getNextUser(currentUsers, currentCounters);

    if (!nextUser) {
      setIsComplete(true);
      setIsRunning(false);
      return;
    }

    // Assigner le lead
    const success = await assignLead(lead.id, nextUser.id);

    if (success) {
      // Incrementer le compteur
      await incrementCounter(nextUser.id);
      // Mettre a jour le ref
      countersRef.current = countersRef.current.map((c) =>
        c.userId === nextUser.id ? { ...c, count: c.count + 1 } : c
      );
    }

    // Rafraichir les stats apres chaque attribution
    if (success && onLeadAssignedRef.current) {
      onLeadAssignedRef.current();
    }

    // Enregistrer l'attribution
    setAssignments((prev) => [
      ...prev,
      {
        leadId: lead.id,
        leadName: lead.fullName || 'Sans nom',
        userId: nextUser.id,
        userName: `${nextUser.firstName} ${nextUser.lastName}`,
        success,
      },
    ]);

    setIsSpinning(false);

    // Passer au lead suivant
    const nextLeadIndex = leadIndex + 1;
    currentLeadIndexRef.current = nextLeadIndex;
    setCurrentLeadIndex(nextLeadIndex);

    // Trouver l'index du prochain commercial pour la roue
    const nextNextUser = getNextUser(currentUsers, countersRef.current);
    if (nextNextUser) {
      const nextUserIdx = currentUsers.findIndex((u) => u.id === nextNextUser.id);
      setCurrentUserIndex(nextUserIdx >= 0 ? nextUserIdx : 0);
    }

    if (nextLeadIndex < currentLeads.length) {
      // Lancer le prochain spin apres un delai
      setTimeout(() => {
        setIsSpinning(true);
      }, 50);
    } else {
      setIsComplete(true);
      setIsRunning(false);
    }
  }, []);

  const handleSpinEnd = useCallback(() => {
    processNextLead();
  }, [processNextLead]);

  const handleStart = async () => {
    // Recharger les compteurs frais
    await loadCounters();

    // Reinitialiser les refs et etats
    currentLeadIndexRef.current = 0;

    // Trouver le prochain commercial
    const nextUser = getNextUser(users, countersRef.current);
    const startUserIdx = nextUser
      ? users.findIndex((u) => u.id === nextUser.id)
      : 0;

    setIsRunning(true);
    setIsBatchMode(false);
    setIsComplete(false);
    setAssignments([]);
    setCurrentLeadIndex(0);
    setCurrentUserIndex(startUserIdx >= 0 ? startUserIdx : 0);

    // Lancer le premier spin
    setTimeout(() => {
      setIsSpinning(true);
    }, 100);
  };

  const handleBatchStart = async () => {
    // Mode batch: attribuer tous les leads rapidement sans animation
    setIsRunning(true);
    setIsBatchMode(true);
    setIsComplete(false);
    setAssignments([]);
    setCurrentLeadIndex(0);

    // Recharger les compteurs frais
    await loadCounters();
    const freshCounters = countersRef.current;

    // Calculer l'ordre d'attribution equitable
    const assignmentOrder = calculateAssignmentOrder(
      users,
      freshCounters,
      leads.length
    );

    const newAssignments: Assignment[] = [];

    // Traiter tous les leads en parallele par lots de 5
    const batchSize = 5;
    for (let i = 0; i < leads.length; i += batchSize) {
      const batch = leads.slice(i, Math.min(i + batchSize, leads.length));

      const batchPromises = batch.map(async (lead, batchIndex) => {
        const globalLeadIndex = i + batchIndex;
        const userId = assignmentOrder[globalLeadIndex];
        const user = users.find((u) => u.id === userId);

        if (!user) {
          return {
            leadId: lead.id,
            leadName: lead.fullName || 'Sans nom',
            userId: '',
            userName: 'Inconnu',
            success: false,
          };
        }

        const success = await assignLead(lead.id, user.id);

        if (success) {
          // Incrementer le compteur
          await incrementCounter(user.id);
        }

        return {
          leadId: lead.id,
          leadName: lead.fullName || 'Sans nom',
          userId: user.id,
          userName: `${user.firstName} ${user.lastName}`,
          success,
        };
      });

      const batchResults = await Promise.all(batchPromises);
      newAssignments.push(...batchResults);
      setAssignments([...newAssignments]);
      setCurrentLeadIndex(Math.min(i + batchSize, leads.length));

      // Rafraichir les stats
      if (onLeadAssigned) {
        onLeadAssigned();
      }
    }

    setIsComplete(true);
    setIsRunning(false);
  };

  const handleResetCounters = async () => {
    if (!confirm('Reinitialiser tous les compteurs a 0 ? Cette action est irreversible.')) {
      return;
    }

    setIsResetting(true);
    try {
      const response = await fetch('/api/settings/lead-assignment', {
        method: 'DELETE',
      });
      if (response.ok) {
        await loadCounters();
      } else {
        const data = await response.json();
        alert(data.error || 'Erreur lors de la reinitialisation');
      }
    } catch (err) {
      console.error('Erreur reset compteurs:', err);
      alert('Erreur lors de la reinitialisation');
    } finally {
      setIsResetting(false);
    }
  };

  const handleClose = () => {
    if (isComplete || assignments.length > 0) {
      onComplete();
    }
    setIsRunning(false);
    setIsBatchMode(false);
    setIsComplete(false);
    setAssignments([]);
    setCurrentLeadIndex(0);
    setCurrentUserIndex(0);
    currentLeadIndexRef.current = 0;
    setIsSpinning(false);
    onClose();
  };

  if (!isOpen) return null;

  const currentLead = leads[currentLeadIndex];
  const progress =
    isRunning || isComplete
      ? ((assignments.length / leads.length) * 100).toFixed(0)
      : 0;
  const successCount = assignments.filter((a) => a.success).length;

  // Trouver le prochain commercial pour l'affichage
  const nextUser = getNextUser(users, counters);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={!isRunning ? handleClose : undefined}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl">
              <Shuffle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Attribution automatique
              </h2>
              <p className="text-sm text-gray-500">
                {leads.length} lead{leads.length > 1 ? 's' : ''} a attribuer a{' '}
                {users.length} commercial{users.length > 1 ? 'aux' : ''}
              </p>
            </div>
          </div>
          {!isRunning && (
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Colonne gauche: Roue */}
            <div className="flex flex-col items-center justify-center">
              {users.length >= 2 ? (
                <>
                  <SpinWheel
                    users={users}
                    selectedIndex={currentUserIndex}
                    isSpinning={isSpinning}
                    onSpinEnd={handleSpinEnd}
                  />

                  {/* Info lead en cours */}
                  {isRunning && currentLead && !isComplete && (
                    <div className="mt-6 text-center">
                      <p className="text-sm text-gray-500">
                        Attribution en cours...
                      </p>
                      <p className="font-semibold text-gray-900 mt-1">
                        {currentLead.fullName || 'Lead sans nom'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Lead {currentLeadIndex + 1} / {leads.length}
                      </p>
                    </div>
                  )}

                  {/* Compteurs des commerciaux */}
                  {!isRunning && !isComplete && counters.length > 0 && (
                    <div className="mt-6 w-full">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-700">
                          Leads attribues
                        </h4>
                        <button
                          onClick={handleResetCounters}
                          disabled={isResetting}
                          className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1"
                          title="Reinitialiser les compteurs"
                        >
                          <RotateCcw className={`h-3 w-3 ${isResetting ? 'animate-spin' : ''}`} />
                          Reset
                        </button>
                      </div>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {counters
                          .filter((c) => users.some((u) => u.id === c.userId))
                          .map((counter) => (
                            <div
                              key={counter.userId}
                              className={`flex items-center justify-between px-3 py-1.5 rounded text-sm ${
                                nextUser?.id === counter.userId
                                  ? 'bg-violet-50 border border-violet-200'
                                  : 'bg-gray-50'
                              }`}
                            >
                              <span
                                className={
                                  nextUser?.id === counter.userId
                                    ? 'font-medium text-violet-700'
                                    : 'text-gray-600'
                                }
                              >
                                {counter.firstName} {counter.lastName}
                                {nextUser?.id === counter.userId && (
                                  <span className="ml-2 text-xs text-violet-500">
                                    (prochain)
                                  </span>
                                )}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-xs font-medium ${
                                  nextUser?.id === counter.userId
                                    ? 'bg-violet-100 text-violet-700'
                                    : 'bg-gray-200 text-gray-600'
                                }`}
                              >
                                {counter.count} leads
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    Il faut au moins 2 commerciaux pour utiliser la roue.
                  </p>
                </div>
              )}
            </div>

            {/* Colonne droite: Liste des attributions */}
            <div className="flex flex-col h-[400px]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Attributions</h3>
                {isRunning && (
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-violet-600 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-500">{progress}%</span>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                {assignments.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <p>Les attributions apparaitront ici</p>
                  </div>
                ) : (
                  assignments.map((assignment, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        assignment.success
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm text-gray-900">
                            {assignment.leadName}
                          </p>
                          <p className="text-xs text-gray-500">
                            → {assignment.userName}
                          </p>
                        </div>
                        {assignment.success ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <X className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-100 bg-gray-50">
          {isComplete ? (
            <>
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">
                  {successCount} lead{successCount > 1 ? 's' : ''} attribue
                  {successCount > 1 ? 's' : ''} avec succes
                </span>
              </div>
              <button
                onClick={handleClose}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-lg hover:from-blue-700 hover:to-violet-700 transition-all"
              >
                Fermer
              </button>
            </>
          ) : isRunning ? (
            <>
              <div className="flex items-center gap-2 text-blue-600">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>
                  {isBatchMode
                    ? `Attribution rapide... ${assignments.length}/${leads.length}`
                    : 'Attribution en cours...'}
                </span>
              </div>
              <button
                disabled
                className="px-6 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
              >
                Veuillez patienter
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleClose}
                  className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                {/* Indicateur du prochain commercial */}
                {!isLoadingCounters && users.length >= 2 && nextUser && (
                  <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg">
                    Prochain:{' '}
                    <span className="font-semibold text-violet-600">
                      {nextUser.firstName}
                    </span>
                    <span className="text-gray-400 ml-1">
                      ({counters.find((c) => c.userId === nextUser.id)?.count || 0}{' '}
                      leads)
                    </span>
                  </div>
                )}
                {isLoadingCounters && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Chargement...
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBatchStart}
                  disabled={leads.length === 0 || isLoadingCounters}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Attribution rapide sans animation"
                >
                  <Zap className="h-5 w-5" />
                  Mode rapide
                </button>
                <button
                  onClick={handleStart}
                  disabled={
                    users.length < 2 || leads.length === 0 || isLoadingCounters
                  }
                  className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-lg hover:from-blue-700 hover:to-violet-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play className="h-5 w-5" />
                  Avec la roue
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
