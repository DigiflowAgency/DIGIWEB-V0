'use client';

import { Euro, User, Globe, Megaphone, Instagram, Linkedin, Users, PhoneCall, Mail as MailIcon, MessageCircle, Briefcase } from 'lucide-react';
import { Deal, User as UserType, Stage, originOptions, productOptions } from './types';
import EditableField, { SelectField } from './EditableField';
import { useProductionServices } from '@/hooks/useProductionServices';

interface DealSidebarOpportunityProps {
  deal: Deal;
  isEditing: boolean;
  editedDeal: Deal;
  setEditedDeal: (deal: Deal) => void;
  users: UserType[];
  stages: Stage[];
  getStageLabel: (code: string) => string;
  getStageColor: (code: string) => string;
}

// Configuration des origines avec icônes et couleurs
const originConfig: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
  'SITE_WEB': { label: 'Site Web', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: Globe },
  'ADS': { label: 'Publicité Meta', color: 'text-purple-700', bgColor: 'bg-purple-100', icon: Megaphone },
  'DM_INSTA': { label: 'DM Instagram', color: 'text-pink-700', bgColor: 'bg-pink-100', icon: Instagram },
  'LINKEDIN': { label: 'LinkedIn', color: 'text-sky-700', bgColor: 'bg-sky-100', icon: Linkedin },
  'RECOMMANDATION': { label: 'Recommandation', color: 'text-green-700', bgColor: 'bg-green-100', icon: Users },
  'CLIENT_BEHYPE': { label: 'Client Behype', color: 'text-orange-700', bgColor: 'bg-orange-100', icon: Users },
  'CONNAISSANCE': { label: 'Connaissance', color: 'text-teal-700', bgColor: 'bg-teal-100', icon: Users },
  'TELEPROS_CAM': { label: 'Télépros CAM', color: 'text-violet-700', bgColor: 'bg-violet-100', icon: PhoneCall },
  'COLD_CALL': { label: 'Cold Call', color: 'text-amber-700', bgColor: 'bg-amber-100', icon: PhoneCall },
  'COLD_MAIL': { label: 'Cold Mail', color: 'text-indigo-700', bgColor: 'bg-indigo-100', icon: MailIcon },
  'COLD_SMS': { label: 'Cold SMS', color: 'text-cyan-700', bgColor: 'bg-cyan-100', icon: MessageCircle },
};

export default function DealSidebarOpportunity({
  deal,
  isEditing,
  editedDeal,
  setEditedDeal,
  users,
  stages,
  getStageLabel,
  getStageColor,
}: DealSidebarOpportunityProps) {
  const { services } = useProductionServices();

  const updateField = (field: keyof Deal, value: any) => {
    setEditedDeal({ ...editedDeal, [field]: value });
  };

  // Quand on change de service, on doit aussi mettre à jour le stageId
  const handleServiceChange = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    const firstStageId = service?.stages[0]?.id || null;
    setEditedDeal({
      ...editedDeal,
      productionServiceId: serviceId || null,
      productionStageId: firstStageId,
    });
  };

  const stageOptions = stages.map((s) => ({ value: s.code, label: s.label }));
  const userOptions = users.map((u) => ({ value: u.id, label: `${u.firstName} ${u.lastName}` }));
  const serviceOptions = [
    { value: '', label: 'Aucun service' },
    ...services.map(s => ({ value: s.id, label: s.name })),
  ];

  // Récupérer le service actuel pour afficher les stages
  const currentServiceId = isEditing ? editedDeal.productionServiceId : deal.productionServiceId;
  const currentService = services.find(s => s.id === currentServiceId);
  const stageOptionsForService = currentService
    ? currentService.stages.map(s => ({ value: s.id, label: s.name }))
    : [];

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Euro className="h-5 w-5 text-violet-600" />
        Opportunité
      </h3>
      <div className="space-y-4">
        {/* Titre du deal */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Titre</label>
          {isEditing ? (
            <EditableField
              isEditing={true}
              value={editedDeal.title}
              onChange={(v) => updateField('title', v)}
              label="Titre"
              placeholder="Titre du deal"
            />
          ) : (
            <p className="text-gray-700 font-medium">{deal.title}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          {isEditing ? (
            <EditableField
              isEditing={true}
              value={editedDeal.description}
              onChange={(v) => updateField('description', v)}
              label="Description"
              type="textarea"
              rows={3}
              placeholder="Description du deal..."
            />
          ) : (
            <p className="text-gray-700 text-sm">
              {deal.description || <span className="text-gray-400 italic">Aucune description</span>}
            </p>
          )}
        </div>

        {/* Responsable principal */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Responsable principal</label>
          {isEditing ? (
            <SelectField
              isEditing={true}
              value={editedDeal.ownerId}
              onChange={(v) => updateField('ownerId', v)}
              label="Responsable"
              options={userOptions}
            />
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
                <User className="h-4 w-4 text-violet-600" />
              </div>
              <span className="text-gray-700 font-medium">
                {deal.users ? `${deal.users.firstName} ${deal.users.lastName}` : 'Non assigné'}
              </span>
              <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">Principal</span>
            </div>
          )}
        </div>

        {/* État */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">État</label>
          {isEditing ? (
            <SelectField
              isEditing={true}
              value={editedDeal.stage}
              onChange={(v) => updateField('stage', v)}
              label="État"
              options={stageOptions}
            />
          ) : (
            (() => {
              const stageColor = getStageColor(deal.stage);
              const bgClass = stageColor.split(' ')[0] || 'bg-gray-100';
              const textClass = bgClass.replace('bg-', 'text-').replace('-50', '-700').replace('-100', '-700');
              return (
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${bgClass} ${textClass}`}>
                  {getStageLabel(deal.stage)}
                </span>
              );
            })()
          )}
        </div>

        {/* Produit */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Produit</label>
          <SelectField
            isEditing={isEditing}
            value={isEditing ? editedDeal.product : deal.product}
            onChange={(v) => updateField('product', v)}
            label="Produit"
            options={productOptions}
          />
        </div>

        {/* Service de production (seulement si deal CLOSING) */}
        {deal.stage === 'CLOSING' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-violet-500" />
                Service de production
              </label>
              {isEditing ? (
                <select
                  value={editedDeal.productionServiceId || ''}
                  onChange={(e) => handleServiceChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                >
                  {serviceOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              ) : (
                <>
                  {currentService ? (
                    <span
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-white"
                      style={{ backgroundColor: currentService.color }}
                    >
                      {currentService.name}
                    </span>
                  ) : (
                    <span className="text-gray-400 italic text-sm">Aucun service assigné</span>
                  )}
                </>
              )}
            </div>

            {/* Étape du service (si un service est assigné) */}
            {currentService && stageOptionsForService.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Étape du service
                </label>
                {isEditing ? (
                  <select
                    value={editedDeal.productionStageId || ''}
                    onChange={(e) => updateField('productionStageId', e.target.value || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                  >
                    <option value="">Sélectionner une étape</option>
                    {stageOptionsForService.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                ) : (
                  <>
                    {(() => {
                      const currentStage = currentService.stages.find(s => s.id === deal.productionStageId);
                      return currentStage ? (
                        <span
                          className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium text-gray-800"
                          style={{ backgroundColor: currentStage.color }}
                        >
                          {currentStage.name}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic text-sm">Aucune étape</span>
                      );
                    })()}
                  </>
                )}
              </div>
            )}
          </>
        )}

        {/* Origine / Source */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Origine</label>
          {isEditing ? (
            <SelectField
              isEditing={true}
              value={editedDeal.origin}
              onChange={(v) => updateField('origin', v)}
              label="Origine"
              options={originOptions}
            />
          ) : (
            <>
              {deal.origin ? (
                <div className="flex items-center gap-2">
                  {(() => {
                    const config = originConfig[deal.origin];
                    if (config) {
                      const IconComponent = config.icon;
                      return (
                        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${config.bgColor} ${config.color}`}>
                          <IconComponent className="h-4 w-4" />
                          {config.label}
                        </span>
                      );
                    }
                    return <span className="text-gray-700">{deal.origin}</span>;
                  })()}
                </div>
              ) : (
                <p className="text-gray-400 italic">Non définie</p>
              )}
            </>
          )}
        </div>

        {/* Valeur */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Valeur</label>
          {isEditing ? (
            <EditableField
              isEditing={true}
              value={editedDeal.value}
              onChange={(v) => updateField('value', parseFloat(v) || 0)}
              label="Valeur"
              type="number"
              min={0}
            />
          ) : (
            <p className="text-gray-700 font-semibold">{deal.value.toLocaleString()} {deal.currency}</p>
          )}
        </div>

        {/* Probabilité */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Probabilité</label>
          {isEditing ? (
            <EditableField
              isEditing={true}
              value={editedDeal.probability}
              onChange={(v) => updateField('probability', parseInt(v) || 0)}
              label="Probabilité"
              type="number"
              min={0}
              max={100}
            />
          ) : (
            <p className="text-gray-700">{deal.probability}%</p>
          )}
        </div>

        {/* Date de RDV */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date de RDV</label>
          {isEditing ? (
            <EditableField
              isEditing={true}
              value={editedDeal.expectedCloseDate}
              onChange={(v) => updateField('expectedCloseDate', v)}
              label="Date de RDV"
              type="date"
            />
          ) : (
            <p className="text-gray-700">
              {deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toLocaleDateString('fr-FR') : 'Non défini'}
            </p>
          )}
        </div>

        {/* Mail de relance */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Mail de relance envoyé</label>
          <SelectField
            isEditing={isEditing}
            value={isEditing ? editedDeal.emailReminderSent : deal.emailReminderSent}
            onChange={(v) => updateField('emailReminderSent', v)}
            label="Mail relance"
            options={[
              { value: 'A_ENVOYER', label: 'À envoyer' },
              { value: 'OUI', label: 'Oui' },
            ]}
          />
        </div>

        {/* SMS de relance */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">SMS de relance envoyé</label>
          <SelectField
            isEditing={isEditing}
            value={isEditing ? editedDeal.smsReminderSent : deal.smsReminderSent}
            onChange={(v) => updateField('smsReminderSent', v)}
            label="SMS relance"
            options={[
              { value: 'NON', label: 'Non' },
              { value: 'OUI', label: 'Oui' },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
