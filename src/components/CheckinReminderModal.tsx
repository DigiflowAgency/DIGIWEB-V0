'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Calendar, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CheckinReminderModal() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkShouldShow = async () => {
      const today = new Date();
      const day = today.getDate();
      const month = today.getMonth();
      const year = today.getFullYear();

      // Afficher seulement du 25 au dernier jour du mois
      if (day < 25) return;

      // Vérifier si déjà fermé ce mois-ci (localStorage)
      const dismissedKey = `checkin-reminder-dismissed-${year}-${month}`;
      if (localStorage.getItem(dismissedKey)) return;

      // Vérifier si check-in déjà fait ce mois
      try {
        const res = await fetch('/api/checkins?checkCurrentMonth=true');
        const data = await res.json();
        if (data.hasCheckinThisMonth) return;
      } catch (error) {
        console.error('Erreur vérification checkin:', error);
      }

      setIsOpen(true);
    };

    checkShouldShow();
  }, []);

  const handleDismiss = () => {
    const today = new Date();
    const key = `checkin-reminder-dismissed-${today.getFullYear()}-${today.getMonth()}`;
    localStorage.setItem(key, 'true');
    setIsOpen(false);
  };

  const handleGoToCheckin = () => {
    setIsOpen(false);
    router.push('/dashboard/checkin');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={handleDismiss}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
              {/* Header avec gradient */}
              <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-6 text-white relative">
                <button
                  onClick={handleDismiss}
                  className="absolute top-4 right-4 text-white/80 hover:text-white transition"
                >
                  <X className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <h2 className="text-xl font-bold">C'est l'heure du Check-in !</h2>
                </div>
                <p className="text-white/90 text-sm">
                  Fin du mois = moment de faire le point
                </p>
              </div>

              {/* Content */}
              <div className="p-6">
                <p className="text-gray-600 mb-6">
                  Prenez quelques minutes pour partager votre ressenti du mois.
                  Votre retour nous aide à mieux vous accompagner et à améliorer
                  notre environnement de travail.
                </p>

                <div className="bg-violet-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-violet-700">
                    <strong>Le check-in mensuel</strong> est un moment privilégié
                    pour exprimer votre niveau d'énergie, vos fiertés, vos difficultés
                    et vos idées.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleDismiss}
                    className="flex-1 px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition font-medium"
                  >
                    Plus tard
                  </button>
                  <button
                    onClick={handleGoToCheckin}
                    className="flex-1 px-4 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition font-medium flex items-center justify-center gap-2"
                  >
                    Faire mon check-in
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
