import { api, awsRegion, awsAccoundId } from './config';

const petLambdaExecRole = api.resource('aws_iam_role', 'pets', {
  assume_role_policy: JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Action: 'sts:AssumeRole',
        Principal: {
          Service: 'lambda.amazonaws.com',
        },
        Effect: 'Allow',
        Sid: '',
      },
    ],
  }),
});

const logGroupPrefix = `arn:aws:logs:${awsRegion}:${awsAccoundId}:log-group:/aws/lambda`;
const petLambda = api.resource('aws_lambda_function', 'pets', {
  filename: 'lambda_function_payload.zip',
  function_name: 'lambda_function_name',
  role: '${aws_iam_role.iam_for_lambda.arn}',
  handler: 'service.test',
  source_code_hash: '${base64sha256(file("lambda_function_payload.zip"))}',
  runtime: 'nodejs8.10',

  environment: {
    variables: {
      foo: 'bar',
    },
  },
});
const petLambdaName = petLambda.versionedName();
const cloudwatchPolicy = api.resource(
  'aws_iam_policy',
  'cloudwatch_attachable_policy',
  {
    policy: JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Action: ['logs:CreateLogStream'],
          Effect: 'Allow',
          Resource: `${logGroupPrefix}/${petLambdaName}:*`,
        },
        {
          Action: ['logs:PutLogEvents'],
          Effect: 'Allow',
          Resource: `${logGroupPrefix}/${petLambdaName}:*:*`,
        },
      ],
    }),
  },
);
api.resource('aws_iam_role_policy_attachment', 'cloud_watch_role_attachment', {
  role: api.reference(petLambdaExecRole, 'name'),
  policy_arn: api.reference(cloudwatchPolicy, 'arn'),
});
