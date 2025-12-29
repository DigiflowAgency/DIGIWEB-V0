'use client';

import { useState } from 'react';
import { Bell, Plus, Clock, Trash2 } from 'lucide-react';
import { Reminder } from './types';

interface DealSidebarRemindersProps {
  reminders: Reminder[];
  createReminder: (data: { dealId: string; title: string; remindAt: string }) => Promise<unknown>;
  deleteReminder: (id: string) => Promise<unknown>;
  markAsRead: (id: string) => Promise<unknown>;
  dealId: string;
}

export default function DealSidebarReminders({
  reminders,
  createReminder,
  deleteReminder,
  markAsRead,
  dealId,
}: DealSidebarRemindersProps) {
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('09:00');
  const [isAddingReminder, setIsAddingReminder] = useState(false);

  const handleAddReminder = async () => {
    if (!reminderTitle || !reminderDate) return;

    setIsAddingReminder(true);
    try {
      const remindAt = `${reminderDate}T${reminderTime}:00`;
      await createReminder({
        dealId,
        title: reminderTitle,
        remindAt,
      });

      setReminderTitle('');
      setReminderDate('');
      setReminderTime('09:00');
      setShowAddReminder(false);
    } catch (error) {
      console.error('Erreur:', error);
      alert(error instanceof Error ? error.message : 'Erreur lors de la création du rappel');
    } finally {
      setIsAddingReminder(false);
    }
  };

  const handleDeleteReminder = async (reminderId: string) => {
    try {
      await deleteReminder(reminderId);
    } catch (error) {
      console.error('Erreur:', error);
      alert(error instanceof Error ? error.message : 'Erreur lors de la suppression du rappel');
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center justify-between">
        <span className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-violet-600" />
          Rappels
          {reminders.length > 0 && (
            <span className="bg-violet-100 text-violet-700 text-xs px-2 py-0.5 rounded-full">
              {reminders.length}
            </span>
          )}
        </span>
        {!showAddReminder && (
          <button
            onClick={() => setShowAddReminder(true)}
            className="text-violet-600 hover:text-violet-700 flex items-center gap-1 text-sm font-normal"
          >
            <Plus className="h-4 w-4" />
            Ajouter
          </button>
        )}
      </h3>

      {/* Formulaire d'ajout de rappel */}
      {showAddReminder && (
        <div className="mb-4 p-4 bg-violet-50 rounded-lg border border-violet-200">
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Titre du rappel</label>
              <input
                type="text"
                value={reminderTitle}
                onChange={(e) => setReminderTitle(e.target.value)}
                placeholder="Ex: Rappeler pour confirmation RDV"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Date</label>
                <input
                  type="date"
                  value={reminderDate}
                  onChange={(e) => setReminderDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Heure</label>
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowAddReminder(false);
                  setReminderTitle('');
                  setReminderDate('');
                  setReminderTime('09:00');
                }}
                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={handleAddReminder}
                disabled={!reminderTitle || !reminderDate || isAddingReminder}
                className="px-3 py-1.5 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
              >
                {isAddingReminder ? 'Ajout...' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Liste des rappels */}
      <div className="space-y-2">
        {reminders.length > 0 ? (
          reminders.map((reminder: Reminder) => {
            const remindAt = new Date(reminder.remindAt);
            const now = new Date();
            const isPast = remindAt < now;
            const isToday = remindAt.toDateString() === now.toDateString();

            return (
              <div
                key={reminder.id}
                className={`flex items-start justify-between p-3 rounded-lg border ${
                  isPast && !reminder.isRead
                    ? 'bg-red-50 border-red-200'
                    : isToday
                    ? 'bg-orange-50 border-orange-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Clock
                      className={`h-4 w-4 ${isPast && !reminder.isRead ? 'text-red-500' : 'text-gray-400'}`}
                    />
                    <span
                      className={`text-sm font-medium ${
                        isPast && !reminder.isRead ? 'text-red-700' : 'text-gray-700'
                      }`}
                    >
                      {reminder.title}
                    </span>
                  </div>
                  <p
                    className={`text-xs mt-1 ${
                      isPast && !reminder.isRead ? 'text-red-600' : 'text-gray-500'
                    }`}
                  >
                    {isToday
                      ? `Aujourd'hui à ${remindAt.toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}`
                      : remindAt.toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                    {isPast && !reminder.isRead && ' (en retard)'}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {!reminder.isRead && (
                    <button
                      onClick={() => markAsRead(reminder.id)}
                      className="p-1 text-green-600 hover:bg-green-100 rounded"
                      title="Marquer comme lu"
                    >
                      ✓
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteReminder(reminder.id)}
                    className="p-1 text-red-400 hover:text-red-600 hover:bg-red-100 rounded"
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-gray-400 italic text-center py-4">Aucun rappel programmé</p>
        )}
      </div>
    </div>
  );
}
