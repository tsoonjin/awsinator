const AWS = require('aws-sdk');
const mjml2html = require('mjml');
const mjmlUtils = require('mjml-utils');

const ses = new AWS.SES({
  apiVersion: '2010-12-01'
});

const generateApiGatewayTable = (req) => {
    const { name, metrics: api } = req
    return `
        <mj-table font-size="12px">
          <tr style="border:1px solid #ecedee;text-align:left;padding:15px 0;">
            <th style="padding: 0.5em;">${name}</td>
            <th style="padding: 0.5em;">Metric</td>
            <th style="padding: 0.5em;">Changes (%)</td>
          </tr>
          <tr style="border:1px solid #ecedee;text-align:left;padding:15px 0;">
            <td style="padding: 0.5em;">Total Requests</td>
            <td style="padding: 0.5em;">${api.request.value}</td>
            <td style="padding: 0.5em;">${api.request.delta || ''}</td>
          </tr>
          <tr style="border:1px solid #ecedee;text-align:left;padding:15px 0;">
            <td style="padding: 0.5em;">Avg Latency (ms)</td>
            <td style="padding: 0.5em;">${api.avgLatency.value}</td>
            <td style="padding: 0.5em;">${api.avgLatency.delta || ''}</td>
          </tr>
          <tr style="border:1px solid #ecedee;text-align:left;padding:15px 0;">
            <td style="padding: 0.5em;">Error Rate</td>
            <td style="padding: 0.5em;">${api.errorRate.value}</td>
            <td style="padding: 0.5em;">${api.errorRate.delta || ''}</td>
          </tr>
        </mj-table>`
}

const generateLambdaTable = (req) => {
    const { name, metrics: lambda } = req
    return `
        <mj-table font-size="12px">
          <tr style="border:1px solid #ecedee;text-align:left;padding:15px 0;">
            <th style="padding: 0.5em;">${name}</td>
            <th style="padding: 0.5em;">Metric</td>
            <th style="padding: 0.5em;">Changes (%)</td>
          </tr>
          <tr style="border:1px solid #ecedee;text-align:left;padding:15px 0;">
            <td style="padding: 0.5em;">Total Requests</td>
            <td style="padding: 0.5em;">${lambda.request.value}</td>
            <td style="padding: 0.5em;">${lambda.request.delta || ''}</td>
          </tr>
          <tr style="border:1px solid #ecedee;text-align:left;padding:15px 0;">
            <td style="padding: 0.5em;">Duration (ms)</td>
            <td style="padding: 0.5em;">${lambda.duration.value}</td>
            <td style="padding: 0.5em;">${lambda.duration.delta || ''}</td>
          </tr>
          <tr style="border:1px solid #ecedee;text-align:left;padding:15px 0;">
            <td style="padding: 0.5em;">Error Rate</td>
            <td style="padding: 0.5em;">${lambda.errorRate.value}</td>
            <td style="padding: 0.5em;">${lambda.errorRate.delta || ''}</td>
          </tr>
        </mj-table>`
}

/*
  Compile an mjml string
*/
const generateHTML = (name, metrics) => {
    const { apigw, lambda } = metrics
    return mjml2html(`
<mjml>
  <mj-body width="1000px">
    <!-- Company Header -->
    <mj-section background-color="#ffdc5e">
      <mj-column>
        <mj-text  font-style="bold"
              font-size="28px"
              color="#000000">
            ${name}
        </mj-text>
      </mj-column>
    </mj-section>
    <mj-section>
      <mj-column>
        <mj-text align='left' font-size="20px">API Gateway Metrics</mj-text>
        ${apigw.map(api => generateLambdaTable(api)).join('\n')}
        <mj-divider padding="30px" border-width="0px" />
        <mj-text align='left' font-size="20px">Lambda Metrics</mj-text>
        ${lambda.map(l => generateLambdaTable(l)).join('\n')}
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
`);
}

const generateMessageBody = (name, content, startDate, endDate) => ({
  Subject: {
    Data: `Weekly Performance Report (${startDate} - ${endDate})`,
    Charset: 'UTF-8'
  },
  Body: {
    Text: {
      Data: 'Weekly service metrics report.',
      Charset: 'UTF-8'
    },
    Html: {
      Data: generateHTML(name, content).html,
      Charset: 'UTF-8'
    }
  }
});



const sendEmail = (config, content) => {
    const {
        startDate,
        endDate,
        targetEmails,
        senderEmail,
        name
    } = config

    const emailBody = generateMessageBody(name, content, startDate, endDate);

    return ses.sendEmail({
        Destination: targetEmails,
        Message: emailBody,
        Source: senderEmail
    }).promise();
}

module.exports = {
    sendEmail
}
