# awsinator
A wrapper around AWS SDK that provide out-of-the-box command to execute common tasks

# Pre-requisites

- Ensure that AWS credentials is properly setup
- Ensure proper permissions are granted
- Make sure email has been added to AWS SES to be validated

# Usages

## Weekly Email Reporting

- define your configuration (refer to `example/service-metrics-email/config.json`)
- `awsinator --email -c config.json`

## Basic Dashboard Creation

- define your configuration (refer to `example/dashboard/config.json`)
- `awsinator --dashboard -c config.json`
