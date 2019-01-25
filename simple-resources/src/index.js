import { resolve } from 'path';
import {
  Backend,
  Provider,
  Resource,
  Project,
  Namespace,
  DeploymentConfig,
} from '@tfinjs/api';
import awsProviderUri from '@tfinjs/api/uris/aws';
import LambdaResource from '@tfinjs/aws-lambda';
import packager from '@tfinjs/aws-lambda-packager';
import { config } from 'dotenv';

config();

export const awsAccoundId = process.env.AWS_ACCOUNT_ID;
export const awsRole = process.env.AWS_ROLE;
export const awsRegion = process.env.AWS_REGION;

const backendBucketName = process.env.TERRAFORM_BACKEND_BUCKET_NAME;
const backendBucketRegion = process.env.TERRAFORM_BACKEND_BUCKET_REGION;

const lambdaRegion = 'eu-north-1';

const lambdaProvider = new Provider(
  'aws',
  {
    region: lambdaRegion,
    assume_role: {
      role_arn: `arn:aws:iam::${awsAccoundId}:role/${awsRole}`,
    },
  },
  awsProviderUri(awsAccoundId, lambdaRegion),
);

const backend = new Backend('s3', {
  backendConfig: (name) => ({
    bucket: backendBucketName,
    key: `${name}.terraform.tfstate`,
    region: backendBucketRegion,
  }),
  dataConfig: (name) => ({
    bucket: backendBucketName,
    key: `${name}.terraform.tfstate`,
    region: backendBucketRegion,
  }),
  // provider: new Provider(
  //   'aws',
  //   {
  //     region: backendBucketRegion,
  //     assume_role: {
  //       role_arn: `arn:aws:iam::${awsAccoundId}:role/${awsRole}`,
  //     },
  //   },
  //   awsProviderUri(awsAccoundId, backendBucketRegion),
  // ),
  // create: (deploymentConfig) =>
  //   new Resource(deploymentConfig, 'aws_s3_bucket', 'terraform_state_prod', {
  //     bucket: backendBucketName,
  //     acl: 'private',
  //     versioning: {
  //       enabled: true,
  //     },
  //   }),
});

const project = new Project('pet-shop', backend, resolve(__dirname, 'dist'));

const namespace = new Namespace(project, 'customers');

const deploymentConfig = new DeploymentConfig(namespace, {
  environment: 'prod',
  version: 'static',
  provider: lambdaProvider,
});
const lambdaDeploymentBucket = new Resource(
  deploymentConfig,
  'aws_s3_bucket',
  'lambda_deployment_bucket',
  {
    bucket: 'tfinjs-simple-resource-ldb',
    acl: 'private',
    versioning: {
      enabled: true,
    },
  },
);

const { lambda } = new LambdaResource(deploymentConfig, 'petLambdas', {
  // cloudwatch: true,
  // apigw: {
  //   enabled: true,
  //   cors: true,
  //   path: '*/*',
  // },
  lambdaDeploymentBucket,
  /* byotranspiler */
  /* given the input file path, transpile the
     input into some output file content which
     path should be returned */
  /* if you dont want to transpile the file,
     just return the fs.readFileSync(inputFilePath, 'binary'); buffer */
  /* If you use some env files you can transpile
     using webpack and the env provider plugin such
     that you can use the api during runtime */
  package: async (zipFilePath) => {
    await packager(resolve(__dirname, 'service.js'), zipFilePath);
  },
});

export default project;
