const express = require("express")
const path = require("path")
const { createLogger } = require("bunyan")
const bunyanMiddleware = require("bunyan-middleware")
const bunyanDebugStream = require("bunyan-debug-stream")
const { Worker } = require('worker_threads')

const logger = createLogger({
  name: "interview",
  streams: [
    {
      level: "info",
      type: "raw",
      stream: bunyanDebugStream({
        basepath: path.resolve(__dirname, "../"),
        forceColor: true,
      }),
    },
  ],
  serializers: bunyanDebugStream.serializers,
})

const app = express()

app.use(bunyanMiddleware({ logger }))

async function generateHashAsync(workerData) {
  return new Promise((resolve, reject) => {
    const worker = new Worker('./src/bcryptHelper.js', { workerData });
    worker.on('message', resolve);
    worker.on('error', reject);
    worker.on('exit', (code) => {
      if (code !== 0)
        reject(new Error(`Worker stopped with exit code ${code}`));
    })
  })
}


app.get("/generate", async (req, res) => {
  const hash = await generateHashAsync(req.query.value);
  res.send({ hash })
});

app.get("/health", (req, res) => {
  res.send({ status: "healthy" })
})

app.listen(3000, (err) => {
  if (err) {
    logger.error(err)
  }

  logger.info("Listening on http://localhost:3000")
})
