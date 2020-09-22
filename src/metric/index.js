const AWS = require('aws-sdk');

const cw = new AWS.CloudWatch({
  apiVersion: '2010-08-01',
});

const formatRequest = (params) => {
  const dateNow = new Date()
  const firstDayLastWk = new Date(dateNow)
  const lastDayLastWk = new Date(dateNow)
  const firstDayOfTheWeek = dateNow.getDate() - dateNow.getDay() + 1; // Remove + 1 if sunday is first day of the week.
  const lastDayOfTheWeek = firstDayOfTheWeek + 6;
  const firstDayOfLastWeek = new Date(firstDayLastWk.setDate(firstDayOfTheWeek - 7));
  const lastDayOfLastWeek = new Date(lastDayLastWk.setDate(lastDayOfTheWeek - 7));
  params.StartTime = firstDayOfLastWeek;
  params.EndTime = lastDayOfLastWeek;
  return params;
};

// Retrieve metrics

const getServiceMetrics = async (config) => {
    const { apigw, service, lambda } = config
    const { MetricDataResults: apigwRes } = await cw
        .getMetricData(formatRequest(apigw))
        .promise();
    const { MetricDataResults: lambdaRes } = await cw
        .getMetricData(formatRequest(lambda))
        .promise();

    // Format email
    const report = {
        service,
        apigw: {
            request: apigwRes[0].Values[0],
            error4XX: apigwRes[1].Values[0],
            error5XX: apigwRes[2].Values[0],
            avgLatency: `${Math.round(apigwRes[3].Values[0])} ms`,
            p99Latency: `${Math.round(apigwRes[4].Values[0])} ms`
        },
        lambda: {
            request: lambdaRes[0].Values[0],
            error: lambdaRes[1].Values[0],
            duration: `${Math.round(lambdaRes[2].Values[0])} ms`
        }
    };
    return report
}


module.exports = {
    getServiceMetrics
}
