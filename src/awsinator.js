#! /usr/bin/env node
process.env.AWS_SDK_LOAD_CONFIG = true;

const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const mjml2html = require('mjml');
const mjmlUtils = require('mjml-utils');
const yargs = require("yargs");


/*
  Compile an mjml string
*/
const generateHTML = metrics => mjml2html(`
<mjml>
  <mj-body width="1000px">
    <!-- Company Header -->
    <mj-section background-color="#ffdc5e">
      <mj-column>
        <mj-text  font-style="bold"
              font-size="28px"
              color="#000000">
          Weekly Performance Reports
        </mj-text>
      </mj-column>
    </mj-section>
    <mj-section>
      <mj-column>
        <mj-text align='left' font-size="20px">API Gateway Metrics</mj-text>
        <mj-table font-size="14px">
          <tr style="border:1px solid #ecedee;text-align:left;padding:15px 0;">
            <th style="padding: 0.5em;">Service</td>
            <th style="padding: 0.5em;">Requests</td>
            <th style="padding: 0.5em;">4XX Errors</td>
            <th style="padding: 0.5em;">5XX Errors</td>
            <th style="padding: 0.5em;">Avg Latency</td>
            <th style="padding: 0.5em;">P99 Latency</td>
          </tr>
          <tr style="border:1px solid #ecedee;text-align:left;padding:15px 0;">
            <td style="padding: 0.5em;">${metrics.service}</td>
            <td style="padding: 0.5em;">${metrics.apigw.request}</td>
            <td style="padding: 0.5em;">${metrics.apigw.error4XX}</td>
            <td style="padding: 0.5em;">${metrics.apigw.error5XX}</td>
            <td style="padding: 0.5em;">${metrics.apigw.avgLatency}</td>
            <td style="padding: 0.5em;">${metrics.apigw.p99Latency}</td>
          </tr>
        </mj-table>
        <mj-divider padding="30px" border-width="0px" />

        <mj-text align='left' font-size="20px">Lambda Metrics</mj-text>
        <mj-table font-size="14px">
          <tr style="border:1px solid #ecedee;text-align:left;padding:15px 0;">
            <th style="padding: 0.5em;">Service</td>
            <th style="padding: 0.5em;">Requests</td>
            <th style="padding: 0.5em;">Errors</td>
            <th style="padding: 0.5em;">Durations</td>
          </tr>
          <tr style="border:1px solid #ecedee;text-align:left;padding:15px 0;">
            <td style="padding: 0.5em;">${metrics.service}</td>
            <td style="padding: 0.5em;">${metrics.lambda.request}</td>
            <td style="padding: 0.5em;">${metrics.lambda.error}</td>
            <td style="padding: 0.5em;">${metrics.lambda.duration}</td>
          </tr>
        </mj-table>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
`);

const generateMessageBody = ({ start_date, end_date, report }) => ({
  Subject: {
    Data: `Weekly Performance Report (${start_date} - ${end_date})`,
    Charset: 'UTF-8'
  },
  Body: {
    Text: {
      Data: 'This is the message body in text format.',
      Charset: 'UTF-8'
    },
    Html: {
      Data: generateHTML(report).html,
      Charset: 'UTF-8'
    }
  }
});

// Config setup

const options = yargs
 .usage("Usage: -c <config>")
 .option("c", { alias: "config", describe: "Config file", type: "string", demandOption: true })
 .argv;

const config = JSON.parse(
  fs.readFileSync(options.config, 'utf-8')
);
const {
  apigw, lambda, region, service, email
} = config;

const ses = new AWS.SES({
  apiVersion: '2010-12-01'
});

const cw = new AWS.CloudWatch({
  apiVersion: '2010-08-01',
  region
});

// Helper functions

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
  console.log(params.StartTime, params.EndTime)
  return params;
};

// Main Code


(async () => {
  try {
    const dateNow = new Date();
    const firstDayOfTheWeek = dateNow.getDate() - dateNow.getDay() + 1; // Remove + 1 if sunday is first day of the week.
    const lastDayOfTheWeek = firstDayOfTheWeek + 6;
    const firstDayOfLastWeek = new Date(dateNow.setDate(firstDayOfTheWeek - 7));
    const lastDayOfLastWeek = new Date(dateNow.setDate(lastDayOfTheWeek - 7));

    // Retrieve metrics
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
    const emailContent = generateMessageBody({
      start_date: firstDayOfLastWeek,
      end_date: lastDayOfLastWeek,
      report
    });
    await ses
      .sendEmail({
        Destination: email.destination,
        Message: emailContent,
        Source: email.source
      })
      .promise();
    console.log('Email sent');
  } catch (e) {
    console.error(e);
  }
})();
