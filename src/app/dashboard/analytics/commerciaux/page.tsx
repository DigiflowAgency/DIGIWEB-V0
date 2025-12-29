'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Phone,
  MessageSquare,
  Calendar,
  CheckCircle,
  FileText,
  Target,
  DollarSign,
  TrendingUp,
  Users,
  BarChart3,
  Filter,
  Download,
  XCircle,
  Flame,
  Thermometer,
  Snowflake,
  AlertTriangle,
  Clock,
  PieChart,
  ArrowRight,
  ChevronRight,
  Eye,
} from 'lucide-react';

interface UserMetrics {
  id: string;
  name: string;
  avatar: string | null;
  appels: number;
  appelsRepondus: number;
  rdvPris: number;
  rdvEffectues: number;
  emails: number;
  devisEnvoyes: number;
  ventesSignees: number;
  caSignee: number;
  dealsEnCours: number;
  dealsPerdus: number;
  tauxAppelsRepondus: number;
  tauxRdvHonores: number;
  tauxClosing: number;
  panierMoyen: number;
}

interface GlobalMetrics {
  totalAppels: number;
  totalAppelsRepondus: number;
  totalRdvPris: number;
  totalRdvEffectues: number;
  totalDevisEnvoyes: number;
  totalVentes: number;
  totalCA: number;
  tauxAppelsRepondus: number;
  tauxRdvHonores: number;
  tauxDevisAcceptes: number;
  tauxClosing: number;
  panierMoyen: number;
}

interface WeeklyData {
  week: string;
  startDate: string;
  ventes: number;
  ca: number;
  appels: number;
  rdv: number;
}

interface LostReason {
  reason: string;
  count: number;
}

interface QualificationMetrics {
  leadsHot: number;
  leadsWarm: number;
  leadsCold: number;
  budgetDiscuteOui: number;
  budgetDiscuteNon: number;
  decisionMakerOui: number;
  decisionMakerNon: number;
  objections: { type: string; count: number }[];
  outcomes: { type: string; count: number }[];
  dealsARelancer: number;
  delaiMoyenRelance: number;
}

interface NextAction {
  type: string;
  count: number;
}

interface AnalyticsData {
  period: string;
  globalMetrics: GlobalMetrics;
  userMetrics: UserMetrics[];
  weeklyEvolution: WeeklyData[];
  lostReasons: LostReason[];
  qualificationMetrics?: QualificationMetrics;
  nextActions?: NextAction[];
}

export default function CommerciauxAnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user || session.user.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }
    fetchData();
  }, [session, status, period]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/analytics/commerciaux?period=${period}`);
      const json = await res.json();

      // Vérifier que la réponse contient les données attendues
      if (json.error || !json.globalMetrics) {
        console.error('Erreur API:', json.error || 'Données manquantes');
        setError(json.error || 'Erreur lors du chargement des données');
        setData(null);
        return;
      }

      setData(json);
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur de connexion au serveur');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des analytics...</p>
        </div>
      </div>
    );
  }

  if (!data || error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-lg mx-auto">
          <h2 className="text-lg font-semibold text-red-700 mb-2">Erreur</h2>
          <p className="text-red-600">{error || 'Erreur lors du chargement des données'}</p>
          <button
            onClick={() => fetchData()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const { globalMetrics, userMetrics, weeklyEvolution, lostReasons, qualificationMetrics, nextActions } = data;

  const lostReasonLabels: Record<string, string> = {
    PRICE: 'Prix trop cher',
    TIMING: 'Mauvais timing',
    COMPETITOR: 'Concurrent',
    NO_BUDGET: 'Pas de budget',
    NO_RESPONSE: 'Sans réponse',
    OTHER: 'Autre',
  };

  const objectionLabels: Record<string, string> = {
    PRICE: 'Prix',
    TIMING: 'Timing',
    COMPETITOR: 'Concurrent',
    NO_NEED: 'Pas de besoin',
    OTHER: 'Autre',
  };

  const outcomeLabels: Record<string, string> = {
    ANSWERED: 'Repondu',
    VOICEMAIL: 'Messagerie',
    NO_ANSWER: 'Pas de reponse',
    CALLBACK: 'Rappel demande',
    PROPOSAL_SENT: 'Proposition envoyee',
  };

  const nextActionLabels: Record<string, string> = {
    CALLBACK: 'Rappeler',
    SEND_QUOTE: 'Envoyer devis',
    MEETING: 'Planifier RDV',
    FOLLOWUP: 'Relance',
    CLOSE: 'Cloturer',
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-violet-600" />
            Analytics Commerciaux
          </h1>
          <p className="text-gray-600 mt-2">
            Performances détaillées de l'équipe commerciale
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Filtre période */}
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="border-0 bg-transparent text-sm font-medium text-gray-700 focus:ring-0"
            >
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
              <option value="quarter">Ce trimestre</option>
              <option value="year">Cette année</option>
              <option value="all">Tout</option>
            </select>
          </div>

          {/* Export */}
          <button className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700">
            <Download className="h-4 w-4" />
            Exporter
          </button>
        </div>
      </div>

      {/* KPIs Globaux - Ligne 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KPICard
          icon={<Phone className="h-6 w-6" />}
          label="Appels"
          value={globalMetrics.totalAppels}
          subValue={`${globalMetrics.tauxAppelsRepondus.toFixed(0)}% répondus`}
          color="blue"
        />
        <KPICard
          icon={<MessageSquare className="h-6 w-6" />}
          label="Discussions"
          value={globalMetrics.totalAppelsRepondus}
          subValue={`sur ${globalMetrics.totalAppels} appels`}
          color="green"
        />
        <KPICard
          icon={<Calendar className="h-6 w-6" />}
          label="RDV pris"
          value={globalMetrics.totalRdvPris}
          subValue={`${globalMetrics.tauxRdvHonores.toFixed(0)}% honorés`}
          color="orange"
        />
        <KPICard
          icon={<CheckCircle className="h-6 w-6" />}
          label="RDV effectués"
          value={globalMetrics.totalRdvEffectues}
          subValue={`${globalMetrics.tauxRdvHonores.toFixed(0)}% taux`}
          color="teal"
        />
      </div>

      {/* KPIs Globaux - Ligne 2 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KPICard
          icon={<FileText className="h-6 w-6" />}
          label="Devis envoyés"
          value={globalMetrics.totalDevisEnvoyes}
          subValue={`${globalMetrics.tauxDevisAcceptes.toFixed(0)}% acceptés`}
          color="purple"
        />
        <KPICard
          icon={<Target className="h-6 w-6" />}
          label="Ventes"
          value={globalMetrics.totalVentes}
          subValue="signées"
          color="emerald"
        />
        <KPICard
          icon={<DollarSign className="h-6 w-6" />}
          label="CA signé"
          value={`${(globalMetrics.totalCA / 1000).toFixed(1)}k€`}
          subValue={`Panier: ${globalMetrics.panierMoyen.toFixed(0)}€`}
          color="green"
        />
        <KPICard
          icon={<TrendingUp className="h-6 w-6" />}
          label="Taux closing"
          value={`${globalMetrics.tauxClosing.toFixed(0)}%`}
          subValue="ventes/total"
          color="violet"
        />
      </div>

      {/* Tableau par commercial */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-violet-600" />
            Détail par commercial
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Commercial
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                  Appels
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                  Discussions
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                  RDV
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                  Devis
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                  Ventes
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                  CA
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                  Tx Closing
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {userMetrics.map((user, index) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                          index === 0
                            ? 'bg-yellow-500'
                            : index === 1
                            ? 'bg-gray-400'
                            : index === 2
                            ? 'bg-orange-400'
                            : 'bg-violet-500'
                        }`}
                      >
                        {user.name.charAt(0)}
                      </div>
                      <span className="font-medium text-gray-900">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="font-semibold text-gray-900">{user.appels}</span>
                    <span className="text-xs text-gray-500 block">
                      {user.tauxAppelsRepondus.toFixed(0)}% rép.
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="font-semibold text-gray-900">{user.appelsRepondus}</span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="font-semibold text-gray-900">{user.rdvEffectues}</span>
                    <span className="text-xs text-gray-500 block">/{user.rdvPris} pris</span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="font-semibold text-gray-900">{user.devisEnvoyes}</span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="font-semibold text-green-600">{user.ventesSignees}</span>
                    {user.dealsPerdus > 0 && (
                      <span className="text-xs text-red-500 block">-{user.dealsPerdus}</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="font-bold text-gray-900">
                      {(user.caSignee / 1000).toFixed(1)}k€
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span
                      className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${
                        user.tauxClosing >= 30
                          ? 'bg-green-100 text-green-700'
                          : user.tauxClosing >= 20
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {user.tauxClosing.toFixed(0)}%
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <Link
                      href={`/dashboard/analytics/commerciaux/${user.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-violet-100 text-violet-700 hover:bg-violet-200 rounded-lg text-sm font-medium transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                      Voir
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ligne du bas: Evolution + Raisons de perte */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolution hebdomadaire */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-violet-600" />
            Évolution (4 dernières semaines)
          </h3>
          <div className="space-y-3">
            {weeklyEvolution.map((week) => (
              <div key={week.week} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-700">{week.week}</span>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <span className="font-bold text-gray-900">{week.appels}</span>
                    <span className="text-gray-500 ml-1">appels</span>
                  </div>
                  <div className="text-center">
                    <span className="font-bold text-gray-900">{week.rdv}</span>
                    <span className="text-gray-500 ml-1">RDV</span>
                  </div>
                  <div className="text-center">
                    <span className="font-bold text-green-600">{week.ventes}</span>
                    <span className="text-gray-500 ml-1">ventes</span>
                  </div>
                  <div className="text-center">
                    <span className="font-bold text-violet-600">
                      {(week.ca / 1000).toFixed(1)}k€
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Raisons de perte */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            Raisons de perte
          </h3>
          {lostReasons.length === 0 ? (
            <p className="text-gray-500 text-sm italic">
              Aucune raison de perte enregistrée. Pensez à renseigner le champ "Raison de perte"
              lors du refus d'un deal.
            </p>
          ) : (
            <div className="space-y-3">
              {lostReasons.map((reason) => {
                const total = lostReasons.reduce((sum, r) => sum + r.count, 0);
                const percentage = total > 0 ? (reason.count / total) * 100 : 0;
                return (
                  <div key={reason.reason} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">
                      {lostReasonLabels[reason.reason] || reason.reason}
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-red-500 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-900 w-8">{reason.count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Taux de qualité */}
      <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Taux de qualite globaux</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <ProgressBar
            label="Taux appels repondus"
            value={globalMetrics.tauxAppelsRepondus}
            color="blue"
          />
          <ProgressBar label="Taux RDV honores" value={globalMetrics.tauxRdvHonores} color="green" />
          <ProgressBar
            label="Taux acceptation devis"
            value={globalMetrics.tauxDevisAcceptes}
            color="purple"
          />
          <ProgressBar label="Taux closing global" value={globalMetrics.tauxClosing} color="violet" />
        </div>
      </div>

      {/* Section Qualification (NOUVEAU) */}
      {qualificationMetrics && (
        <>
          {/* Alertes */}
          {qualificationMetrics.dealsARelancer > 0 && (
            <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
                <div>
                  <p className="font-semibold text-amber-800">
                    {qualificationMetrics.dealsARelancer} deal{qualificationMetrics.dealsARelancer > 1 ? 's' : ''} a relancer
                  </p>
                  <p className="text-sm text-amber-600">
                    Delai moyen depuis dernier contact: {qualificationMetrics.delaiMoyenRelance} jours
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Temperature des leads + Outcomes */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            {/* Temperature */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Thermometer className="h-5 w-5 text-violet-600" />
                Temperature des leads
              </h3>
              {(qualificationMetrics.leadsHot + qualificationMetrics.leadsWarm + qualificationMetrics.leadsCold) === 0 ? (
                <p className="text-gray-500 text-sm italic">Aucune donnee de temperature</p>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Flame className="h-5 w-5 text-red-500" />
                      <span className="text-sm font-medium">Chaud</span>
                    </div>
                    <span className="text-lg font-bold text-red-600">{qualificationMetrics.leadsHot}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Thermometer className="h-5 w-5 text-orange-500" />
                      <span className="text-sm font-medium">Tiede</span>
                    </div>
                    <span className="text-lg font-bold text-orange-600">{qualificationMetrics.leadsWarm}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Snowflake className="h-5 w-5 text-blue-500" />
                      <span className="text-sm font-medium">Froid</span>
                    </div>
                    <span className="text-lg font-bold text-blue-600">{qualificationMetrics.leadsCold}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Outcomes des appels */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Phone className="h-5 w-5 text-violet-600" />
                Resultats des appels
              </h3>
              {qualificationMetrics.outcomes.length === 0 ? (
                <p className="text-gray-500 text-sm italic">Aucune donnee d'appels</p>
              ) : (
                <div className="space-y-2">
                  {qualificationMetrics.outcomes.map((outcome) => {
                    const total = qualificationMetrics.outcomes.reduce((sum, o) => sum + o.count, 0);
                    const percentage = total > 0 ? (outcome.count / total) * 100 : 0;
                    return (
                      <div key={outcome.type} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">
                          {outcomeLabels[outcome.type] || outcome.type}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-violet-500 h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold w-8 text-right">{outcome.count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Objections */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                Objections rencontrees
              </h3>
              {qualificationMetrics.objections.length === 0 ? (
                <p className="text-gray-500 text-sm italic">Aucune objection enregistree</p>
              ) : (
                <div className="space-y-2">
                  {qualificationMetrics.objections.map((objection) => {
                    const total = qualificationMetrics.objections.reduce((sum, o) => sum + o.count, 0);
                    const percentage = total > 0 ? (objection.count / total) * 100 : 0;
                    return (
                      <div key={objection.type} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">
                          {objectionLabels[objection.type] || objection.type}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-red-500 h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold w-8 text-right">{objection.count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Budget & Decision + Prochaines actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Budget & Decision maker */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <PieChart className="h-5 w-5 text-violet-600" />
                Qualification des leads
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Budget discute</p>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-green-600">Oui</span>
                        <span className="font-bold">{qualificationMetrics.budgetDiscuteOui}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{
                            width: `${
                              (qualificationMetrics.budgetDiscuteOui /
                                Math.max(1, qualificationMetrics.budgetDiscuteOui + qualificationMetrics.budgetDiscuteNon)) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-red-600">Non</span>
                        <span className="font-bold">{qualificationMetrics.budgetDiscuteNon}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-red-500 h-2 rounded-full"
                          style={{
                            width: `${
                              (qualificationMetrics.budgetDiscuteNon /
                                Math.max(1, qualificationMetrics.budgetDiscuteOui + qualificationMetrics.budgetDiscuteNon)) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Decideur identifie</p>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-green-600">Oui</span>
                        <span className="font-bold">{qualificationMetrics.decisionMakerOui}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{
                            width: `${
                              (qualificationMetrics.decisionMakerOui /
                                Math.max(1, qualificationMetrics.decisionMakerOui + qualificationMetrics.decisionMakerNon)) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-red-600">Non</span>
                        <span className="font-bold">{qualificationMetrics.decisionMakerNon}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-red-500 h-2 rounded-full"
                          style={{
                            width: `${
                              (qualificationMetrics.decisionMakerNon /
                                Math.max(1, qualificationMetrics.decisionMakerOui + qualificationMetrics.decisionMakerNon)) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Prochaines actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <ArrowRight className="h-5 w-5 text-violet-600" />
                Prochaines actions planifiees
              </h3>
              {!nextActions || nextActions.length === 0 ? (
                <p className="text-gray-500 text-sm italic">Aucune prochaine action definie</p>
              ) : (
                <div className="space-y-2">
                  {nextActions.map((action) => {
                    const total = nextActions.reduce((sum, a) => sum + a.count, 0);
                    const percentage = total > 0 ? (action.count / total) * 100 : 0;
                    return (
                      <div key={action.type} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">
                          {nextActionLabels[action.type] || action.type}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-violet-500 h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold w-8 text-right">{action.count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Composant KPI Card
function KPICard({
  icon,
  label,
  value,
  subValue,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue: string;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    teal: 'bg-teal-50 text-teal-600 border-teal-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    violet: 'bg-violet-50 text-violet-600 border-violet-200',
  };

  return (
    <div className={`rounded-xl border-2 p-4 ${colorClasses[color]}`}>
      <div className="flex items-center gap-3">
        <div className="opacity-80">{icon}</div>
        <div>
          <p className="text-xs font-medium opacity-80">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs opacity-70">{subValue}</p>
        </div>
      </div>
    </div>
  );
}

// Composant Progress Bar
function ProgressBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    violet: 'bg-violet-500',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600">{label}</span>
        <span className="text-sm font-bold text-gray-900">{value.toFixed(0)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${colorClasses[color]}`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
}
