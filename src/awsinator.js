#! /usr/bin/env node
process.env.AWS_SDK_LOAD_CONFIG = true;

const fs = require('fs');
const yargs = require("yargs");
const mail = require("./mail")
const dashboard = require("./dashboard")
const metric = require("./metric")

// Config setup

const options = yargs
 .usage("Usage: -c <config>")
 .option("c", { alias: "config", describe: "Config file", type: "string"})
 .argv;

const defaultConfig = './config.json'
const config = JSON.parse(
  fs.readFileSync(options.config || defaultConfig, 'utf-8')
);

// Supported functionalities

const sendReportEmail = async () => {
  const {
      apigw, service, lambda, region, email
  } = config;

  try {
    const dateNow = new Date();
    const firstDayOfTheWeek = dateNow.getDate() - dateNow.getDay() + 1; // Remove + 1 if sunday is first day of the week.
    const lastDayOfTheWeek = firstDayOfTheWeek + 6;
    const firstDayOfLastWeek = new Date(dateNow.setDate(firstDayOfTheWeek - 7));
    const lastDayOfLastWeek = new Date(dateNow.setDate(lastDayOfTheWeek - 7));

    const report = await metric.getServiceMetrics({
      service,
      apigw,
      lambda
    })
    await mail.sendEmail({
          ...email,
          name: service,
          startDate: firstDayOfLastWeek,
          endDate: lastDayOfLastWeek,
      }, report)
    console.log("Email sent")
  } catch (e) {
    console.error(e);
  }
}

(async () => {
    const { service, apigw, lambda, alarmActions, cf } = config
    if (options.email) {
        console.log("Send service metrics email")
        await sendReportEmail()
    }
    if (options.dashboard) {
        console.log("Create dashboard")
        await dashboard.createDashboard(`${service}-Auto`, { apigw, lambda, cf })
    }
    if (options.alarm) {
        console.log("Create alarms")
        await dashboard.createAlarms(apigw, lambda, alarmActions)
    }
})();
