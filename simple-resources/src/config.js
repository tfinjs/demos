import { config } from 'dotenv';
import { Deployment, Backend, Provider } from 'tfinjs';
import awsProviderUri from 'tfinjs/uris/aws';

config();

export const awsAccoundId = process.env.AWS_ACCOUNT_ID;
export const awsRegion = process.env.AWS_REGION;

export const provider = new Provider(
  'aws',
  {
    region: awsRegion,
    assume_role: {
      role_arn: `arn:aws:iam::${awsAccoundId}:role/DeploymentRole`,
    },
  },
  awsProviderUri(awsAccoundId, awsRegion),
);

const backendBucketName = 'terraform-state-prod';
const backendBucketRegion = 'us-east-1';

export const deployment = new Deployment({
  backend: new Backend('s3', {
    backendConfig: (versionedName) => ({
      bucket: backendBucketName,
      key: `${versionedName}.terraform.tfstate`,
      region: backendBucketRegion,
    }),
    dataConfig: (versionedName) => ({
      bucket: backendBucketName,
      key: `${versionedName}.terraform.tfstate`,
      region: backendBucketRegion,
    }),
    provider: new Provider(
      'aws',
      {
        region: backendBucketRegion,
        assume_role: {
          role_arn: `arn:aws:iam::${awsAccoundId}:role/DeploymentRole`,
        },
      },
      awsProviderUri(awsAccoundId, backendBucketRegion),
    ),
    create: (resource) =>
      resource('aws_s3_bucket', 'terraform_state_prod', {
        bucket: backendBucketName,
        acl: 'private',
        versioning: {
          enabled: true,
        },
      }),
  }),
});

/* the api is a collection of resources under
   a certain namespace and deployment params. */
export const api = deployment.createApi({
  deploymentParams: {
    project: 'pet-shop',
    environment: 'stage',
    version: 'v1',
  },
  namespace: 'services/lambdas/add-pet',
  provider,
});
