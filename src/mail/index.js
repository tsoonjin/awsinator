const AWS = require('aws-sdk');
const mjml2html = require('mjml');
const mjmlUtils = require('mjml-utils');

const ses = new AWS.SES({
  apiVersion: '2010-12-01'
});

/*
  Compile an mjml string
*/
const generateHTML = (name, metrics) => mjml2html(`
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
        <mj-table font-size="12px">
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
        <mj-table font-size="12px">
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
