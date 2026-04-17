// theme.js — Color palette & status colors
export const STATUS_COLORS = {
  normal: '#10b981',
  high: '#f59e0b',
  compromised: '#ef4444',
  isolated: '#6b7280',
};

export const STATUS_GLOW_COLORS = {
  normal: '#00ff88',
  high: '#ffaa00',
  compromised: '#ff2244',
  isolated: '#888888',
};

export const ATTACK_COLORS = {
  fdi: '#a855f7',
  ddos: '#ef4444',
  spoofing: '#eab308',
};

export const RISK_COLORS = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444',
};

export const EDGE_COLORS = {
  normal: '#0088ff',
  stressed: '#ff4400',
};

export const ATTACK_LABELS = {
  fdi: 'False Data Injection',
  ddos: 'DDoS',
  spoofing: 'Spoofing',
};

export const ATTACK_DESCRIPTIONS = {
  fdi: 'Injecting false sensor readings to manipulate grid load management decisions.',
  ddos: 'Overwhelming communication channels with massive packet floods to disrupt operations.',
  spoofing: 'Falsifying node identity and load data to cause misrouted power redistribution.',
};
