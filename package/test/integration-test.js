const assert = require('assert');
const http = require('http');

function issueTimedHttpGet(url) {
    let timeTracker = {};

    let promise = new Promise((resolve) => {

        console.log(`${new Date()}::: Request issued to ${url}.`);
        timeTracker.startTime = new Date().getTime();

        http.get(url, (res) => {
            timeTracker.endTime = new Date().getTime();
            console.log(`${new Date()}::: Response received from ${url}.`);
            resolve(res);
        });

    });

    return { timeTracker, promise };
};

async function sleep(timeMs) {
    return new Promise(resolve => { setTimeout(resolve, timeMs); });
}

describe('Problem Case 1 - Support Concurrent Requests', () => {

    let theApplicationServer;

    beforeEach(async () => {
        // Start server and wait for it to finish loading
        // theApplicationServer = require('../src/original_server.js');
        theApplicationServer = require('../src/server.js');
        await sleep(250);
        const httpGet = await issueTimedHttpGet('http://localhost:3000/health');
        const response = await httpGet.promise;
        assert.strictEqual(response.statusCode, 200);
    });

    afterEach(() => {
        if (theApplicationServer) {
            theApplicationServer.close();
        }
    });

    it('should process other requests while /hash endpoint is processing', async () => {

        // 1. Issue request to generate hash (should take ~5 seconds). Immediately proceed and do not wait for response
        const hashRequest = issueTimedHttpGet('http://localhost:3000/generate?value=myvalue');

        // 2. Wait a moment to ensure first request is issued.
        await sleep(250); //ms

        // 3. Issue another request to health endpoint. Immediately proceed and do not wait for response
        const healthRequest = issueTimedHttpGet('http://localhost:3000/health');

        // 4. Wait for both open requests to finish
        await Promise.all([hashRequest.promise, healthRequest.promise]);

        // 5. Assert the health request started later but finished sooner
        assert.strictEqual((await healthRequest.promise).statusCode, 200);
        assert.strictEqual(healthRequest.timeTracker.startTime > hashRequest.timeTracker.startTime, true);
        assert.strictEqual((await hashRequest.promise).statusCode, 200);
        assert.strictEqual(healthRequest.timeTracker.endTime < hashRequest.timeTracker.endTime, true);

    }).timeout(20000);
});
