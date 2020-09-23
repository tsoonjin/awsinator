const AWS = require('aws-sdk');

const cw = new AWS.CloudWatch({
  apiVersion: '2010-08-01',
});


/**
 * Create widget with single value
 * Typically used to report API Gateway and Lambda
*/
const createAPIGWWidget = (api, y, period=300, region="ap-southeast-1") => ({
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
            ["AWS/ApiGateway", "Count", "ApiName", api.name, {label: "Total Requests"}],
            [".", "Latency", ".", ".", {stat: "Average", label: "Avg Latency"}],
            [".", "4XXError", ".", "."],
            [".", "5XXError", ".", "."],
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
            ["AWS/Lambda", "Errors", "FunctionName", lambda.name],
            [".", "Duration", ".", ".", {stat: "Average"}],
            [".", "Invocations", ".", "."],
            [".", "Throttle", ".", "."],
        ]
    }
})

const createDashboardBody = (resources) => {
    let x, y = 0
    const widgets = []
    const { apigw, lambda } = resources
    apigw.resources.forEach((api) => {
        widgets.push(createAPIGWWidget(api, y))
        y = y + 3
    })
    lambda.resources.forEach((lambda) => {
        widgets.push(createLambdaWidget(lambda, y))
        y = y + 3
    })
    return widgets
}

const createDashboard = (name, resources) => {
    const dashboardBody = { widgets: createDashboardBody(resources) }
    console.log(dashboardBody)
    return cw.putDashboard({
        DashboardName: name,
        DashboardBody: JSON.stringify(dashboardBody)
    }).promise()
}

module.exports = {
    createDashboard
}
