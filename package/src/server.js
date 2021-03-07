const express = require("express")
const path = require("path")
const { createLogger } = require("bunyan")
const bunyanMiddleware = require("bunyan-middleware")
const bunyanDebugStream = require("bunyan-debug-stream")
const hashService = require("./hashService");

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

app.get("/generate", async (req, res) => {
  const hash = await hashService.generateHashAsync(req.query.value);
  res.send({ hash })
});

app.get("/health", (req, res) => {
  res.send({ status: "healthy" })
})

module.exports = app.listen(3000, (err) => {
  if (err) {
    logger.error(err)
  }

  logger.info("Listening on http://localhost:3000")
})
