import { CloudWatchClient } from '@aws-sdk/client-cloudwatch';
import { EC2Client } from '@aws-sdk/client-ec2';
import { EKSClient } from '@aws-sdk/client-eks';
import { ElasticLoadBalancingV2Client } from '@aws-sdk/client-elastic-load-balancing-v2';
import { IAMClient } from '@aws-sdk/client-iam';
import { LambdaClient } from '@aws-sdk/client-lambda';
import { S3Client } from '@aws-sdk/client-s3';
import { SNSClient } from '@aws-sdk/client-sns';
import { SQSClient } from '@aws-sdk/client-sqs';
import { fromIni } from '@aws-sdk/credential-providers';

type AWSClientClass =
  | typeof EC2Client
  | typeof EKSClient
  | typeof SNSClient
  | typeof SQSClient
  | typeof ElasticLoadBalancingV2Client
  | typeof LambdaClient
  | typeof IAMClient
  | typeof CloudWatchClient
  | typeof S3Client;

interface ClientFactoryOptions {
  readonly profile?: string;
}

export class AWSClientFactory {
  private readonly clients = new Map<string, InstanceType<AWSClientClass>>();
  private readonly options: ClientFactoryOptions;

  constructor(options: ClientFactoryOptions = {}) {
    this.options = options;
  }

  getEC2(region: string): EC2Client {
    return this.getOrCreate(EC2Client, region);
  }

  getEKS(region: string): EKSClient {
    return this.getOrCreate(EKSClient, region);
  }

  getSNS(region: string): SNSClient {
    return this.getOrCreate(SNSClient, region);
  }

  getSQS(region: string): SQSClient {
    return this.getOrCreate(SQSClient, region);
  }

  getELBv2(region: string): ElasticLoadBalancingV2Client {
    return this.getOrCreate(ElasticLoadBalancingV2Client, region);
  }

  getLambda(region: string): LambdaClient {
    return this.getOrCreate(LambdaClient, region);
  }

  getIAM(region: string): IAMClient {
    return this.getOrCreate(IAMClient, region);
  }

  getCloudWatch(region: string): CloudWatchClient {
    return this.getOrCreate(CloudWatchClient, region);
  }

  getS3(region: string): S3Client {
    return this.getOrCreate(S3Client, region);
  }

  destroy(): void {
    for (const client of this.clients.values()) {
      client.destroy();
    }
    this.clients.clear();
  }

  private getOrCreate<T extends AWSClientClass>(
    ClientClass: T,
    region: string,
  ): InstanceType<T> {
    const key = `${ClientClass.name}:${region}`;
    const existing = this.clients.get(key);
    if (existing) return existing as InstanceType<T>;

    const credentials = this.options.profile
      ? fromIni({ profile: this.options.profile })
      : undefined;

    const client = new ClientClass({ region, credentials });
    this.clients.set(key, client as InstanceType<AWSClientClass>);
    return client as InstanceType<T>;
  }
}
