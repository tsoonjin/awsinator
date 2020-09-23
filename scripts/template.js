/**
 * Create time series widget
*/
const createCFWidget = (title, y, period, api, region="ap-southeast-1") => {
    type: "metric",
    height: 3,
    width: 24,
    x: 0,
    y,
    properties: {
        period,
        region,
        title,
        setPeriodToTimeRange: true,
        stat: "Sum"
        view: "singleValue",
        metrics: [
            ["AWS/ApiGateway", "Count", "ApiName", api.name, "Resource", api.path, "Stage", api.stage, "Method", api.method],
            [".", "Latency", ".", ".", ".", ".", ".", ".", ".", ".", {stat: true}],
            [".", "4XXError", ".", ".", ".", ".", ".", ".", ".", "."],
            [".", "5XXError", ".", ".", ".", ".", ".", ".", ".", "."],
        ]
    }
}

/**
 * Create widget with single value
 * Typically used to report API Gateway and Lambda
*/
const createAPIGWWidget = (title, y, period, api, region="ap-southeast-1") => {
    type: "metric",
    height: 3,
    width: 24,
    x: 0,
    y,
    properties: {
        period,
        region,
        title,
        setPeriodToTimeRange: true,
        stat: "Sum"
        view: "singleValue",
        metrics: [
            ["AWS/ApiGateway", "Count", "ApiName", api.name, "Resource", api.path, "Stage", api.stage, "Method", api.method],
            [".", "Latency", ".", ".", ".", ".", ".", ".", ".", ".", {stat: true}],
            [".", "4XXError", ".", ".", ".", ".", ".", ".", ".", "."],
            [".", "5XXError", ".", ".", ".", ".", ".", ".", ".", "."],
        ]
    }
}

/**
 * Create widget with single value
 * Typically used to report API Gateway and Lambda
*/
const createLambdaWWidget = (title, y, period, lambda, region="ap-southeast-1") => {
    type: "metric",
    height: 3,
    width: 24,
    x: 0,
    y,
    properties: {
        period,
        region,
        title,
        setPeriodToTimeRange: true,
        stat: "Sum"
        view: "singleValue",
        metrics: [
            ["AWS/Lambda", "Errors", "FunctionName", lambda.name],
            [".", "Duration", ".", ".", {stat: true}],
            [".", "Invocations", ".", ".", {stat: true}],
            [".", "Throttle", ".", ".", {stat: true}],
        ]
    }
}

