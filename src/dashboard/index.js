const AWS = require('aws-sdk');


const apigateway = new AWS.APIGateway({
    apiVersion: '2015-07-09'
});

const cw = new AWS.CloudWatch({
  apiVersion: '2010-08-01',
});

const ld = new AWS.Lambda({
    apiVersion: '2015-03-31'}
);

const createLambdaErrorRateAlarm = (lambda, alarmActions) => ({
    AlarmName: `lambda [${lambda.name}] Error Rate > 0.3`, /* required */
    ComparisonOperator: "GreaterThanThreshold",
    EvaluationPeriods: 1, // Hourly basis
    AlarmActions: alarmActions,
    AlarmDescription: 'Automatically created alarm for lambda response with error rate > 0.3',
    DatapointsToAlarm: 1,
    Threshold: 0.3,
    Metrics: [
        {
            Id: 'request',
            MetricStat: {
                Metric: {
                    Namespace: 'AWS/Lambda',
                    MetricName: 'Invocations',
                    Dimensions: [
                        {
                            Name: 'FunctionName',
                            Value: lambda.name
                        }
                    ]
                },
                Period: 1800,
                Stat: 'Sum'
            },
            Label: 'Requests',
            ReturnData: false
        },
        {
            Id: 'error',
            MetricStat: {
                Metric: {
                    Namespace: 'AWS/Lambda',
                    MetricName: 'Errors',
                    Dimensions: [
                        {
                            Name: 'FunctionName',
                            Value: lambda.name
                        }
                    ]
                },
                Period: 1800,
                Stat: 'Sum'
            },
            Label: 'Errors',
            ReturnData: false
        },
        {
            Id: 'errorRate',
            Expression: 'error / request',
            Label: 'Error Rate',
            ReturnData: true
        },
    ]
})

const createAPIGWErrorRateAlarm = (api, alarmActions) => ({
    AlarmName: `API [${api.name}] [${api.resource}] Error Rate > 0.3`, /* required */
    ComparisonOperator: "GreaterThanThreshold",
    EvaluationPeriods: 1, // Hourly basis
    AlarmActions: alarmActions,
    AlarmDescription: 'Automatically created alarm for API response with error rate > 0.3',
    DatapointsToAlarm: 1,
    Threshold: 0.3,
    Metrics: [
      {
        Id: 'request',
        MetricStat: {
          Metric: {
            Namespace: 'AWS/ApiGateway',
            MetricName: 'Count',
            Dimensions: [
                { Name: 'ApiName', Value: api.name},
                { Name: 'Resource', Value: api.resource},
                { Name: 'Method', Value: api.method},
                { Name: 'Stage', Value: api.stage},
            ],
          },
          Period: 1800,
          Stat: 'Sum'
        },
        Label: 'Total Requests',
        ReturnData: false
      },
      {
        Id: 'error4XX',
        MetricStat: {
          Metric: {
            Namespace: 'AWS/ApiGateway',
            MetricName: '4XXError',
            Dimensions: [
                { Name: 'ApiName', Value: api.name},
                { Name: 'Resource', Value: api.resource},
                { Name: 'Method', Value: api.method},
                { Name: 'Stage', Value: api.stage},
            ],
          },
          Period: 1800,
          Stat: 'Sum'
        },
        Label: '4XX Error',
        ReturnData: false
      },
      {
        Id: 'error5XX',
        MetricStat: {
          Metric: {
            Namespace: 'AWS/ApiGateway',
            MetricName: '5XXError',
            Dimensions: [
                { Name: 'ApiName', Value: api.name},
                { Name: 'Resource', Value: api.resource},
                { Name: 'Method', Value: api.method},
                { Name: 'Stage', Value: api.stage},
            ],
          },
          Period: 1800,
          Stat: 'Sum'
        },
        Label: '5XX Error',
        ReturnData: false
      },
      {
        Id: 'errorRate',
        Expression: '(error5XX + error4XX) / request',
        Label: 'Error Rate',
        ReturnData: true
      }
    ]
})

const createAPIGWLatencyAlarm = (api, alarmActions) => ({
    AlarmName: `API [${api.name}] [${api.resource}] p99 Latency > 3s`, /* required */
    ComparisonOperator: "GreaterThanThreshold",
    EvaluationPeriods: 1, // Hourly basis
    AlarmActions: alarmActions,
    AlarmDescription: 'Automatically created alarm for API response with latency > 5s',
    DatapointsToAlarm: 1,
    Dimensions: [
        { Name: 'ApiName', Value: api.name},
        { Name: 'Resource', Value: api.resource},
        { Name: 'Method', Value: api.method},
        { Name: 'Stage', Value: api.stage},
    ],
    ExtendedStatistic: 'p99',
    MetricName: 'Latency',
    Namespace: 'AWS/ApiGateway',
    Period: 1800,
    Threshold: 3000,
    Unit: "Milliseconds"
})

/**
 * Create widget with single value
 * Typically used to report API Gateway and Lambda
*/
const createMainAPIGWWidget = (api, y, period=300, region="ap-southeast-1") => ({
    type: "metric",
    height: 3,
    width: 24,
    x: 0,
    y,
    properties: {
        period,
        region,
        title: `${api.name}-APIGW`,
        setPeriodToTimeRange: true,
        stat: "Sum",
        view: "singleValue",
        metrics: [
            ["AWS/ApiGateway", "Count", "ApiName", api.name, {label: "Total Requests", id: "request"}],
            [".", "Latency", ".", ".", {stat: "Average", label: "Avg Latency"}],
            [".", "4XXError", ".", ".", { id: "error4XX" }],
            [".", "5XXError", ".", ".", {id: "error5XX"}],
            [ { "expression": "(error4XX + error5XX) / request", "label": "Error Rate", "id": "errorRate" } ],

        ]
    }
})

/**
 * Create widget with single value
 * Typically used to report API Gateway and Lambda
*/
const createLambdaWidget = (lambda, y, period=300, region="ap-southeast-1") => ({
    type: "metric",
    height: 3,
    width: 24,
    x: 0,
    y,
    properties: {
        period,
        region,
        title: `${lambda.name}-Lambda`,
        setPeriodToTimeRange: true,
        stat: "Sum",
        view: "singleValue",
        metrics: [
            ["AWS/Lambda", "Errors", "FunctionName", lambda.name, {id : "error"}],
            [".", "Duration", ".", ".", {stat: "Average"}],
            [".", "Invocations", ".", ".", { id: "request" }],
            [".", "Throttle", ".", "."],
            [".", "ConcurrentExecutions", ".", "."],
            [ { "expression": "error / request", "label": "Error Rate", "id": "errorRate" } ],
        ]
    }
})

const createDashboardBody = async (resources) => {
    let x, y = 0
    const widgets = []
    const { apigw, lambda } = resources
    if (apigw) {
        widgets.push(createMainAPIGWWidget(apigw, y))
        y = y + 3
    }
    if (lambda.resources.length > 0) {
        lambda.resources.forEach((l) => {
            widgets.push(createLambdaWidget(l, y))
            y = y + 3
        })
    } else {
        console.log("Listing all functions that match name")
        const functions = await ld.listFunctions({ MaxItems: 500 }).promise()
        const functionNames = functions.Functions.filter(l => l.FunctionName.startsWith(lambda.name)).map(l => ({ name: l.FunctionName }))
        functionNames.forEach((l) => {
            widgets.push(createLambdaWidget(l, y))
            y = y + 3
        })
    }
    return widgets
}

const createDashboard = async (name, resources) => {
    const widgets = await createDashboardBody(resources)
    console.log(widgets)
    return cw.putDashboard({
        DashboardName: name,
        DashboardBody: JSON.stringify({ widgets })
    }).promise()
}

const createAlarms = async (api, lambda, alarmActions) => {
    const resources = await apigateway.getResources({ restApiId: api.id }).promise()
    const items = resources.items.filter(i => i.resourceMethods);

    // API Gateway Alarm construction

    for (let i=0; i < items.length; i++) {
        const apiParams = {
            name: api.name,
            stage: api.stage,
            resource: items[i].path,
            method: Object.keys(items[i].resourceMethods).filter(i => i !== 'OPTIONS')[0]
        }
        // const params = createAPIGWLatencyAlarm(apiParams, alarmActions)
        await cw.putMetricAlarm(
            createAPIGWErrorRateAlarm(apiParams, alarmActions)
        ).promise()
        await cw.putMetricAlarm(
            createAPIGWLatencyAlarm(apiParams, alarmActions)
        ).promise()
    }

    for (let i=0; i < lambda.resources.length; i++) {
        await cw.putMetricAlarm(
            createLambdaErrorRateAlarm(lambda.resources[i], alarmActions)
        ).promise()
    }
}

module.exports = {
    createDashboard,
    createAlarms
}
