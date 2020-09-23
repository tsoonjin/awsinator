// Retrieve API Gateway metrics
// Default to weekly aggregation
const basicApiGatewayTemplate = (apiName, period=604800) => ({
    MetricDataQueries: [
      {
        Id: 'request',
        MetricStat: {
          Metric: {
            Namespace: 'AWS/ApiGateway',
            MetricName: 'Count',
            Dimensions: [
              {
                Name: 'ApiName',
                Value: apiName
              }
            ]
          },
          Period: period,
          Stat: 'Sum'
        },
        Label: 'Total Requests',
        ReturnData: true
      },
      {
        Id: 'error4XX',
        MetricStat: {
          Metric: {
            Namespace: 'AWS/ApiGateway',
            MetricName: '4XXError',
            Dimensions: [
              {
                Name: 'ApiName',
                Value: apiName
              }
            ]
          },
          Period: period,
          Stat: 'Sum'
        },
        Label: '4XX Error',
        ReturnData: true
      },
      {
        Id: 'error5XX',
        MetricStat: {
          Metric: {
            Namespace: 'AWS/ApiGateway',
            MetricName: '5XXError',
            Dimensions: [
              {
                Name: 'ApiName',
                Value: apiName
              }
            ]
          },
          Period: period,
          Stat: 'Sum'
        },
        Label: '5XX Error',
        ReturnData: true
      },
      {
        Id: 'avgLatency',
        MetricStat: {
          Metric: {
            Namespace: 'AWS/ApiGateway',
            MetricName: 'Latency',
            Dimensions: [
              {
                Name: 'ApiName',
                Value: apiName
              }
            ]
          },
          Period: period,
          Stat: 'Average'
        },
        Label: 'AVG Latency',
        ReturnData: true
      },
      {
        Id: 'p99Latency',
        MetricStat: {
          Metric: {
            Namespace: 'AWS/ApiGateway',
            MetricName: 'Latency',
            Dimensions: [
              {
                Name: 'ApiName',
                Value: apiName
              }
            ]
          },
          Period: period,
          Stat: 'p99'
        },
        Label: 'P99 Latency',
        ReturnData: true
      },
      {
        Id: 'errorRate',
        Expression: 'error5XX / request',
        Label: 'Error Rate',
        ReturnData: true
      }
    ],
    StartTime: '2020-07-01T00:00:0000',
    EndTime: '2020-07-02T00:00:0000'
  }
)

const basicLambdaTemplate = (functionName, period=604800) => ({
    MetricDataQueries: [
        {
            Id: 'request',
            MetricStat: {
                Metric: {
                    Namespace: 'AWS/Lambda',
                    MetricName: 'Invocations',
                    Dimensions: [
                        {
                            Name: 'FunctionName',
                            Value: functionName
                        }
                    ]
                },
                Period: period,
                Stat: 'Sum'
            },
            Label: 'Requests',
            ReturnData: true
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
                            Value: functionName
                        }
                    ]
                },
                Period: period,
                Stat: 'Sum'
            },
            Label: 'Errors',
            ReturnData: true
        },
        {
            Id: 'errorRate',
            Expression: 'error / request',
            Label: 'Error Rate',
            ReturnData: true
        },
        {
            Id: 'duration',
            MetricStat: {
                Metric: {
                    Namespace: 'AWS/Lambda',
                    MetricName: 'Duration',
                    Dimensions: [
                        {
                            Name: 'FunctionName',
                            Value: functionName
                        }
                    ]
                },
                Period: period,
                Stat: 'Average'
            },
            Label: 'Durations',
            ReturnData: true
        }
    ],
    StartTime: '2020-08-01T00:00:0000',
    EndTime: '2020-08-01T23:00:0000'

})

module.exports = {
    basicApiGatewayTemplate,
    basicLambdaTemplate
}
