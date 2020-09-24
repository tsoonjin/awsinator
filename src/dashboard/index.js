const AWS = require('aws-sdk');

const cw = new AWS.CloudWatch({
  apiVersion: '2010-08-01',
});

const ld = new AWS.Lambda({
    apiVersion: '2015-03-31'}
);

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

module.exports = {
    createDashboard
}
