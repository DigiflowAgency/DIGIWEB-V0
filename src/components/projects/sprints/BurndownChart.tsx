'use client';

import { useBurndown } from '@/hooks/projects';

interface BurndownChartProps {
  projectId: string;
  sprintId: string;
  type?: 'burndown' | 'burnup';
}

export default function BurndownChart({ projectId, sprintId, type = 'burndown' }: BurndownChartProps) {
  const { sprint, chartData, isLoading, isError } = useBurndown(projectId, sprintId, type);

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
      </div>
    );
  }

  if (isError || !sprint) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        Impossible de charger le graphique
      </div>
    );
  }

  // Find max value for scaling
  const maxValue = Math.max(
    sprint.plannedPoints,
    ...chartData.map(d => Math.max(d.ideal, d.actual))
  );

  // Calculate SVG dimensions
  const width = 600;
  const height = 200;
  const padding = { top: 20, right: 30, bottom: 40, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Scale functions
  const xScale = (index: number) => padding.left + (index / (chartData.length - 1)) * chartWidth;
  const yScale = (value: number) => padding.top + chartHeight - (value / maxValue) * chartHeight;

  // Generate path for ideal line
  const idealPath = chartData
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(d.ideal)}`)
    .join(' ');

  // Generate path for actual line (only up to today)
  const today = new Date().toISOString().split('T')[0];
  const actualData = chartData.filter(d => d.date <= today);
  const actualPath = actualData
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(d.actual)}`)
    .join(' ');

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900">
          {type === 'burndown' ? 'Burndown' : 'Burnup'} - {sprint.name}
        </h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-gray-400" />
            <span className="text-gray-500">Idéal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-blue-500" />
            <span className="text-gray-500">Réel</span>
          </div>
        </div>
      </div>

      <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
          <g key={ratio}>
            <line
              x1={padding.left}
              y1={yScale(maxValue * ratio)}
              x2={width - padding.right}
              y2={yScale(maxValue * ratio)}
              stroke="#E5E7EB"
              strokeDasharray="4 4"
            />
            <text
              x={padding.left - 10}
              y={yScale(maxValue * ratio)}
              textAnchor="end"
              alignmentBaseline="middle"
              className="text-xs fill-gray-400"
            >
              {Math.round(maxValue * ratio)}
            </text>
          </g>
        ))}

        {/* Ideal line */}
        <path
          d={idealPath}
          fill="none"
          stroke="#9CA3AF"
          strokeWidth="2"
          strokeDasharray="4 4"
        />

        {/* Actual line */}
        {actualData.length > 1 && (
          <path
            d={actualPath}
            fill="none"
            stroke="#3B82F6"
            strokeWidth="2"
          />
        )}

        {/* Data points for actual */}
        {actualData.map((d, i) => (
          <circle
            key={d.date}
            cx={xScale(i)}
            cy={yScale(d.actual)}
            r="4"
            fill="#3B82F6"
          />
        ))}

        {/* X-axis labels */}
        {chartData.filter((_, i) => i === 0 || i === chartData.length - 1 || i === Math.floor(chartData.length / 2)).map((d, i, arr) => {
          const originalIndex = i === 0 ? 0 : i === arr.length - 1 ? chartData.length - 1 : Math.floor(chartData.length / 2);
          return (
            <text
              key={d.date}
              x={xScale(originalIndex)}
              y={height - 10}
              textAnchor="middle"
              className="text-xs fill-gray-400"
            >
              {new Date(d.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
            </text>
          );
        })}

        {/* Y-axis label */}
        <text
          x={15}
          y={height / 2}
          textAnchor="middle"
          transform={`rotate(-90, 15, ${height / 2})`}
          className="text-xs fill-gray-400"
        >
          Points
        </text>
      </svg>

      {/* Stats */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 text-sm">
        <div>
          <span className="text-gray-500">Planifié:</span>
          <span className="ml-1 font-medium">{sprint.plannedPoints} pts</span>
        </div>
        <div>
          <span className="text-gray-500">Complété:</span>
          <span className="ml-1 font-medium text-green-600">{sprint.completedPoints} pts</span>
        </div>
        <div>
          <span className="text-gray-500">Restant:</span>
          <span className="ml-1 font-medium text-blue-600">
            {sprint.plannedPoints - sprint.completedPoints} pts
          </span>
        </div>
      </div>
    </div>
  );
}
