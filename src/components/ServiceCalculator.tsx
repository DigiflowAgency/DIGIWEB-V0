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
}

export default function ServiceCalculator({ onCalculate }: ServiceCalculatorProps) {
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set(['maintenance-hosting']));
  const [commitment, setCommitment] = useState<'comptant' | 24 | 36 | 48>('comptant');
  const [isPartner, setIsPartner] = useState(false);
  const [showPrices, setShowPrices] = useState(true);
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [showRecap, setShowRecap] = useState(false);

  const toggleServiceSelection = (serviceId: string) => {
    setSelectedServices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(serviceId)) {
        // Ne pas permettre de désélectionner la maintenance de base
        if (serviceId === 'maintenance-hosting') return prev;
        newSet.delete(serviceId);
      } else {
        newSet.add(serviceId);
      }
      return newSet;
    });
  };

  const calculateTotal = () => {
    let oneTimeTotal = 0;
    let monthlyTotal = 0;
    const services: Array<any> = [];

    // Parcourir tous les services sélectionnés
    selectedServices.forEach(serviceId => {
      // Chercher le service dans tous les canaux
      Object.entries(offersByChannel).forEach(([channelKey, channel]) => {
        const offer = (channel as any).offers.find((o: any) => o.id === serviceId);
        if (offer) {
          const price = typeof offer.price === 'string'
            ? parseFloat(offer.price.replace(/[^0-9.-]/g, ''))
            : offer.price;

          if (offer.period === 'one-time' || offer.period === 'paiement unique') {
            oneTimeTotal += price;
          } else {
            monthlyTotal += price;
          }

          services.push({
            id: offer.id,
            name: offer.title,
            price,
            period: offer.period || 'mensuel',
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

    // Appliquer les remises sur le total mensuel
    let discountedMonthly = monthlyTotal;
    if (engagementDiscount > 0) {
      discountedMonthly = monthlyTotal * (1 - engagementDiscount / 100);
    }
    if (partnerDiscount > 0) {
      discountedMonthly = discountedMonthly * (1 - partnerDiscount / 100);
    }

    const grandTotal = oneTimeTotal + (discountedMonthly * (months || 12));

    return {
      oneTimeTotal,
      monthlyTotal: discountedMonthly,
      engagementDiscount,
      partnerDiscount,
      grandTotal,
      services,
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
                  const isBaseService = offer.id === 'maintenance-hosting';
                  const primaryColor = channel.textColor.replace('text-', '');

                  return (
                    <motion.div
                      key={offer.id}
                      whileHover={{ scale: isBaseService ? 1 : 1.02 }}
                      onClick={() => toggleServiceSelection(offer.id)}
                      className={`rounded-lg p-4 border-2 transition-all ${isBaseService ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} relative ${
                        isSelected
                          ? `bg-${primaryColor}/10 border-${primaryColor} shadow-lg`
                          : offer.recommended
                          ? `bg-${primaryColor}/5 border-${primaryColor}/40`
                          : `bg-white border-gray-200 hover:border-${primaryColor}/40`
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute -top-2 -left-2 z-10">
                          <CheckCircle className={`w-6 h-6 ${channel.textColor} fill-white`} />
                        </div>
                      )}

                      {isBaseService && (
                        <div className="absolute -top-2 -right-2 bg-blue-600 px-2 py-1 rounded-full text-xs font-bold text-white z-10">
                          Inclus
                        </div>
                      )}

                      {offer.recommended && !isBaseService && (
                        <div className={`absolute -top-2 -right-2 bg-gradient-to-r ${channel.gradient} px-2 py-1 rounded-full text-xs font-bold text-white z-10 shadow-lg`}>
                          ⭐ TOP
                        </div>
                      )}

                      <div className="flex flex-col gap-2">
                        <h4 className="text-sm font-bold text-gray-900 leading-tight line-clamp-2">
                          {offer.title}
                        </h4>

                        {showPrices && (
                          <div className="flex items-center gap-2">
                            {offer.stars && (
                              <div className="flex gap-0.5">
                                {[...Array(offer.stars)].map((_: any, i: number) => (
                                  <Star key={i} className={`w-3 h-3 ${channel.textColor} fill-current`} />
                                ))}
                              </div>
                            )}
                            <div>
                              <span className="text-sm font-bold text-gray-900">{offer.price}</span>
                              {offer.period && <span className="text-xs text-gray-500 ml-1">{offer.period}</span>}
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
            <div className="pt-4 border-t border-gray-200 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Paiement unique :</span>
                <span className="font-semibold text-gray-900">
                  {totals.oneTimeTotal.toLocaleString('fr-FR')}€
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Mensuel :</span>
                <span className="font-semibold text-gray-900">
                  {totals.monthlyTotal.toLocaleString('fr-FR')}€/mois
                </span>
              </div>
              {totals.engagementDiscount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Remise engagement ({commitment}m) :</span>
                  <span className="font-semibold">-{totals.engagementDiscount}%</span>
                </div>
              )}
              {totals.partnerDiscount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Remise partenaire :</span>
                  <span className="font-semibold">-{totals.partnerDiscount}%</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold text-orange-600 pt-2 border-t border-gray-200">
                <span>Total estimé :</span>
                <span>{totals.grandTotal.toLocaleString('fr-FR')}€</span>
              </div>
              <p className="text-xs text-gray-500 italic">
                {selectedServices.size} service{selectedServices.size > 1 ? 's' : ''} sélectionné{selectedServices.size > 1 ? 's' : ''}
              </p>
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
