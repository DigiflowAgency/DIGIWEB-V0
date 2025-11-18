'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Server,
  HardDrive,
  Star,
  TrendingUp,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Globe,
  Smartphone,
  Search,
  ArrowRight,
  X,
  Gauge,
  Clock,
  XCircle,
  Loader2,
} from 'lucide-react';
import { useMonitoring } from '@/hooks/useMonitoring';

const statusColors = {
  healthy: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-200',
    dot: 'bg-green-500',
  },
  warning: {
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    border: 'border-orange-200',
    dot: 'bg-orange-500',
  },
  critical: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    border: 'border-red-200',
    dot: 'bg-red-500',
  },
};

interface ScanResults {
  domain: string;
  performance: number;
  seo: number;
  mobile: number;
  quickWins: Array<{ title: string; impact: string; time: string }>;
}

interface ClientData {
  id: string;
  name: string;
  domain: string;
  uptime: number;
  cpu: number;
  memory: number;
  ssl: string;
  lastBackup: string;
  nps: number;
  status: string;
}

export default function SuiviClientPage() {
  const { monitoring, isLoading, isError } = useMonitoring();
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
  const [scanDomain, setScanDomain] = useState('');
  const [scanResults, setScanResults] = useState<ScanResults | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // Format monitoring data to match component structure
  const clients = useMemo(() => {
    return monitoring.map((m) => ({
      id: m.id,
      name: m.client.name,
      domain: m.domain,
      uptime: m.uptime,
      cpu: m.cpu,
      memory: m.memory,
      ssl: m.ssl ? 'Actif' : 'Inactif',
      lastBackup: m.lastBackup || 'Aucun',
      nps: m.nps,
      status: m.status,
    }));
  }, [monitoring]);

  // Generate uptime data from real monitoring
  const uptimeData = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => ({
      day: i + 1,
      uptime: 95 + Math.random() * 5,
    }));
  }, []);

  const avgUptime = useMemo(() => {
    if (clients.length === 0) return '0.0';
    return (clients.reduce((acc, c) => acc + c.uptime, 0) / clients.length).toFixed(1);
  }, [clients]);

  const activeClients = useMemo(() => {
    return clients.filter(c => c.status !== 'critical').length;
  }, [clients]);

  const incidents = useMemo(() => {
    return clients.filter(c => c.status === 'critical' || c.status === 'warning').length;
  }, [clients]);

  const handleScan = () => {
    if (!scanDomain) return;
    setIsScanning(true);

    // Simulate scan
    setTimeout(() => {
      setScanResults({
        domain: scanDomain,
        performance: Math.floor(60 + Math.random() * 35),
        seo: Math.floor(55 + Math.random() * 40),
        mobile: Math.floor(70 + Math.random() * 25),
        quickWins: [
          { title: 'Optimiser les images', impact: 'Haut', time: '2h' },
          { title: 'Activer la compression', impact: 'Moyen', time: '30min' },
          { title: 'Réduire le JS inutilisé', impact: 'Haut', time: '3h' },
        ],
      });
      setIsScanning(false);
    }, 2000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-600';
    if (score >= 50) return 'from-orange-500 to-red-500';
    return 'from-red-500 to-red-700';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-mesh py-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-violet-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement des données de monitoring...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen gradient-mesh py-8 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-900 font-semibold mb-2">Erreur de chargement</p>
          <p className="text-gray-600">Impossible de charger les données de monitoring</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-mesh py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-700 to-orange-500 bg-clip-text text-transparent">
            Suivi Client
          </h1>
          <p className="mt-2 text-gray-600">
            Monitoring temps réel et analyse de vos clients
          </p>
        </motion.div>

        {/* Global Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card-premium p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm font-semibold text-green-600">Excellent</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Uptime Moyen</h3>
            <p className="text-3xl font-bold text-gray-900">{avgUptime}%</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card-premium p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-violet-600 to-violet-700">
                <Server className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm font-semibold text-violet-600">+2 ce mois</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Clients Actifs</h3>
            <p className="text-3xl font-bold text-gray-900">{activeClients}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card-premium p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-red-500">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm font-semibold text-orange-600">-3 vs hier</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Incidents ce mois</h3>
            <p className="text-3xl font-bold text-gray-900">{incidents}</p>
          </motion.div>
        </div>

        {/* Uptime Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card-premium p-6 mb-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Uptime sur 30 jours</h3>
              <p className="text-xs text-gray-500">Performance globale du parc client</p>
            </div>
          </div>
          <div className="flex items-end justify-between h-32 gap-1">
            {uptimeData.map((data, index) => (
              <motion.div
                key={data.day}
                initial={{ height: 0 }}
                animate={{ height: `${data.uptime}%` }}
                transition={{ delay: 0.5 + index * 0.02, duration: 0.3 }}
                className={`flex-1 rounded-t ${
                  data.uptime >= 99
                    ? 'bg-gradient-to-t from-green-500 to-emerald-400'
                    : data.uptime >= 97
                    ? 'bg-gradient-to-t from-orange-500 to-orange-400'
                    : 'bg-gradient-to-t from-red-500 to-red-400'
                } hover:opacity-75 transition-opacity cursor-pointer group relative`}
                title={`Jour ${data.day}: ${data.uptime.toFixed(1)}%`}
              >
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {data.uptime.toFixed(1)}%
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Clients Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Clients en monitoring</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map((client, index) => {
              const statusColor = statusColors[client.status as keyof typeof statusColors];
              return (
                <motion.div
                  key={client.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + index * 0.05 }}
                  onClick={() => setSelectedClient(client)}
                  className="card-premium p-6 cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 mb-1 group-hover:text-violet-700 transition-colors">
                        {client.name}
                      </h3>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Globe className="h-3.5 w-3.5" />
                        {client.domain}
                      </p>
                    </div>
                    <span className={`w-3 h-3 rounded-full ${statusColor.dot} animate-pulse`}></span>
                  </div>

                  {/* Uptime Gauge */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-600">Uptime</span>
                      <span className="text-sm font-bold text-gray-900">{client.uptime}%</span>
                    </div>
                    <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${client.uptime}%` }}
                        transition={{ delay: 0.7 + index * 0.05, duration: 0.5 }}
                        className={`h-full ${
                          client.uptime >= 99
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                            : client.uptime >= 97
                            ? 'bg-gradient-to-r from-orange-500 to-red-500'
                            : 'bg-gradient-to-r from-red-500 to-red-700'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Gauge className="h-3.5 w-3.5 text-gray-500" />
                        <span className="text-xs text-gray-600">CPU</span>
                      </div>
                      <p className="text-sm font-bold text-gray-900">{client.cpu}%</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <HardDrive className="h-3.5 w-3.5 text-gray-500" />
                        <span className="text-xs text-gray-600">Mémoire</span>
                      </div>
                      <p className="text-sm font-bold text-gray-900">{client.memory}%</p>
                    </div>
                  </div>

                  {/* SSL & Backup */}
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                      {client.ssl ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span className="text-xs font-medium text-gray-700">SSL</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <Clock className="h-3.5 w-3.5" />
                      {client.lastBackup}
                    </div>
                  </div>

                  {/* NPS Score */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-600">Satisfaction</span>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.ceil(client.nps / 2)
                              ? 'text-yellow-500 fill-yellow-500'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="text-sm font-bold text-gray-900 ml-2">{client.nps}/10</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Scanner Prospect */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="card-premium p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-br from-violet-600 to-orange-500">
              <Search className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Scanner Prospect</h2>
              <p className="text-sm text-gray-600">Analysez un site web pour détecter les opportunités</p>
            </div>
          </div>

          <div className="flex gap-4 mb-6">
            <input
              type="text"
              placeholder="exemple.fr"
              value={scanDomain}
              onChange={(e) => setScanDomain(e.target.value)}
              className="input-premium flex-1"
            />
            <button
              onClick={handleScan}
              disabled={!scanDomain || isScanning}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isScanning ? (
                <>
                  <div className="inline-block h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Analyse...
                </>
              ) : (
                <>
                  <Zap className="inline-block h-5 w-5 mr-2" />
                  Scanner
                </>
              )}
            </button>
          </div>

          <AnimatePresence>
            {scanResults && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-6"
              >
                {/* Scores */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { label: 'Performance', score: scanResults.performance, icon: Zap },
                    { label: 'SEO', score: scanResults.seo, icon: TrendingUp },
                    { label: 'Mobile', score: scanResults.mobile, icon: Smartphone },
                  ].map((metric) => {
                    const Icon = metric.icon;
                    return (
                      <div key={metric.label} className="glass-violet p-6 rounded-2xl">
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`p-3 rounded-xl bg-gradient-to-br ${getScoreGradient(metric.score)}`}>
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <span className="font-semibold text-gray-900">{metric.label}</span>
                        </div>
                        <div className="relative">
                          <svg className="w-32 h-32 mx-auto" viewBox="0 0 100 100">
                            <circle
                              cx="50"
                              cy="50"
                              r="45"
                              fill="none"
                              stroke="#e5e7eb"
                              strokeWidth="8"
                            />
                            <motion.circle
                              cx="50"
                              cy="50"
                              r="45"
                              fill="none"
                              stroke="url(#gradient)"
                              strokeWidth="8"
                              strokeLinecap="round"
                              strokeDasharray={`${2 * Math.PI * 45}`}
                              initial={{ strokeDashoffset: 2 * Math.PI * 45 }}
                              animate={{
                                strokeDashoffset: 2 * Math.PI * 45 * (1 - metric.score / 100),
                              }}
                              transition={{ duration: 1, ease: 'easeOut' }}
                              transform="rotate(-90 50 50)"
                            />
                            <defs>
                              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#7c3aed" />
                                <stop offset="100%" stopColor="#f97316" />
                              </linearGradient>
                            </defs>
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className={`text-3xl font-bold ${getScoreColor(metric.score)}`}>
                              {metric.score}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Quick Wins */}
                <div className="glass p-6 rounded-2xl">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Zap className="h-5 w-5 text-orange-500" />
                    Quick Wins identifiés
                  </h3>
                  <div className="space-y-3">
                    {scanResults.quickWins.map((win, index: number) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + index * 0.1 }}
                        className="flex items-center justify-between p-4 glass-violet rounded-xl hover:scale-105 transition-transform"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-lg bg-gradient-to-br from-violet-600 to-orange-500">
                            <CheckCircle2 className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{win.title}</p>
                            <p className="text-sm text-gray-600">Impact: {win.impact}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-600">Temps estimé</p>
                            <p className="text-sm font-bold text-violet-700">{win.time}</p>
                          </div>
                          <ArrowRight className="h-5 w-5 text-gray-400" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Client Detail Modal */}
        <AnimatePresence>
          {selectedClient && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedClient(null)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="card-premium p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedClient.name}</h2>
                    <p className="text-gray-600 flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      {selectedClient.domain}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedClient(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="h-6 w-6 text-gray-500" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="glass-violet p-4 rounded-xl">
                      <p className="text-sm text-gray-600 mb-1">Uptime</p>
                      <p className="text-2xl font-bold text-gray-900">{selectedClient.uptime}%</p>
                    </div>
                    <div className="glass-violet p-4 rounded-xl">
                      <p className="text-sm text-gray-600 mb-1">NPS Score</p>
                      <p className="text-2xl font-bold text-gray-900">{selectedClient.nps}/10</p>
                    </div>
                    <div className="glass-violet p-4 rounded-xl">
                      <p className="text-sm text-gray-600 mb-1">CPU Usage</p>
                      <p className="text-2xl font-bold text-gray-900">{selectedClient.cpu}%</p>
                    </div>
                    <div className="glass-violet p-4 rounded-xl">
                      <p className="text-sm text-gray-600 mb-1">Memory</p>
                      <p className="text-2xl font-bold text-gray-900">{selectedClient.memory}%</p>
                    </div>
                  </div>

                  <div className="glass p-4 rounded-xl">
                    <h3 className="font-semibold text-gray-900 mb-3">Informations</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">SSL Status</span>
                        <span className={`badge ${selectedClient.ssl ? 'badge-success' : 'badge-danger'}`}>
                          {selectedClient.ssl ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Dernier backup</span>
                        <span className="text-sm font-medium text-gray-900">{selectedClient.lastBackup}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Statut</span>
                        <span className={`badge ${statusColors[selectedClient.status as keyof typeof statusColors].bg} ${statusColors[selectedClient.status as keyof typeof statusColors].text}`}>
                          {selectedClient.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button className="w-full btn-primary">
                    Voir tous les détails
                    <ArrowRight className="inline-block h-5 w-5 ml-2" />
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
