const { Worker } = require('worker_threads')

async function generateHashAsync(valueToHash) {
    return new Promise((resolve, reject) => {
        const worker = new Worker('./src/bcryptWorkerThread.js', { workerData: valueToHash });
        worker.on('message', resolve);
        worker.on('error', reject);
        worker.on('exit', (code) => {
            if (code !== 0) {
                reject(new Error(`Worker stopped with exit code ${code}`));
            }
        });
    });
}

module.exports = { generateHashAsync };