'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Phone,
  Calendar,
  Mail,
  Target,
  DollarSign,
  TrendingUp,
  ArrowLeft,
  Filter,
  AlertTriangle,
  Clock,
  Flame,
  Thermometer,
  Snowflake,
  CheckCircle,
  XCircle,
  FileText,
  User,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';

interface CommercialData {
  period: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    role: string;
  };
  metrics: {
    totalAppels: number;
    appelsRepondus: number;
    appelsMessagerie: number;
    appelsPasReponse: number;
    appelsRappel: number;
    tauxAppelsRepondus: number;
    dureeMoyenneAppel: number;
    totalRdv: number;
    rdvEffectues: number;
    rdvAnnules: number;
    tauxRdvHonores: number;
    dureeMoyenneRdv: number;
    totalEmails: number;
    dealsGagnes: number;
    dealsPerdus: number;
    dealsEnCours: number;
    dealsARelancer: number;
    caGagne: number;
    panierMoyen: number;
    tauxClosing: number;
    devisEnvoyes: number;
    devisAcceptes: number;
    tauxDevisAcceptes: number;
  };
  qualification: {
    leadsHot: number;
    leadsWarm: number;
    leadsCold: number;
    budgetOui: number;
    budgetNon: number;
    decideurOui: number;
    decideurNon: number;
    objections: { type: string; count: number }[];
    nextActions: { type: string; count: number }[];
  };
  weeklyEvolution: {
    week: string;
    appels: number;
    appelsRepondus: number;
    rdv: number;
    ventes: number;
    ca: number;
  }[];
  recentActivities: {
    id: string;
    type: string;
    status: string;
    outcome: string | null;
    duration: number | null;
    temperature: string | null;
    resultNotes: string | null;
    scheduledAt: string;
    completedAt: string | null;
    deal: { id: string; title: string; company: string | null } | null;
    contact: { id: string; name: string } | null;
  }[];
  dealsARelancer: {
    id: string;
    title: string;
    value: number;
    stage: string;
    company: string | null;
    contact: string | null;
    lastActivity: string | null;
    daysSinceContact: number | null;
  }[];
  dealsGagnes: {
    id: string;
    title: string;
    value: number;
    company: string | null;
    closedAt: string | null;
  }[];
  dealsPerdus: {
    id: string;
    title: string;
    value: number;
    company: string | null;
    lostReason: string | null;
    closedAt: string | null;
  }[];
  lostReasons: { reason: string; count: number }[];
}

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

const outcomeLabels: Record<string, string> = {
  ANSWERED: 'Repondu',
  VOICEMAIL: 'Messagerie',
  NO_ANSWER: 'Pas de reponse',
  CALLBACK: 'Rappel demande',
  PROPOSAL_SENT: 'Proposition envoyee',
};

const objectionLabels: Record<string, string> = {
  PRICE: 'Prix',
  TIMING: 'Timing',
  COMPETITOR: 'Concurrent',
  NO_NEED: 'Pas de besoin',
  OTHER: 'Autre',
};

const nextActionLabels: Record<string, string> = {
  CALLBACK: 'Rappeler',
  SEND_QUOTE: 'Envoyer devis',
  MEETING: 'Planifier RDV',
  FOLLOWUP: 'Relance',
  CLOSE: 'Cloturer',
};

const lostReasonLabels: Record<string, string> = {
  PRICE: 'Prix trop cher',
  TIMING: 'Mauvais timing',
  COMPETITOR: 'Concurrent',
  NO_BUDGET: 'Pas de budget',
  NO_RESPONSE: 'Sans reponse',
  OTHER: 'Autre',
};

const typeLabels: Record<string, string> = {
  APPEL: 'Appel',
  EMAIL: 'Email',
  REUNION: 'RDV',
  VISIO: 'Visio',
};

export default function CommercialDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<CommercialData | null>(null);
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
  }, [session, status, period, id]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/analytics/commerciaux/${id}?period=${period}`);
      const json = await res.json();

      if (json.error) {
        setError(json.error);
        return;
      }

      setData(json);
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!data || error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-lg mx-auto">
          <h2 className="text-lg font-semibold text-red-700 mb-2">Erreur</h2>
          <p className="text-red-600">{error || 'Erreur lors du chargement'}</p>
          <Link href="/dashboard/analytics/commerciaux" className="mt-4 inline-block text-violet-600 hover:underline">
            Retour a la liste
          </Link>
        </div>
      </div>
    );
  }

  const { user, metrics, qualification, weeklyEvolution, recentActivities, dealsARelancer, dealsGagnes, dealsPerdus, lostReasons } = data;

  // Donnees pour les graphiques
  const appelsData = [
    { name: 'Repondus', value: metrics.appelsRepondus, color: '#10b981' },
    { name: 'Messagerie', value: metrics.appelsMessagerie, color: '#f59e0b' },
    { name: 'Pas reponse', value: metrics.appelsPasReponse, color: '#ef4444' },
    { name: 'Rappel', value: metrics.appelsRappel, color: '#8b5cf6' },
  ].filter(d => d.value > 0);

  const temperatureData = [
    { name: 'Chaud', value: qualification.leadsHot, color: '#ef4444' },
    { name: 'Tiede', value: qualification.leadsWarm, color: '#f59e0b' },
    { name: 'Froid', value: qualification.leadsCold, color: '#3b82f6' },
  ].filter(d => d.value > 0);

  const dealsData = [
    { name: 'Gagnes', value: metrics.dealsGagnes, color: '#10b981' },
    { name: 'Perdus', value: metrics.dealsPerdus, color: '#ef4444' },
    { name: 'En cours', value: metrics.dealsEnCours, color: '#8b5cf6' },
  ];

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/analytics/commerciaux"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-violet-500 flex items-center justify-center text-white text-2xl font-bold">
              {user.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
              <p className="text-gray-600">{user.email}</p>
            </div>
          </div>
        </div>

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
            <option value="year">Cette annee</option>
            <option value="all">Tout</option>
          </select>
        </div>
      </div>

      {/* KPIs principaux */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        <KPICard icon={<Phone />} label="Appels" value={metrics.totalAppels} subValue={`${metrics.tauxAppelsRepondus.toFixed(0)}% rep.`} color="blue" />
        <KPICard icon={<Calendar />} label="RDV" value={metrics.rdvEffectues} subValue={`/${metrics.totalRdv} pris`} color="green" />
        <KPICard icon={<Mail />} label="Emails" value={metrics.totalEmails} subValue="envoyes" color="purple" />
        <KPICard icon={<Target />} label="Ventes" value={metrics.dealsGagnes} subValue={`-${metrics.dealsPerdus} perdus`} color="emerald" />
        <KPICard icon={<DollarSign />} label="CA" value={`${(metrics.caGagne / 1000).toFixed(1)}k€`} subValue={`Panier: ${metrics.panierMoyen.toFixed(0)}€`} color="green" />
        <KPICard icon={<TrendingUp />} label="Closing" value={`${metrics.tauxClosing.toFixed(0)}%`} subValue="taux" color="violet" />
      </div>

      {/* Alerte relance */}
      {metrics.dealsARelancer > 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
            <div>
              <p className="font-semibold text-amber-800">
                {metrics.dealsARelancer} deal{metrics.dealsARelancer > 1 ? 's' : ''} a relancer
              </p>
              <p className="text-sm text-amber-600">Sans contact depuis plus de 7 jours</p>
            </div>
          </div>
        </div>
      )}

      {/* Graphiques ligne 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Evolution hebdomadaire */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Evolution hebdomadaire</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weeklyEvolution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="week" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="appels" name="Appels" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="rdv" name="RDV" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="ventes" name="Ventes" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Resultats appels */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Resultats des appels</h3>
          {appelsData.length === 0 ? (
            <p className="text-gray-500 text-sm italic text-center py-8">Aucune donnee</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={appelsData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {appelsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="mt-2 text-center text-sm text-gray-600">
            Duree moyenne: <span className="font-bold">{metrics.dureeMoyenneAppel} min</span>
          </div>
        </div>
      </div>

      {/* Graphiques ligne 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Temperature leads */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Thermometer className="h-5 w-5 text-violet-600" />
            Temperature des leads
          </h3>
          {temperatureData.length === 0 ? (
            <p className="text-gray-500 text-sm italic text-center py-8">Aucune donnee</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie
                    data={temperatureData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {temperatureData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2">
                <div className="flex items-center gap-1 text-sm">
                  <Flame className="h-4 w-4 text-red-500" />
                  <span>{qualification.leadsHot}</span>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Thermometer className="h-4 w-4 text-orange-500" />
                  <span>{qualification.leadsWarm}</span>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Snowflake className="h-4 w-4 text-blue-500" />
                  <span>{qualification.leadsCold}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Deals */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-violet-600" />
            Repartition des deals
          </h3>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie
                data={dealsData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={60}
                paddingAngle={2}
                dataKey="value"
              >
                {dealsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2 text-sm">
            <span className="text-green-600 font-medium">{metrics.dealsGagnes} gagnes</span>
            <span className="text-red-600 font-medium">{metrics.dealsPerdus} perdus</span>
            <span className="text-violet-600 font-medium">{metrics.dealsEnCours} en cours</span>
          </div>
        </div>

        {/* Qualification */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Qualification</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Budget discute</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-green-500 h-3 rounded-full"
                    style={{
                      width: `${(qualification.budgetOui / Math.max(1, qualification.budgetOui + qualification.budgetNon)) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-sm font-medium">{qualification.budgetOui}/{qualification.budgetOui + qualification.budgetNon}</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Decideur identifie</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-violet-500 h-3 rounded-full"
                    style={{
                      width: `${(qualification.decideurOui / Math.max(1, qualification.decideurOui + qualification.decideurNon)) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-sm font-medium">{qualification.decideurOui}/{qualification.decideurOui + qualification.decideurNon}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Objections et prochaines actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Objections */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            Objections rencontrees
          </h3>
          {qualification.objections.length === 0 ? (
            <p className="text-gray-500 text-sm italic">Aucune objection enregistree</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={qualification.objections} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="type"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => objectionLabels[value] || value}
                  width={80}
                />
                <Tooltip formatter={(value, name, props) => [value, objectionLabels[props.payload.type] || props.payload.type]} />
                <Bar dataKey="count" fill="#ef4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Prochaines actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Prochaines actions planifiees
          </h3>
          {qualification.nextActions.length === 0 ? (
            <p className="text-gray-500 text-sm italic">Aucune action planifiee</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={qualification.nextActions} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="type"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => nextActionLabels[value] || value}
                  width={100}
                />
                <Tooltip formatter={(value, name, props) => [value, nextActionLabels[props.payload.type] || props.payload.type]} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Deals a relancer */}
      {dealsARelancer.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Deals a relancer ({dealsARelancer.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Deal</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Entreprise</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Valeur</th>
                  <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600">Stage</th>
                  <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600">Dernier contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {dealsARelancer.slice(0, 10).map((deal) => (
                  <tr key={deal.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{deal.title}</td>
                    <td className="px-4 py-3 text-gray-600">{deal.company || '-'}</td>
                    <td className="px-4 py-3 text-right font-semibold">{(deal.value / 1000).toFixed(1)}k€</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-1 bg-violet-100 text-violet-700 rounded text-xs">{deal.stage}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {deal.daysSinceContact !== null ? (
                        <span className={`text-sm ${deal.daysSinceContact > 14 ? 'text-red-600 font-bold' : 'text-amber-600'}`}>
                          il y a {deal.daysSinceContact}j
                        </span>
                      ) : (
                        <span className="text-red-600 font-bold">Jamais</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Activites recentes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-violet-600" />
          Activites recentes
        </h3>
        {recentActivities.length === 0 ? (
          <p className="text-gray-500 text-sm italic">Aucune activite enregistree</p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className={`p-2 rounded-lg ${
                  activity.type === 'APPEL' ? 'bg-blue-100' :
                  activity.type === 'EMAIL' ? 'bg-purple-100' :
                  'bg-green-100'
                }`}>
                  {activity.type === 'APPEL' ? <Phone className="h-4 w-4 text-blue-600" /> :
                   activity.type === 'EMAIL' ? <Mail className="h-4 w-4 text-purple-600" /> :
                   <Calendar className="h-4 w-4 text-green-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{typeLabels[activity.type] || activity.type}</span>
                    {activity.outcome && (
                      <span className="text-xs text-gray-500">
                        - {outcomeLabels[activity.outcome] || activity.outcome}
                      </span>
                    )}
                    {activity.duration && (
                      <span className="text-xs text-gray-400">({activity.duration} min)</span>
                    )}
                    {activity.temperature && (
                      <span>
                        {activity.temperature === 'HOT' && <Flame className="h-3 w-3 text-red-500" />}
                        {activity.temperature === 'WARM' && <Thermometer className="h-3 w-3 text-orange-500" />}
                        {activity.temperature === 'COLD' && <Snowflake className="h-3 w-3 text-blue-500" />}
                      </span>
                    )}
                  </div>
                  {activity.deal && (
                    <p className="text-sm text-gray-600">
                      {activity.deal.company || activity.deal.title}
                    </p>
                  )}
                  {activity.resultNotes && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-1">"{activity.resultNotes}"</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(activity.scheduledAt).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

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
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    violet: 'bg-violet-50 text-violet-600 border-violet-200',
  };

  return (
    <div className={`rounded-xl border-2 p-3 ${colorClasses[color]}`}>
      <div className="flex items-center gap-2">
        <div className="opacity-80">{icon}</div>
        <div>
          <p className="text-xs font-medium opacity-80">{label}</p>
          <p className="text-xl font-bold">{value}</p>
          <p className="text-xs opacity-70">{subValue}</p>
        </div>
      </div>
    </div>
  );
}
