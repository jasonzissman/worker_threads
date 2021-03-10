const { workerData, parentPort } = require('worker_threads');
const bcrypt = require("bcrypt");

const hashedValue = bcrypt.hashSync(workerData, 16);

parentPort.postMessage({ hashedValue });