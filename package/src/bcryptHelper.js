const { workerData, parentPort } = require('worker_threads');
const bcrypt = require("bcrypt");

const result = bcrypt.hashSync(workerData, 16);

parentPort.postMessage({ result: result });