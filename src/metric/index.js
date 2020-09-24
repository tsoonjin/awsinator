const AWS = require('aws-sdk');

const cw = new AWS.CloudWatch({
  apiVersion: '2010-08-01',
});

const { basicApiGatewayTemplate, basicLambdaTemplate } = require('./template')

/**
 * Create start date and end date for metrics retrieval
 * @param days: number of days from today (default: 1 week)
 */
const formatRequest = (params, days=7) => {
  const dateNow = new Date()
  const firstDayLastWk = new Date(dateNow)
  const lastDayLastWk = new Date(dateNow)
  const firstDayOfTheWeek = dateNow.getDate() - dateNow.getDay() + 1; // Remove + 1 if sunday is first day of the week.
  const lastDayOfTheWeek = firstDayOfTheWeek + 6;
  const firstDayOfLastWeek = new Date(firstDayLastWk.setDate(firstDayOfTheWeek - days));
  const lastDayOfLastWeek = new Date(lastDayLastWk.setDate(lastDayOfTheWeek - days));
  params.StartTime = firstDayOfLastWeek;
  params.EndTime = lastDayOfLastWeek;
  return params;
};

// Retrieve metrics

const extractApiGatewayMetrics = (apigwRes, apigwResPrev) => ({
    request: {
        value: apigwRes[0].Values[0],
        delta: ((apigwRes[0].Values[0] - apigwResPrev[0].Values[0]) / apigwResPrev[0].Values[0] * 100).toFixed(2),
    },
    avgLatency: {
        value: apigwRes[3].Values[0],
        delta: ((apigwRes[3].Values[0] - apigwResPrev[3].Values[0]) / apigwResPrev[3].Values[0] * 100).toFixed(2),
    },
    errorRate: {
        value: apigwRes[5].Values[0],
        delta: ((apigwRes[5].Values[0] - apigwResPrev[5].Values[0]) / apigwResPrev[5].Values[0] * 100).toFixed(2),
    }
})

const extractLambdaMetrics = (lambdaRes, lambdaResPrev) => ({
    request: {
        value: lambdaRes[0].Values[0],
        delta: ((lambdaRes[0].Values[0] - lambdaResPrev[0].Values[0]) / lambdaResPrev[0].Values[0] * 100).toFixed(2),
    },
    duration: {
        value: lambdaRes[2].Values[0],
        delta: ((lambdaRes[2].Values[0] - lambdaResPrev[2].Values[0]) / lambdaResPrev[2].Values[0] * 100).toFixed(2),
    },
    errorRate: {
        value: lambdaRes[3].Values[0],
        delta: ((lambdaRes[3].Values[0] - lambdaResPrev[3].Values[0]) / lambdaResPrev[3].Values[0] * 100).toFixed(2),
    }
})

const getAPIGWMetric = async (name) => {
    const req = formatRequest(basicApiGatewayTemplate(name))
    const reqPrev = formatRequest(basicApiGatewayTemplate(name), 14)
    const { MetricDataResults: res } = await cw
        .getMetricData(req)
        .promise();
    const { MetricDataResults: resPrev } = await cw
        .getMetricData(reqPrev)
        .promise();
    return [res, resPrev]
}

const getLambdaMetric = async (name) => {
    const req = formatRequest(basicLambdaTemplate(name))
    const reqPrev = formatRequest(basicLambdaTemplate(name), 14)
    const { MetricDataResults: res } = await cw
        .getMetricData(req)
        .promise();
    const { MetricDataResults: resPrev } = await cw
        .getMetricData(reqPrev)
        .promise();
    return [res, resPrev]
}

const getServiceMetrics = async (config) => {
    const { apigw, service, lambda } = config
    let apiMetrics = []
    let lambdaMetrics = []
    for (let i = 0; i < apigw.resources.length; i++) {
        const [res, resPrev] = await getAPIGWMetric(apigw.resources[i].name)
        apiMetrics.push({
            name: apigw.resources[i].name,
            metrics: extractApiGatewayMetrics(res, resPrev)
        })
    }
    for (let i = 0; i < lambda.resources.length; i++) {
        const [res, resPrev] = await getLambdaMetric(lambda.resources[i].name)
        lambdaMetrics.push({
            name: lambda.resources[i].name,
            metrics: extractLambdaMetrics(res, resPrev)
        })
    }

    // Format email
    return {
        service,
        apigw: apiMetrics,
        lambda: lambdaMetrics
    };
}


module.exports = {
    getServiceMetrics
}
