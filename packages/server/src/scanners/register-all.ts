import type { ScannerRegistry } from './scanner-registry.js';
import { vpcScanner } from './networking/vpc.scanner.js';
import { subnetScanner } from './networking/subnet.scanner.js';
import { internetGatewayScanner } from './networking/internet-gateway.scanner.js';
import { natGatewayScanner } from './networking/nat-gateway.scanner.js';
import { securityGroupScanner } from './networking/security-group.scanner.js';
import { routeTableScanner } from './networking/route-table.scanner.js';
import { naclScanner } from './networking/nacl.scanner.js';
import { vpcPeeringScanner } from './networking/vpc-peering.scanner.js';
import { elasticIpScanner } from './networking/elastic-ip.scanner.js';
import { eksClusterScanner } from './eks/cluster.scanner.js';
import { eksNodeGroupScanner } from './eks/node-group.scanner.js';
import { snsTopicScanner } from './messaging/sns-topic.scanner.js';
import { snsSubscriptionScanner } from './messaging/sns-subscription.scanner.js';
import { sqsQueueScanner } from './messaging/sqs-queue.scanner.js';
import { albScanner } from './connected/alb.scanner.js';
import { nlbScanner } from './connected/nlb.scanner.js';
import { lambdaScanner } from './connected/lambda.scanner.js';
import { iamRoleScanner } from './connected/iam-role.scanner.js';
import { ec2InstanceScanner } from './connected/ec2-instance.scanner.js';
import { cloudwatchAlarmScanner } from './connected/cloudwatch-alarm.scanner.js';
import { s3BucketScanner } from './connected/s3-bucket.scanner.js';

export function registerAllScanners(registry: ScannerRegistry): void {
  // Tier 0
  registry.register(vpcScanner);
  registry.register(iamRoleScanner);
  registry.register(s3BucketScanner);

  // Tier 1
  registry.register(subnetScanner);
  registry.register(internetGatewayScanner);
  registry.register(natGatewayScanner);
  registry.register(securityGroupScanner);
  registry.register(routeTableScanner);
  registry.register(naclScanner);
  registry.register(vpcPeeringScanner);
  registry.register(elasticIpScanner);

  // Tier 2
  registry.register(eksClusterScanner);
  registry.register(ec2InstanceScanner);
  registry.register(albScanner);
  registry.register(nlbScanner);
  registry.register(lambdaScanner);
  registry.register(snsTopicScanner);
  registry.register(sqsQueueScanner);
  registry.register(cloudwatchAlarmScanner);

  // Tier 3
  registry.register(eksNodeGroupScanner);
  registry.register(snsSubscriptionScanner);
}
