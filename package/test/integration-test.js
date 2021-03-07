const assert = require('assert');
const http = require('http');

async function issueTimedHttpGet(url, timeTracker) {
    return new Promise((resolve, reject) => {
        timeTracker.startTime = new Date().getTime();
        console.log(`${new Date()}::: Request issued to ${url}.`);
        http.get(url, (res) => {
            timeTracker.endTime = new Date().getTime();
            console.log(`${new Date()}::: Response received from ${url}.`);
            resolve(res);
        });
    });
};

async function sleep(timeMs) {
    return new Promise((resolve, reject) => {
        setTimeout(() => { resolve(); }, timeMs);
    });
}

describe('Problem Case 1 - Support Concurrent Requests', () => {

    let theApplicationServer;

    beforeEach(async () => {
        // Start server and wait for it to finish loading
        theApplicationServer = require('../src/server.js');
        const firstHealthResponse = await issueTimedHttpGet('http://localhost:3000/health', {});
        assert.equal(firstHealthResponse.statusCode, 200);
    });

    afterEach(() => {
        if (theApplicationServer) {
            theApplicationServer.close();
        }
    });

    it('should process other requests while /hash endpoint is processing', async () => {

        // 1. Issue request to generate hash (should take ~5 seconds). Immediately proceed and do not wait for response
        const generateHashTiming = {};
        const promiseHittingHashEndpoint = issueTimedHttpGet('http://localhost:3000/generate?value=myvalue', generateHashTiming);

        // 2. Wait a moment to ensure first request is issued.
        await sleep(250); //ms

        // 3. Issue another request to health endpoint. Immediately proceed and do not wait for response
        const getHealthTiming = {};
        const promiseHittingHealthEndpoint = issueTimedHttpGet('http://localhost:3000/health', getHealthTiming);

        // 4. Wait for both open requests to finish
        await Promise.all([promiseHittingHashEndpoint, promiseHittingHealthEndpoint]);

        // 5. Assert the health request started later but finished sooner
        assert.equal(getHealthTiming.startTime > generateHashTiming.startTime, true);
        assert.equal(getHealthTiming.endTime < generateHashTiming.endTime, true);

    }).timeout(20000);
});
