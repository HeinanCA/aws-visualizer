import {
  Server,
  Layers,
  Network,
  Globe,
  Shield,
  Lock,
  Zap,
  Database,
  Inbox,
  Bell,
  AlertTriangle,
  HardDrive,
  Container,
  ArrowRightLeft,
  Scale,
  MapPin,
  type LucideIcon,
} from 'lucide-react';
import {
  ResourceType,
  ResourceCategory,
  RESOURCE_TYPE_METADATA,
} from '@aws-visualizer/shared';

export const RESOURCE_ICONS: Record<string, LucideIcon> = {
  [ResourceType.VPC]: Network,
  [ResourceType.SUBNET]: Layers,
  [ResourceType.ROUTE_TABLE]: ArrowRightLeft,
  [ResourceType.INTERNET_GATEWAY]: Globe,
  [ResourceType.NAT_GATEWAY]: Globe,
  [ResourceType.SECURITY_GROUP]: Lock,
  [ResourceType.NACL]: Shield,
  [ResourceType.VPC_PEERING]: ArrowRightLeft,
  [ResourceType.ELASTIC_IP]: MapPin,
  [ResourceType.EKS_CLUSTER]: Container,
  [ResourceType.EKS_NODE_GROUP]: Server,
  [ResourceType.IRSA]: Shield,
  [ResourceType.SNS_TOPIC]: Bell,
  [ResourceType.SNS_SUBSCRIPTION]: Bell,
  [ResourceType.SQS_QUEUE]: Inbox,
  [ResourceType.ALB]: Scale,
  [ResourceType.NLB]: Scale,
  [ResourceType.LAMBDA]: Zap,
  [ResourceType.IAM_ROLE]: Shield,
  [ResourceType.CLOUDWATCH_ALARM]: AlertTriangle,
  [ResourceType.S3_BUCKET]: HardDrive,
  [ResourceType.EC2_INSTANCE]: Server,
};

export interface ColorClasses {
  readonly text: string;
  readonly bg: string;
  readonly border: string;
  readonly glow: string;
  readonly iconBg: string;
}

export const CATEGORY_COLORS: Record<string, ColorClasses> = {
  [ResourceCategory.NETWORKING]: {
    text: 'text-blue-300',
    bg: 'bg-blue-950/70',
    border: 'border-blue-500/60',
    glow: 'shadow-[0_0_15px_rgba(59,130,246,0.3)]',
    iconBg: 'bg-blue-500/20',
  },
  [ResourceCategory.COMPUTE]: {
    text: 'text-orange-300',
    bg: 'bg-orange-950/70',
    border: 'border-orange-500/60',
    glow: 'shadow-[0_0_15px_rgba(249,115,22,0.3)]',
    iconBg: 'bg-orange-500/20',
  },
  [ResourceCategory.CONTAINERS]: {
    text: 'text-purple-300',
    bg: 'bg-purple-950/70',
    border: 'border-purple-500/60',
    glow: 'shadow-[0_0_15px_rgba(168,85,247,0.3)]',
    iconBg: 'bg-purple-500/20',
  },
  [ResourceCategory.MESSAGING]: {
    text: 'text-pink-300',
    bg: 'bg-pink-950/70',
    border: 'border-pink-500/60',
    glow: 'shadow-[0_0_15px_rgba(236,72,153,0.3)]',
    iconBg: 'bg-pink-500/20',
  },
  [ResourceCategory.SECURITY]: {
    text: 'text-red-300',
    bg: 'bg-red-950/70',
    border: 'border-red-500/60',
    glow: 'shadow-[0_0_15px_rgba(239,68,68,0.3)]',
    iconBg: 'bg-red-500/20',
  },
  [ResourceCategory.STORAGE]: {
    text: 'text-emerald-300',
    bg: 'bg-emerald-950/70',
    border: 'border-emerald-500/60',
    glow: 'shadow-[0_0_15px_rgba(16,185,129,0.3)]',
    iconBg: 'bg-emerald-500/20',
  },
  [ResourceCategory.MONITORING]: {
    text: 'text-amber-300',
    bg: 'bg-amber-950/70',
    border: 'border-amber-500/60',
    glow: 'shadow-[0_0_15px_rgba(245,158,11,0.3)]',
    iconBg: 'bg-amber-500/20',
  },
  [ResourceCategory.SERVERLESS]: {
    text: 'text-cyan-300',
    bg: 'bg-cyan-950/70',
    border: 'border-cyan-500/60',
    glow: 'shadow-[0_0_15px_rgba(6,182,212,0.3)]',
    iconBg: 'bg-cyan-500/20',
  },
};

const DEFAULT_COLORS: ColorClasses = {
  text: 'text-slate-300',
  bg: 'bg-slate-900/80',
  border: 'border-slate-500/50',
  glow: 'shadow-[0_0_10px_rgba(100,116,139,0.2)]',
  iconBg: 'bg-slate-500/20',
};

export function getResourceColors(type: string): ColorClasses {
  const meta = (RESOURCE_TYPE_METADATA as Record<string, { category: string }>)[
    type
  ];
  if (!meta) return DEFAULT_COLORS;
  return CATEGORY_COLORS[meta.category] ?? DEFAULT_COLORS;
}

export function getStatusClasses(state?: string): {
  readonly dot: string;
  readonly text: string;
  readonly label: string;
} {
  if (!state)
    return { dot: 'bg-slate-500', text: 'text-slate-400', label: 'Unknown' };
  const lower = state.toLowerCase();

  if (
    lower.includes('running') ||
    lower.includes('active') ||
    lower.includes('available')
  ) {
    return {
      dot: 'bg-emerald-400',
      text: 'text-emerald-300',
      label: 'Healthy',
    };
  }
  if (
    lower.includes('stopped') ||
    lower.includes('failed') ||
    lower.includes('error')
  ) {
    return { dot: 'bg-red-400', text: 'text-red-300', label: 'Error' };
  }
  if (
    lower.includes('pending') ||
    lower.includes('creating') ||
    lower.includes('updating')
  ) {
    return { dot: 'bg-amber-400', text: 'text-amber-300', label: 'Pending' };
  }
  return { dot: 'bg-slate-500', text: 'text-slate-400', label: state };
}
