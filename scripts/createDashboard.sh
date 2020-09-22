#!/bin/bash

# Setup AWS
export AWS_PROFILE=astro-acm-prod
NAME=ACM-Default-Template

# Retrieve template
aws cloudwatch get-dashboard --dashboard-name $NAME --region ap-southeast-1 >| template.json


