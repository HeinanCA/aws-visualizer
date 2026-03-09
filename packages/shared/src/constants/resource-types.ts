export const ResourceType = {
  VPC: 'vpc',
  SUBNET: 'subnet',
  ROUTE_TABLE: 'route_table',
  INTERNET_GATEWAY: 'igw',
  NAT_GATEWAY: 'nat_gw',
  SECURITY_GROUP: 'security_group',
  NACL: 'nacl',
  VPC_PEERING: 'vpc_peering',
  ELASTIC_IP: 'eip',
  EKS_CLUSTER: 'eks_cluster',
  EKS_NODE_GROUP: 'eks_node_group',
  IRSA: 'irsa',
  SNS_TOPIC: 'sns_topic',
  SNS_SUBSCRIPTION: 'sns_subscription',
  SQS_QUEUE: 'sqs_queue',
  ALB: 'alb',
  NLB: 'nlb',
  LAMBDA: 'lambda',
  IAM_ROLE: 'iam_role',
  CLOUDWATCH_ALARM: 'cw_alarm',
  S3_BUCKET: 's3_bucket',
  EC2_INSTANCE: 'ec2_instance',
} as const;

export type ResourceType = (typeof ResourceType)[keyof typeof ResourceType];

export interface ResourceTypeMetadata {
  readonly label: string;
  readonly category: ResourceCategory;
  readonly awsService: string;
}

export const ResourceCategory = {
  NETWORKING: 'networking',
  COMPUTE: 'compute',
  CONTAINERS: 'containers',
  MESSAGING: 'messaging',
  SECURITY: 'security',
  STORAGE: 'storage',
  MONITORING: 'monitoring',
  SERVERLESS: 'serverless',
} as const;

export type ResourceCategory =
  (typeof ResourceCategory)[keyof typeof ResourceCategory];

export const RESOURCE_TYPE_METADATA: Readonly<
  Record<ResourceType, ResourceTypeMetadata>
> = {
  [ResourceType.VPC]: {
    label: 'VPC',
    category: ResourceCategory.NETWORKING,
    awsService: 'ec2',
  },
  [ResourceType.SUBNET]: {
    label: 'Subnet',
    category: ResourceCategory.NETWORKING,
    awsService: 'ec2',
  },
  [ResourceType.ROUTE_TABLE]: {
    label: 'Route Table',
    category: ResourceCategory.NETWORKING,
    awsService: 'ec2',
  },
  [ResourceType.INTERNET_GATEWAY]: {
    label: 'Internet Gateway',
    category: ResourceCategory.NETWORKING,
    awsService: 'ec2',
  },
  [ResourceType.NAT_GATEWAY]: {
    label: 'NAT Gateway',
    category: ResourceCategory.NETWORKING,
    awsService: 'ec2',
  },
  [ResourceType.SECURITY_GROUP]: {
    label: 'Security Group',
    category: ResourceCategory.SECURITY,
    awsService: 'ec2',
  },
  [ResourceType.NACL]: {
    label: 'Network ACL',
    category: ResourceCategory.NETWORKING,
    awsService: 'ec2',
  },
  [ResourceType.VPC_PEERING]: {
    label: 'VPC Peering',
    category: ResourceCategory.NETWORKING,
    awsService: 'ec2',
  },
  [ResourceType.ELASTIC_IP]: {
    label: 'Elastic IP',
    category: ResourceCategory.NETWORKING,
    awsService: 'ec2',
  },
  [ResourceType.EKS_CLUSTER]: {
    label: 'EKS Cluster',
    category: ResourceCategory.CONTAINERS,
    awsService: 'eks',
  },
  [ResourceType.EKS_NODE_GROUP]: {
    label: 'Node Group',
    category: ResourceCategory.CONTAINERS,
    awsService: 'eks',
  },
  [ResourceType.IRSA]: {
    label: 'IRSA',
    category: ResourceCategory.CONTAINERS,
    awsService: 'eks',
  },
  [ResourceType.SNS_TOPIC]: {
    label: 'SNS Topic',
    category: ResourceCategory.MESSAGING,
    awsService: 'sns',
  },
  [ResourceType.SNS_SUBSCRIPTION]: {
    label: 'SNS Subscription',
    category: ResourceCategory.MESSAGING,
    awsService: 'sns',
  },
  [ResourceType.SQS_QUEUE]: {
    label: 'SQS Queue',
    category: ResourceCategory.MESSAGING,
    awsService: 'sqs',
  },
  [ResourceType.ALB]: {
    label: 'Application LB',
    category: ResourceCategory.NETWORKING,
    awsService: 'elbv2',
  },
  [ResourceType.NLB]: {
    label: 'Network LB',
    category: ResourceCategory.NETWORKING,
    awsService: 'elbv2',
  },
  [ResourceType.LAMBDA]: {
    label: 'Lambda',
    category: ResourceCategory.SERVERLESS,
    awsService: 'lambda',
  },
  [ResourceType.IAM_ROLE]: {
    label: 'IAM Role',
    category: ResourceCategory.SECURITY,
    awsService: 'iam',
  },
  [ResourceType.CLOUDWATCH_ALARM]: {
    label: 'CW Alarm',
    category: ResourceCategory.MONITORING,
    awsService: 'cloudwatch',
  },
  [ResourceType.S3_BUCKET]: {
    label: 'S3 Bucket',
    category: ResourceCategory.STORAGE,
    awsService: 's3',
  },
  [ResourceType.EC2_INSTANCE]: {
    label: 'EC2 Instance',
    category: ResourceCategory.COMPUTE,
    awsService: 'ec2',
  },
};
