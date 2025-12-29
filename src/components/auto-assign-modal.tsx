'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { X, Play, CheckCircle, Loader2, Users, Shuffle, Zap } from 'lucide-react';
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

interface AutoAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  leads: MetaLead[];
  users: User[];
  onComplete: () => void;
  onLeadAssigned?: () => void; // Callback après chaque attribution pour rafraîchir les stats
}

interface Assignment {
  leadId: string;
  leadName: string;
  userId: string;
  userName: string;
  success: boolean;
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
  const [wheelStartPosition, setWheelStartPosition] = useState(0);
  const [isLoadingPosition, setIsLoadingPosition] = useState(false);

  // Refs pour éviter les problèmes de closure
  const currentLeadIndexRef = useRef(0);
  const currentUserIndexRef = useRef(0);
  const wheelStartPositionRef = useRef(0);
  const leadsRef = useRef(leads);
  const usersRef = useRef(users);

  // Mettre à jour les refs quand les props changent
  leadsRef.current = leads;
  usersRef.current = users;

  const onLeadAssignedRef = useRef(onLeadAssigned);
  onLeadAssignedRef.current = onLeadAssigned;

  // Charger la position de la roue au demarrage
  useEffect(() => {
    if (isOpen && !isRunning && !isComplete) {
      setIsLoadingPosition(true);
      fetch('/api/settings/wheel-position')
        .then((r) => r.json())
        .then((data) => {
          const position = data.position || 0;
          setWheelStartPosition(position);
          wheelStartPositionRef.current = position;
          setCurrentUserIndex(position % users.length);
          currentUserIndexRef.current = position % users.length;
        })
        .catch((err) => {
          console.error('Erreur chargement position roue:', err);
          setWheelStartPosition(0);
          wheelStartPositionRef.current = 0;
        })
        .finally(() => {
          setIsLoadingPosition(false);
        });
    }
  }, [isOpen, users.length, isRunning, isComplete]);

  // Sauvegarder la nouvelle position apres attribution
  const saveWheelPosition = async (newPosition: number) => {
    try {
      await fetch('/api/settings/wheel-position', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position: newPosition }),
      });
    } catch (err) {
      console.error('Erreur sauvegarde position roue:', err);
    }
  };

  const assignLead = async (leadId: string, userId: string) => {
    try {
      console.log(`Assigning lead ${leadId} to user ${userId}`);
      const response = await fetch(`/api/meta-leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedToId: userId }),
      });
      const data = await response.json();
      console.log('Response:', response.ok, data);
      return response.ok;
    } catch (error) {
      console.error('Error assigning lead:', error);
      return false;
    }
  };

  const processNextLead = useCallback(async () => {
    const leadIndex = currentLeadIndexRef.current;
    const userIndex = currentUserIndexRef.current;
    const currentLeads = leadsRef.current;
    const currentUsers = usersRef.current;

    if (leadIndex >= currentLeads.length) {
      setIsComplete(true);
      setIsRunning(false);
      return;
    }

    const lead = currentLeads[leadIndex];
    const user = currentUsers[userIndex];

    console.log(`Processing lead ${leadIndex + 1}/${currentLeads.length}: ${lead.fullName} -> ${user.firstName}`);

    // Assigner le lead
    const success = await assignLead(lead.id, user.id);

    // Rafraîchir les stats après chaque attribution
    if (success && onLeadAssignedRef.current) {
      onLeadAssignedRef.current();
    }

    // Enregistrer l'attribution
    setAssignments((prev) => [
      ...prev,
      {
        leadId: lead.id,
        leadName: lead.fullName || 'Sans nom',
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        success,
      },
    ]);

    setIsSpinning(false);

    // Passer au lead suivant
    const nextLeadIndex = leadIndex + 1;
    const nextUserIndex = (userIndex + 1) % currentUsers.length;

    currentLeadIndexRef.current = nextLeadIndex;
    currentUserIndexRef.current = nextUserIndex;
    setCurrentLeadIndex(nextLeadIndex);
    setCurrentUserIndex(nextUserIndex);

    if (nextLeadIndex < currentLeads.length) {
      // Lancer le prochain spin après un délai
      setTimeout(() => {
        setIsSpinning(true);
      }, 50);
    } else {
      // Terminé - sauvegarder la nouvelle position de la roue
      const newPosition = (wheelStartPositionRef.current + currentLeads.length) % currentUsers.length;
      saveWheelPosition(newPosition);
      setIsComplete(true);
      setIsRunning(false);
    }
  }, []);

  const handleSpinEnd = useCallback(() => {
    processNextLead();
  }, [processNextLead]);

  const handleStart = () => {
    // Réinitialiser les refs et états avec la position persistante
    currentLeadIndexRef.current = 0;
    // Utiliser la position de depart sauvegardee
    const startUserIdx = wheelStartPosition % users.length;
    currentUserIndexRef.current = startUserIdx;

    setIsRunning(true);
    setIsBatchMode(false);
    setIsComplete(false);
    setAssignments([]);
    setCurrentLeadIndex(0);
    setCurrentUserIndex(startUserIdx);

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

    // Utiliser la position de depart sauvegardee pour une distribution equitable
    const startPosition = wheelStartPosition % users.length;
    setCurrentUserIndex(startPosition);

    const newAssignments: Assignment[] = [];

    // Traiter tous les leads en parallèle par lots de 5
    // IMPORTANT: utiliser la position de depart + index global pour un round-robin equitable
    const batchSize = 5;
    for (let i = 0; i < leads.length; i += batchSize) {
      const batch = leads.slice(i, Math.min(i + batchSize, leads.length));

      const batchPromises = batch.map(async (lead, batchIndex) => {
        // Utiliser startPosition + index global pour une distribution equitable
        const globalLeadIndex = i + batchIndex;
        const assignUserIndex = (startPosition + globalLeadIndex) % users.length;
        const user = users[assignUserIndex];

        const success = await assignLead(lead.id, user.id);

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

      // Rafraîchir les stats
      if (onLeadAssigned) {
        onLeadAssigned();
      }
    }

    // Sauvegarder la nouvelle position de la roue pour les prochaines attributions
    const newPosition = (startPosition + leads.length) % users.length;
    await saveWheelPosition(newPosition);

    setIsComplete(true);
    setIsRunning(false);
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
    currentUserIndexRef.current = 0;
    setIsSpinning(false);
    onClose();
  };

  if (!isOpen) return null;

  const currentLead = leads[currentLeadIndex];
  const progress = isRunning || isComplete ? ((assignments.length / leads.length) * 100).toFixed(0) : 0;
  const successCount = assignments.filter((a) => a.success).length;

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
              <h2 className="text-xl font-bold text-gray-900">Attribution automatique</h2>
              <p className="text-sm text-gray-500">
                {leads.length} lead{leads.length > 1 ? 's' : ''} à attribuer à {users.length} commercial{users.length > 1 ? 'aux' : ''}
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
                      <p className="text-sm text-gray-500">Attribution en cours...</p>
                      <p className="font-semibold text-gray-900 mt-1">
                        {currentLead.fullName || 'Lead sans nom'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Lead {currentLeadIndex + 1} / {leads.length}
                      </p>
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
                    <p>Les attributions apparaîtront ici</p>
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
                  {successCount} lead{successCount > 1 ? 's' : ''} attribué{successCount > 1 ? 's' : ''} avec succès
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
                {!isLoadingPosition && users.length >= 2 && (
                  <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg">
                    Prochain: <span className="font-semibold text-violet-600">
                      {users[wheelStartPosition % users.length]?.firstName}
                    </span>
                    <span className="text-gray-400 ml-1">
                      (pos {(wheelStartPosition % users.length) + 1}/{users.length})
                    </span>
                  </div>
                )}
                {isLoadingPosition && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Chargement...
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBatchStart}
                  disabled={leads.length === 0 || isLoadingPosition}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Attribution rapide sans animation"
                >
                  <Zap className="h-5 w-5" />
                  Mode rapide
                </button>
                <button
                  onClick={handleStart}
                  disabled={users.length < 2 || leads.length === 0 || isLoadingPosition}
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
