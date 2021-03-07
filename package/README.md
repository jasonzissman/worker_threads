## Worker Threads

### Problem

We have an API that generates hashed values through the [bcrypt](https://npmjs.com/bcrypt) library. _bcrypt_ at high entropy is a CPU-intensive algorithm, and for the sake of the exercise, assume it can only run in a synchronous way (bcrypt has an async method by default, but it's not used in this exercise).

When a user makes a request to `GET /generate?value=myvalue`, a hash is created based on `myvalue` using entropy 16. However, because the operation is synchronous, the express app is not able to respond to incoming requests while the hash is created.

#### Example

Minimum Node version: 10.22.1

Run the app with `[yarn|npm] start`. Make a request to http://localhost:3000/generate?value=myvalue. While the request _is still running_, request the healthcheck endpoint at http://localhost:3000/health. Notice that the healthcheck request cannot complete until the hash is generated.

### What we need

With the assumption that bcrypt doesn't have an async implementation, we need it to be non-blocking on Node's main thread. Modify the example app to execute `bcrypt.hashSync` in a worker thread.

LTS Reference: https://nodejs.org/docs/latest-v12.x/api/worker_threads.html

### Integration tests
Run `npm test` (after installing dev dependencies) to run an integration test which highlights this problem. 