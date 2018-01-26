'use strict'

const scheduler = require('node-schedule')
const WEEKLY = '0 1 3 * * 1'

module.exports = {
    run
}

function run() {
    scheduler.scheduleJob(WEEKLY, require('./digest'))
}