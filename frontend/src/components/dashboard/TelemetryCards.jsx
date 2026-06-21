import { Network, FileText, GitBranch, Zap } from 'lucide-react';

export default function HeaderStats({ telemetry }) {
  const stats = [
    { icon: <Network size={12} />, value: telemetry.clusters, label: 'clusters', color: '#ea580c' },
    { icon: <FileText size={12} />, value: telemetry.files, label: 'files', color: '#f59e0b' },
    { icon: <GitBranch size={12} />, value: telemetry.dependencies || 0, label: 'deps', color: '#8b5cf6' },
    { icon: <Zap size={12} />, value: telemetry.throughput, label: '', color: '#06b6d4', isText: true },
  ];

  return (
    <div className="header-stats">
      {stats.map((stat, i) => (
        <div key={i} className="header-stat-pill" style={{ '--pill-color': stat.color }}>
          <span className="header-stat-icon" style={{ color: stat.color }}>{stat.icon}</span>
          <span className="header-stat-value">{stat.value}</span>
          {stat.label && <span className="header-stat-label">{stat.label}</span>}
        </div>
      ))}
      {telemetry.activeTrace && (
        <div className="header-stat-pill active-trace" style={{ '--pill-color': '#ea580c' }}>
          <span className="header-stat-trace-dot" />
          <span className="header-stat-value">{telemetry.activeTrace}</span>
        </div>
      )}
    </div>
  );
}
