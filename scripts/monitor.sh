#!/bin/bash

export AWS_PROFILE=astro-de-prod

functions=$(aws lambda list-functions --output json --query 'Functions[?starts_with(FunctionName, `de-awani-service-prd`) == `true`].FunctionName' )

echo $functions

# Get invocations for 1 day
# aws cloudwatch get-metric-data --cli-input-json file://lambdaInvocation.json --profile astro-de-prod --query 'MetricDataResults[].Values[0]|[0]'
