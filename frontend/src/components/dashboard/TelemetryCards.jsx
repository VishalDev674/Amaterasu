import { useEffect, useRef, useState } from 'react';
import { Network, Layers, Database, Zap } from 'lucide-react';

function AnimatedValue({ value, suffix = '' }) {
  const [display, setDisplay] = useState(value);
  const [pulse, setPulse] = useState(false);
  const prevRef = useRef(value);

  useEffect(() => {
    if (value !== prevRef.current) {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 600);
      prevRef.current = value;
      setDisplay(value);
      return () => clearTimeout(timer);
    }
  }, [value]);

  return (
    <span className={`telemetry-card-value ${pulse ? 'telemetry-value-pulse' : ''}`}>
      {display}{suffix}
    </span>
  );
}

export default function TelemetryCards({ telemetry }) {
  const cards = [
    {
      label: 'Concept Clusters',
      value: telemetry.clusters,
      icon: <Network size={14} />,
      meta: 'AST Ingestion Engine',
      accent: '#ea580c',
    },
    {
      label: 'Active Trace',
      value: telemetry.activeTrace || '—',
      icon: <Layers size={14} />,
      meta: 'Flow Vector Logic',
      accent: '#f59e0b',
      isText: true,
    },
    {
      label: 'RAG Cache',
      value: telemetry.cacheHealth,
      suffix: '%',
      icon: <Database size={14} />,
      meta: 'Vector Store Cache',
      accent: '#8b5cf6',
    },
    {
      label: 'LPU Throughput',
      value: telemetry.throughput,
      icon: <Zap size={14} />,
      meta: 'Groq SDK Pipeline',
      accent: '#06b6d4',
      isText: true,
    },
  ];

  return (
    <div className="telemetry-grid">
      {cards.map((card, i) => (
        <div
          key={i}
          className="telemetry-card"
          style={{ '--card-accent': card.accent }}
        >
          <div className="telemetry-card-header">
            <span className="telemetry-card-label">{card.label}</span>
            <span className="telemetry-card-icon" style={{ color: card.accent }}>
              {card.icon}
            </span>
          </div>
          {card.isText ? (
            <span className="telemetry-card-value" style={{ fontSize: card.value?.length > 8 ? 14 : 22 }}>
              {card.value}
            </span>
          ) : (
            <AnimatedValue value={card.value} suffix={card.suffix || ''} />
          )}
          <span className="telemetry-card-meta">{card.meta}</span>
        </div>
      ))}
    </div>
  );
}
