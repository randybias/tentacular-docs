import React from 'react';
import { Play, Clock, Rss, Filter, BrainCircuit, MessageSquare, Database, Cpu, Webhook } from 'lucide-react';

const nodeBase: React.CSSProperties = {
  position: 'absolute',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '8px 12px',
  borderRadius: '12px',
  borderWidth: '1px',
  borderStyle: 'solid',
  backdropFilter: 'blur(12px)',
  transition: 'transform 0.3s, box-shadow 0.3s',
  cursor: 'default',
  transform: 'translate(-50%, -50%)',
};

function Node({ x, y, w, h, title, subtitle, details, icon: Icon, bg, border, text, shadow }: {
  x: number; y: number; w: number; h: number;
  title: string; subtitle?: string; details?: string;
  icon?: any; bg: string; border: string; text: string; shadow?: string;
}) {
  return (
    <div
      style={{
        ...nodeBase,
        left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%`,
        backgroundColor: bg, borderColor: border,
        boxShadow: shadow || 'none',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translate(-50%, -50%) scale(1.06)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translate(-50%, -50%) scale(1)'; }}
    >
      {Icon && <Icon style={{ width: 18, height: 18, marginBottom: 4, color: text }} />}
      <span style={{ fontWeight: 700, fontSize: 13, color: text, letterSpacing: '0.02em' }}>{title}</span>
      {subtitle && <span style={{ fontSize: 11, color: '#cbd5e1', marginTop: 2, textAlign: 'center', lineHeight: 1.3, whiteSpace: 'pre-line' }}>{subtitle}</span>}
      {details && <span style={{ fontSize: 9, color: '#94a3b8', marginTop: 4, textAlign: 'center', lineHeight: 1.3, whiteSpace: 'pre-line' }}>{details}</span>}
    </div>
  );
}

function GroupBox({ x, y, w, h, title }: { x: number; y: number; w: number; h: number; title: string }) {
  return (
    <div style={{
      position: 'absolute', left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%`,
      transform: 'translate(-50%, -50%)',
      borderRadius: 16, border: '1px dashed rgba(71,85,105,0.4)',
      backgroundColor: 'rgba(30,41,59,0.05)', pointerEvents: 'none',
    }}>
      <div style={{
        position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
        backgroundColor: '#0d1117', padding: '0 8px',
        fontSize: 10, fontWeight: 600, color: '#64748b',
        letterSpacing: '0.1em', textTransform: 'uppercase',
      }}>{title}</div>
    </div>
  );
}

export default function ContractDiagram() {
  return (
    <div style={{
      width: '100%', maxWidth: 720, aspectRatio: '4/5',
      position: 'relative', margin: '0 auto',
      backgroundColor: 'rgba(15,23,42,0.3)', borderRadius: 24,
      border: '1px solid rgba(30,41,59,0.5)',
      boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
      overflow: 'hidden', fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      {/* Grid background */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.2,
        backgroundImage: 'radial-gradient(#1e293b 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }} />

      {/* SVG connection lines */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <marker id="ah" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">
            <polygon points="0 0, 4 2, 0 4" fill="#475569" />
          </marker>
        </defs>
        {/* Trigger → Fetch */}
        <path d="M 35 14 C 35 17, 50 17, 50 20" fill="none" stroke="#475569" strokeWidth="0.25" markerEnd="url(#ah)" />
        <path d="M 65 14 C 65 17, 50 17, 50 20" fill="none" stroke="#475569" strokeWidth="0.25" markerEnd="url(#ah)" />
        {/* Fetch → Filter → Rank → Notify */}
        <path d="M 50 30 L 50 36" fill="none" stroke="#475569" strokeWidth="0.25" markerEnd="url(#ah)" />
        <path d="M 50 44 L 50 50" fill="none" stroke="#475569" strokeWidth="0.25" markerEnd="url(#ah)" />
        <path d="M 50 62 C 50 66, 75 66, 75 68" fill="none" stroke="#475569" strokeWidth="0.25" markerEnd="url(#ah)" />
        {/* Dotted lines to contract deps */}
        <path d="M 38 25 C 25 25, 25 55, 25 85" fill="none" stroke="#475569" strokeWidth="0.2" strokeDasharray="1,1" markerEnd="url(#ah)" />
        <path d="M 50 62 L 50 85" fill="none" stroke="#475569" strokeWidth="0.2" strokeDasharray="1,1" markerEnd="url(#ah)" />
        <path d="M 75 76 L 75 85" fill="none" stroke="#475569" strokeWidth="0.2" strokeDasharray="1,1" markerEnd="url(#ah)" />
      </svg>

      {/* Groups */}
      <GroupBox x={50} y={10} w={60} h={14} title="Triggers" />
      <GroupBox x={50} y={90} w={85} h={16} title="Contract Dependencies" />

      {/* Trigger nodes */}
      <Node x={35} y={10} w={20} h={8} title="Manual" subtitle="POST /run"
        icon={Play} bg="rgba(30,41,59,0.8)" border="#475569" text="#e2e8f0" />
      <Node x={65} y={10} w={20} h={8} title="Cron" subtitle={"0 7 * * 1\nMondays 7 AM"}
        icon={Clock} bg="rgba(30,41,59,0.8)" border="#475569" text="#e2e8f0" />

      {/* DAG nodes */}
      <Node x={50} y={25} w={24} h={10} title="fetch-feeds" subtitle="22 sources" details="RSS / Reddit / HN API"
        icon={Rss} bg="rgba(0,60,80,0.35)" border="rgba(0,180,200,0.4)" text="#67e8f9"
        shadow="0 0 20px rgba(0,180,200,0.12)" />
      <Node x={50} y={40} w={24} h={8} title="filter-dedupe" subtitle="Deduplicate & filter" details="7-day window"
        icon={Filter} bg="rgba(80,40,0,0.3)" border="rgba(249,115,22,0.4)" text="#fdba74"
        shadow="0 0 20px rgba(249,115,22,0.1)" />
      <Node x={50} y={56} w={28} h={12} title="rank-summarize" subtitle="LLM Analysis"
        details={"Executive summary 500-800w\nTop 20 ranked by freshness\n+ agentic relevance"}
        icon={BrainCircuit} bg="rgba(60,20,80,0.3)" border="rgba(168,85,247,0.4)" text="#c084fc"
        shadow="0 0 20px rgba(168,85,247,0.1)" />
      <Node x={75} y={72} w={24} h={8} title="notify-slack" subtitle="Slack Block Kit" details="Post digest to channel"
        icon={MessageSquare} bg="rgba(0,60,40,0.3)" border="rgba(16,185,129,0.4)" text="#6ee7b7"
        shadow="0 0 20px rgba(16,185,129,0.1)" />

      {/* Contract dependency nodes */}
      <Node x={25} y={90} w={22} h={10} title="news-sources" subtitle="dynamic-target" details="0.0.0.0/0:443"
        icon={Database} bg="rgba(30,41,59,0.9)" border="#475569" text="#cbd5e1" />
      <Node x={50} y={90} w={22} h={10} title="openai-api" subtitle="api.openai.com:443" details="bearer-token"
        icon={Cpu} bg="rgba(30,41,59,0.9)" border="#475569" text="#cbd5e1" />
      <Node x={75} y={90} w={22} h={10} title="slack-webhook" subtitle="hooks.slack.com:443" details="bearer-token"
        icon={Webhook} bg="rgba(30,41,59,0.9)" border="#475569" text="#cbd5e1" />
    </div>
  );
}
