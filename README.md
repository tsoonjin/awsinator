# awsinator
A wrapper around AWS SDK that provide out-of-the-box command to execute common tasks

# Pre-requisites

- Ensure that AWS credentials is properly setup
- Ensure proper permissions are granted
- Make sure email has been added to AWS SES to be validated

# Usages

## Weekly Email Reporting

- define your configuration (refer to `example/service-metrics-email/config.json`)
- currently it only supports one lambda and one apigateway reporting
- `awsinator --email -c config.json`

## Basic Dashboard Creation

- define your configuration (refer to `example/dashboard/config.json`)
- `awsinator --dashboard -c config.json`

## Basic Alarm Creation

- define your configuration (refer to `example/dashboard/config.json`)
- `awsinator --alarm -c config.json`
- currently supports alarm for the following resources:
    - API Gateway: Latency and Error Rate
    - Lambda: Error Rate
> Ensure that alarm action has already being configured
