'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, CheckCircle, Eye, EyeOff, Info, X, ChevronDown, ChevronUp } from 'lucide-react';
import { offersByChannel } from '@/components/loader';

interface ServiceCalculatorProps {
  onCalculate: (data: {
    selectedServices: Set<string>;
    commitment: 'comptant' | 24 | 36 | 48;
    isPartner: boolean;
    totals: {
      oneTimeTotal: number;
      monthlyTotal: number;
      maintenanceTotal: number;
      otherMonthlyTotal: number;
      oneTimeBeforeDiscount: number;
      engagementDiscount: number;
      partnerDiscount: number;
      grandTotal: number;
    };
    services: Array<{
      id: string;
      name: string;
      price: number;
      period: string;
      channel: string;
      discount: number;
    }>;
  }) => void;
  // Props optionnelles pour initialiser avec des données existantes
  initialServices?: string[];
  initialCommitment?: 'comptant' | 24 | 36 | 48;
  initialIsPartner?: boolean;
}

export default function ServiceCalculator({
  onCalculate,
  initialServices,
  initialCommitment,
  initialIsPartner
}: ServiceCalculatorProps) {
  const [selectedServices, setSelectedServices] = useState<Set<string>>(
    new Set(initialServices || ['maintenance-hosting'])
  );
  const [commitment, setCommitment] = useState<'comptant' | 24 | 36 | 48>(
    initialCommitment || 'comptant'
  );
  const [isPartner, setIsPartner] = useState(initialIsPartner || false);
  const [showPrices, setShowPrices] = useState(true);
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [showRecap, setShowRecap] = useState(false);

  const toggleServiceSelection = (serviceId: string) => {
    // Ne jamais permettre de désélectionner l'hébergement de base
    if (serviceId === 'maintenance-hosting') {
      return;
    }

    setSelectedServices(prev => {
      const newSet = new Set(prev);

      // Services de maintenance upgrades (accompagnement et totale)
      const maintenanceUpgrades = ['maintenance-accompagnement', 'maintenance-totale'];

      if (newSet.has(serviceId)) {
        // Désélectionner le service
        newSet.delete(serviceId);
      } else {
        // Sélectionner le service
        // Si c'est un upgrade de maintenance, désélectionner l'autre upgrade
        if (maintenanceUpgrades.includes(serviceId)) {
          maintenanceUpgrades.forEach(s => {
            if (s !== serviceId) {
              newSet.delete(s);
            }
          });
        }
        newSet.add(serviceId);
      }

      // Toujours garder l'hébergement de base
      newSet.add('maintenance-hosting');

      return newSet;
    });
  };

  const calculateTotal = () => {
    let oneTimeTotal = 0;
    let monthlyTotal = 0;
    let maintenanceTotal = 0;
    let otherMonthlyTotal = 0;
    const services: Array<any> = [];
    const maintenanceServices = ['maintenance-hosting', 'maintenance-accompagnement', 'maintenance-totale'];

    // Parcourir tous les services sélectionnés
    selectedServices.forEach(serviceId => {
      // Chercher le service dans tous les canaux
      Object.entries(offersByChannel).forEach(([channelKey, channel]) => {
        const offer = (channel as any).offers.find((o: any) => o.id === serviceId);
        if (offer) {
          // Utiliser priceValue qui est déjà un nombre correct, ou fallback sur price
          let price = offer.priceValue;
          if (!price || isNaN(price)) {
            if (typeof offer.price === 'string') {
              price = parseFloat(offer.price.replace(/[^0-9.,]/g, '').replace(',', '.'));
            } else {
              price = offer.price || 0;
            }
          }

          // Protection finale contre NaN
          if (isNaN(price)) {
            price = 0;
          }

          // Les services sans period sont des paiements uniques (sites web, etc.)
          if (!offer.period || offer.period === 'one-time' || offer.period === 'paiement unique') {
            oneTimeTotal += price;
          } else {
            monthlyTotal += price;
            // Séparer maintenance des autres services mensuels
            if (maintenanceServices.includes(offer.id)) {
              maintenanceTotal += price;
            } else {
              otherMonthlyTotal += price;
            }
          }

          services.push({
            id: offer.id,
            name: offer.title,
            price,
            period: offer.period || 'paiement unique',
            channel: channelKey,
            discount: 0,
          });
        }
      });
    });

    // Calculer les remises
    const months = commitment === 'comptant' ? 0 : commitment;
    let engagementDiscount = 0;
    if (commitment === 24) engagementDiscount = 10;
    else if (commitment === 36) engagementDiscount = 20;
    else if (commitment === 48) engagementDiscount = 30;

    const partnerDiscount = isPartner ? 20 : 0;

    // Appliquer les remises sur le one-time (site web)
    let discountedOneTime = oneTimeTotal;
    if (months > 0) {
      // En mode engagement, appliquer la remise d'engagement
      if (engagementDiscount > 0) {
        discountedOneTime = oneTimeTotal * (1 - engagementDiscount / 100);
      }
    }
    // Appliquer la remise partenaire sur le one-time
    if (partnerDiscount > 0) {
      discountedOneTime = discountedOneTime * (1 - partnerDiscount / 100);
    }

    // Appliquer les remises sur le total mensuel
    let discountedMonthly = monthlyTotal;
    if (partnerDiscount > 0) {
      discountedMonthly = monthlyTotal * (1 - partnerDiscount / 100);
    }

    // Séparer les remises pour maintenance et autres services mensuels
    const discountedMaintenance = partnerDiscount > 0
      ? maintenanceTotal * (1 - partnerDiscount / 100)
      : maintenanceTotal;

    const discountedOtherMonthly = partnerDiscount > 0
      ? otherMonthlyTotal * (1 - partnerDiscount / 100)
      : otherMonthlyTotal;

    // Calculer le grand total ENGAGÉ uniquement (sans les options modifiables)
    // En mode engagement : one-time + SEULEMENT la base maintenance (129€) obligatoire
    let grandTotal = 0;
    const maintenanceBase = 129; // Toujours 129€ pour la base obligatoire

    if (months > 0) {
      // Mode engagement : one-time avec remises + SEULEMENT base maintenance (129€) sur la période
      // Ne PAS inclure les upgrades ni les autres services mensuels dans le total engagé
      const maintenanceBaseDiscounted = partnerDiscount > 0
        ? maintenanceBase * (1 - partnerDiscount / 100)
        : maintenanceBase;
      grandTotal = discountedOneTime + (maintenanceBaseDiscounted * months);

      // Debug
      console.log('🔍 Calcul grandTotal:', {
        discountedOneTime,
        maintenanceBaseDiscounted,
        months,
        grandTotal,
        maintenanceTotal,
        otherMonthlyTotal
      });
    } else {
      // Mode comptant : SEULEMENT les services de création (paiement unique)
      // Les services mensuels ne sont pas engagés, donc ne pas les inclure dans le total
      grandTotal = discountedOneTime;

      console.log('🔍 Calcul grandTotal (comptant):', {
        discountedOneTime,
        grandTotal
      });
    }

    return {
      oneTimeTotal: !isNaN(discountedOneTime) ? discountedOneTime : 0,
      monthlyTotal: !isNaN(discountedMonthly) ? discountedMonthly : 0,
      maintenanceTotal: !isNaN(discountedMaintenance) ? discountedMaintenance : 0,
      otherMonthlyTotal: !isNaN(discountedOtherMonthly) ? discountedOtherMonthly : 0,
      oneTimeBeforeDiscount: !isNaN(oneTimeTotal) ? oneTimeTotal : 0,
      engagementDiscount,
      partnerDiscount,
      grandTotal: !isNaN(grandTotal) ? grandTotal : 0,
      services,
      months,
    };
  };

  // Appeler onCalculate à chaque changement
  useEffect(() => {
    const { services, ...totals } = calculateTotal();
    onCalculate({
      selectedServices,
      commitment,
      isPartner,
      totals,
      services,
    });
  }, [selectedServices, commitment, isPartner]);

  const totals = calculateTotal();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Configurez votre offre
        </h3>
        <p className="text-sm text-gray-600">
          Sélectionnez les services dont vous avez besoin
        </p>
      </div>

      {/* Tous les canaux disponibles */}
      {Object.entries(offersByChannel).map(([channelKey, channel]: [string, any]) => {
        const _isBase = channelKey === 'maintenance';

        return (
          <div key={channelKey} className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
              <div className={`bg-gradient-to-r ${channel.gradient} p-2 rounded-lg`}>
                <channel.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className={`text-base font-bold ${channel.textColor}`}>
                {channel.channelName}
              </h3>
              <span className="text-xs text-gray-600 bg-white px-2 py-1 rounded-full font-semibold">
                {channel.offers.length}
              </span>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {channel.offers.map((offer: any) => {
                  const isSelected = selectedServices.has(offer.id);
                  const isBaseHosting = offer.id === 'maintenance-hosting';
                  const isMaintenanceUpgrade = offer.id === 'maintenance-accompagnement' || offer.id === 'maintenance-totale';
                  const primaryColor = channel.textColor.replace('text-', '');

                  return (
                    <motion.div
                      key={offer.id}
                      whileHover={{ scale: isBaseHosting ? 1 : 1.02 }}
                      onClick={() => toggleServiceSelection(offer.id)}
                      className={`rounded-lg p-4 border-2 transition-all relative ${
                        isBaseHosting
                          ? `bg-red-50 border-red-500 shadow-lg cursor-default`
                          : isSelected
                          ? `bg-${primaryColor}/10 border-${primaryColor} shadow-lg cursor-pointer`
                          : offer.recommended
                          ? `bg-${primaryColor}/5 border-${primaryColor}/40 cursor-pointer`
                          : `bg-white border-gray-200 hover:border-${primaryColor}/40 cursor-pointer`
                      }`}
                    >
                      {isSelected && !isBaseHosting && (
                        <div className="absolute -top-2 -left-2 z-10">
                          <CheckCircle className={`w-6 h-6 ${channel.textColor} fill-white`} />
                        </div>
                      )}

                      {isBaseHosting && (
                        <div className="absolute -top-2 -right-2 bg-red-600 px-2 py-1 rounded-full text-xs font-bold text-white z-10">
                          Obligatoire
                        </div>
                      )}

                      {isMaintenanceUpgrade && isSelected && (
                        <div className="absolute -top-2 -right-2 bg-blue-600 px-2 py-1 rounded-full text-xs font-bold text-white z-10">
                          + Base (129€)
                        </div>
                      )}

                      {offer.recommended && !isBaseHosting && !isMaintenanceUpgrade && (
                        <div className={`absolute -top-2 -right-2 bg-gradient-to-r ${channel.gradient} px-2 py-1 rounded-full text-xs font-bold text-white z-10 shadow-lg`}>
                          ⭐ TOP
                        </div>
                      )}

                      <div className="flex flex-col gap-2">
                        <h4 className="text-sm font-bold text-gray-900 leading-tight line-clamp-2">
                          {offer.title}
                        </h4>

                        {showPrices && (
                          <div className="flex flex-col gap-1">
                            {offer.stars && (
                              <div className="flex gap-0.5">
                                {[...Array(offer.stars)].map((_: any, i: number) => (
                                  <Star key={i} className={`w-3 h-3 ${channel.textColor} fill-current`} />
                                ))}
                              </div>
                            )}
                            <div className="flex flex-col">
                              <span className="text-lg font-bold text-gray-900">
                                {typeof offer.price === 'string' && offer.price.includes('€')
                                  ? offer.price.split('€')[0] + '€'
                                  : offer.price}
                              </span>
                              {offer.period && (
                                <span className={`text-xs font-semibold ${
                                  offer.period === '/mois' ? 'text-green-600' : 'text-blue-600'
                                }`}>
                                  {offer.period === '/mois' ? 'Par mois (sans engagement)' : 'Paiement unique'}
                                </span>
                              )}
                              {!offer.period && (
                                <span className="text-xs font-semibold text-blue-600">
                                  Paiement unique
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {!showPrices && (
                          <div className="flex items-center gap-1.5 text-gray-400">
                            <EyeOff className="w-3.5 h-3.5" />
                            <span className="text-xs italic">Masqué</span>
                          </div>
                        )}

                        <span className={`text-xs font-semibold ${channel.textColor} opacity-80`}>
                          {offer.badge}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}

      {/* Récapitulatif et Options */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-1">
        <div className="bg-white rounded-lg p-6 space-y-4">
          {/* Options d'engagement */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Durée d'engagement
            </label>
            <div className="flex flex-wrap gap-2">
              {(['comptant', 24, 36, 48] as const).map((period) => (
                <button
                  key={period}
                  type="button"
                  onClick={() => setCommitment(period)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    commitment === period
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {period === 'comptant' ? 'Comptant' : `${period} mois`}
                  {period !== 'comptant' && period === 24 && ' -10%'}
                  {period === 36 && ' -20%'}
                  {period === 48 && ' -30%'}
                </button>
              ))}
            </div>
          </div>

          {/* Checkbox Partenaire */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPartner}
                onChange={(e) => setIsPartner(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <span className="text-sm font-semibold text-gray-700">
                Je suis partenaire (-20% supplémentaires)
              </span>
            </label>
            <button
              type="button"
              onClick={() => setShowPartnerModal(true)}
              className="flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700 font-semibold"
            >
              <Info className="w-4 h-4" />
              <span>Devenir partenaire</span>
            </button>
          </div>

          {/* Boutons d'action */}
          <div className="pt-2 border-t border-gray-200 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowPrices(!showPrices)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              {showPrices ? (
                <>
                  <EyeOff className="w-4 h-4" />
                  <span>Masquer les prix</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  <span>Afficher les prix</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowRecap(!showRecap)}
              className="flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700 font-semibold"
            >
              {showRecap ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  <span>Masquer détails</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  <span>Voir détails</span>
                </>
              )}
            </button>
          </div>

          {/* Totaux */}
          {showPrices && (
            <div className="pt-4 border-t border-gray-200">
              {(() => {
                const months = commitment === 'comptant' ? 0 : commitment;

                if (months > 0) {
                  // Mode engagement : affichage détaillé
                  const siteMonthlyBefore = totals.oneTimeBeforeDiscount > 0 ? Math.round(totals.oneTimeBeforeDiscount / months) : 0;
                  const siteMonthlyAfter = totals.oneTimeTotal > 0 ? Math.round(totals.oneTimeTotal / months) : 0;

                  // Séparer maintenance base (129€) des upgrades
                  let maintenanceBase = 129;
                  let maintenanceUpgrade = 0;
                  let maintenanceFormula = null;

                  if (selectedServices.has('maintenance-totale')) {
                    maintenanceBase = 129;
                    maintenanceUpgrade = 595;
                    maintenanceFormula = 'Totale';
                  } else if (selectedServices.has('maintenance-accompagnement')) {
                    maintenanceBase = 129;
                    maintenanceUpgrade = 260;
                    maintenanceFormula = 'Accompagnement';
                  } else if (selectedServices.has('maintenance-hosting')) {
                    maintenanceBase = 129;
                  }

                  const totalEngage = siteMonthlyAfter + maintenanceBase;
                  const coutEngageHT = totals.oneTimeTotal + (maintenanceBase * months);
                  const taxRate = 20;
                  const engageTVA = (coutEngageHT * taxRate) / 100;
                  const engageTTC = coutEngageHT + engageTVA;

                  // Obtenir les services one-time pour affichage
                  const oneTimeServices = totals.services.filter((s: any) =>
                    !s.period || s.period === 'paiement unique' || s.period === 'one-time'
                  );

                  const totalHT = coutEngageHT + ((maintenanceUpgrade + totals.otherMonthlyTotal) * months);
                  const _totalTVA = (totalHT * taxRate) / 100;

                  return (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg space-y-4">
                      {/* Engagement sur X mois */}
                      <div className="pb-4 border-b-2 border-blue-200">
                        <p className="text-xs text-blue-600 uppercase font-semibold mb-3 text-center">
                          💎 Engagement {months} mois {totals.engagementDiscount > 0 ? `(-${totals.engagementDiscount}%)` : ''}
                        </p>

                        {/* Services de création étalés */}
                        {totals.oneTimeTotal > 0 && (
                          <div className="mb-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-semibold text-gray-600">Services de création étalés</span>
                              <span className="text-xs text-gray-500">
                                ({Math.round(totals.oneTimeTotal).toLocaleString('fr-FR')}€ total)
                              </span>
                            </div>
                            {oneTimeServices.length > 0 && (
                              <div className="bg-orange-50 rounded p-2 mb-2">
                                {oneTimeServices.map((s: any, idx: number) => (
                                  <div key={idx} className="text-xs text-gray-700 flex justify-between">
                                    <span>• {s.name}</span>
                                    <span className="font-medium">{Math.round(s.price).toLocaleString('fr-FR')}€</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {totals.engagementDiscount > 0 && (
                              <div className="text-xs text-gray-500 line-through text-center mb-1">
                                {siteMonthlyBefore.toLocaleString('fr-FR')}€/mois
                              </div>
                            )}
                            <p className="text-2xl font-bold text-orange-600 text-center">
                              {siteMonthlyAfter}€<span className="text-sm font-normal">/mois</span>
                            </p>
                          </div>
                        )}

                        {/* Hébergement obligatoire */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-gray-600">Hébergement & Maintenance</span>
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">
                              Obligatoire
                            </span>
                          </div>
                          <div className="bg-red-50 rounded p-2 mb-2">
                            <p className="text-xs text-gray-700">• Hébergement web sécurisé</p>
                            <p className="text-xs text-gray-700">• Mises à jour & maintenance</p>
                            <p className="text-xs text-gray-700">• Support technique</p>
                          </div>
                          <p className="text-2xl font-bold text-orange-600 text-center">
                            {maintenanceBase}€<span className="text-sm font-normal">/mois</span>
                          </p>
                        </div>

                        {/* Total engagé mis en avant */}
                        <div className="bg-gradient-to-r from-orange-100 to-orange-50 -mx-4 px-4 py-3 rounded-lg">
                          <div className="flex items-center justify-center gap-2 mb-1">
                            <span className="text-xl font-bold text-gray-900">=</span>
                            <p className="text-3xl font-bold text-orange-600">
                              {totalEngage}€<span className="text-base font-normal">/mois</span>
                            </p>
                          </div>
                          <p className="text-xs text-center text-gray-600 font-semibold">
                            pendant {months} mois (engagé)
                          </p>
                        </div>
                      </div>

                      {/* Services optionnels NON engagés */}
                      {(maintenanceUpgrade > 0 || totals.otherMonthlyTotal > 0) && (
                        <div className="pb-4 border-b border-gray-200">
                          <p className="text-xs text-gray-500 uppercase font-semibold mb-3">
                            ➕ Options modifiables (sans engagement)
                          </p>

                          {maintenanceUpgrade > 0 && maintenanceFormula && (
                            <div className="bg-blue-50 rounded-lg p-3 mb-2">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-semibold text-blue-900">
                                  Formule {maintenanceFormula}
                                </span>
                                <span className="text-lg font-bold text-blue-700">{maintenanceUpgrade}€/mois</span>
                              </div>
                              <p className="text-xs text-blue-700">Comprend la base (129€) + services premium</p>
                              <p className="text-xs text-gray-500 mt-1 italic">
                                Modifiable ou résiliable à tout moment
                              </p>
                            </div>
                          )}

                          {totals.otherMonthlyTotal > 0 && (
                            <div className="bg-green-50 rounded-lg p-3">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-semibold text-green-900">
                                  Services complémentaires
                                </span>
                                <span className="text-lg font-bold text-green-700">
                                  {Math.round(totals.otherMonthlyTotal)}€/mois
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 italic">
                                Sans engagement, résiliables à tout moment
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Récapitulatif des totaux */}
                      <div className="space-y-3">
                        {totals.partnerDiscount > 0 && (
                          <div className="flex justify-between text-sm text-purple-600 bg-purple-50 p-2 rounded">
                            <span className="font-semibold">🤝 Remise partenaire :</span>
                            <span className="font-bold">-{totals.partnerDiscount}%</span>
                          </div>
                        )}

                        {/* Total mensuel si options */}
                        {(maintenanceUpgrade > 0 || totals.otherMonthlyTotal > 0) && (
                          <div className="flex justify-between items-center text-sm bg-gray-50 px-3 py-2 rounded">
                            <span className="text-gray-700 font-medium">Total mensuel (avec options)</span>
                            <span className="font-bold text-gray-900 text-lg">
                              {Math.round(siteMonthlyAfter + maintenanceBase + maintenanceUpgrade + totals.otherMonthlyTotal)}€/mois
                            </span>
                          </div>
                        )}

                        {/* Coût total engagé HT */}
                        <div className="bg-orange-50 rounded-lg p-3">
                          <div className="flex justify-between items-center mb-1">
                            <div>
                              <p className="text-sm font-bold text-orange-900">Coût total ENGAGÉ (HT)</p>
                              <p className="text-xs text-gray-600">
                                {Math.round(totals.oneTimeTotal).toLocaleString('fr-FR')}€ + ({maintenanceBase}€ × {months} mois)
                              </p>
                            </div>
                            <p className="text-2xl font-bold text-orange-600">
                              {Math.round(coutEngageHT).toLocaleString('fr-FR')}€
                            </p>
                          </div>
                          <div className="flex justify-between text-xs mt-2 pt-2 border-t border-orange-200">
                            <span className="text-gray-600">TVA ({taxRate}%)</span>
                            <span className="font-semibold text-gray-700">
                              +{Math.round(engageTVA).toLocaleString('fr-FR')}€
                            </span>
                          </div>
                          <div className="flex justify-between items-center mt-1 pt-2 border-t border-orange-300">
                            <span className="text-sm font-bold text-orange-900">Total TTC engagé</span>
                            <span className="text-xl font-bold text-orange-600">
                              {Math.round(engageTTC).toLocaleString('fr-FR')}€
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-gray-500 italic text-center">
                          {selectedServices.size} service{selectedServices.size > 1 ? 's' : ''} sélectionné{selectedServices.size > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  );
                } else {
                  // Mode comptant : afficher paiement unique
                  return (
                    <>
                      <div className="text-sm font-bold text-gray-700 mb-1">Total comptant</div>
                      {totals.oneTimeTotal > 0 && (
                        <div className="flex justify-between text-sm bg-blue-50 p-2 rounded">
                          <span className="text-blue-700 font-semibold">Services de création</span>
                          <span className="font-bold text-blue-900">
                            {Math.round(totals.oneTimeTotal).toLocaleString('fr-FR')}€
                          </span>
                        </div>
                      )}
                      {totals.maintenanceTotal > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">+ Hébergement</span>
                          <span className="font-semibold text-gray-900">
                            {Math.round(totals.maintenanceTotal).toLocaleString('fr-FR')}€/mois
                          </span>
                        </div>
                      )}
                      {totals.otherMonthlyTotal > 0 && (
                        <div className="flex justify-between text-sm bg-green-50 p-2 rounded">
                          <span className="text-green-700 font-semibold">+ Autres services (SANS ENGAGEMENT)</span>
                          <span className="font-bold text-green-900">
                            {Math.round(totals.otherMonthlyTotal).toLocaleString('fr-FR')}€/mois
                          </span>
                        </div>
                      )}
                      {totals.partnerDiscount > 0 && (
                        <div className="flex justify-between text-sm text-purple-600 bg-purple-50 p-2 rounded mt-2">
                          <span className="font-semibold">🤝 Remise partenaire :</span>
                          <span className="font-bold">-{totals.partnerDiscount}%</span>
                        </div>
                      )}
                      <div className="flex justify-between text-lg font-bold text-orange-600 pt-3 border-t border-gray-200 mt-3">
                        <span>Total estimé :</span>
                        <span>{totals.grandTotal.toLocaleString('fr-FR')}€</span>
                      </div>
                      <p className="text-xs text-gray-500 italic">
                        {selectedServices.size} service{selectedServices.size > 1 ? 's' : ''} sélectionné{selectedServices.size > 1 ? 's' : ''}
                      </p>
                    </>
                  );
                }
              })()}
            </div>
          )}

          {/* Récapitulatif détaillé */}
          <AnimatePresence>
            {showRecap && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="pt-4 border-t border-gray-200 space-y-3"
              >
                <h4 className="text-sm font-bold text-gray-900">Récapitulatif détaillé</h4>
                {totals.services.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">Aucun service sélectionné</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {totals.services.map((service, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">{service.name}</p>
                            <p className="text-xs text-gray-500 capitalize">{service.channel.replace('-', ' ')}</p>
                          </div>
                          {showPrices && (
                            <div className="text-right">
                              <p className="text-sm font-bold text-orange-600">
                                {service.price.toLocaleString('fr-FR')}€
                              </p>
                              <p className="text-xs text-gray-500">{service.period}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Modale Devenir Partenaire - avec Portal pour afficher au-dessus du modal devis */}
      {typeof window !== 'undefined' && showPartnerModal && createPortal(
        <AnimatePresence>
          {showPartnerModal && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-t-2xl">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-white">Programme Partenaire</h3>
                    <button
                      onClick={() => setShowPartnerModal(false)}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <X className="w-6 h-6 text-white" />
                    </button>
                  </div>
                </div>

                {/* Contenu */}
                <div className="p-6 space-y-6">
                  <div>
                    <p className="text-base text-gray-700 mb-4">
                      Êtes-vous sûr de respecter les conditions suivantes ?
                    </p>
                    <p className="text-sm text-gray-600 mb-6">
                      Pour bénéficier de la remise partenaire de <strong className="text-orange-600">20%</strong>, vous devez vous engager à respecter toutes ces conditions :
                    </p>

                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-sm font-bold text-orange-600">1</span>
                        </div>
                        <p className="text-sm text-gray-700 pt-1">
                          Besoin de croissance, le projet du partenaire est viable.
                        </p>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-sm font-bold text-orange-600">2</span>
                        </div>
                        <p className="text-sm text-gray-700 pt-1">
                          Besoin de reprendre la maîtrise totale de sa communication.
                        </p>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-sm font-bold text-orange-600">3</span>
                        </div>
                        <p className="text-sm text-gray-700 pt-1">
                          Peut participer à des témoignages vidéos 1x par an pour expliquer son succès avec Digiflow.
                        </p>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-sm font-bold text-orange-600">4</span>
                        </div>
                        <p className="text-sm text-gray-700 pt-1">
                          Peut apporter 5 contacts qui ont besoin de nos services.
                        </p>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-sm font-bold text-orange-600">5</span>
                        </div>
                        <p className="text-sm text-gray-700 pt-1">
                          S'est engagé à ne pas divulguer les tarifs qui lui ont été proposés.
                        </p>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-sm font-bold text-orange-600">6</span>
                        </div>
                        <p className="text-sm text-gray-700 pt-1">
                          S'engage à mettre toutes les chances de notre côté pour réussir sa communication.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => setShowPartnerModal(false)}
                      className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={() => {
                        setIsPartner(true);
                        setShowPartnerModal(false);
                      }}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all font-semibold shadow-lg"
                    >
                      Je confirme respecter ces conditions
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
