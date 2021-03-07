const assert = require('assert');
const http = require('http');

async function issueTimedHttpGet(url, timeTracker) {
    return new Promise((resolve, reject) => {
        timeTracker.startTime = new Date().getTime();
        http.get(url, (res) => {
            timeTracker.endTime = new Date().getTime();
            resolve(res);
        });
    });
};

describe('Support for concurrent requests', () => {

    let theApplicationServer;

    beforeEach(async () => {
        // Start server and wait for it to finish loading
        theApplicationServer = require('../src/server.js');
        const firstHealthResponse = await issueTimedHttpGet('http://localhost:3000/health', {});
        assert.equal(firstHealthResponse.statusCode, 200);
        console.log("Successully started");
    });

    afterEach(() => {
        if (theApplicationServer) {
            theApplicationServer.close();
        }
    });

    it('should support simultaneous requests to two endpoints', async () => {

        // 1. Issue request to generate hash (should take ~5 seconds) 
        // Immediately proceed and do not wait for response
        const generateHashTiming = {};
        const promiseHittingHashEndpoint = issueTimedHttpGet('http://localhost:3000/generate?value=myvalue', generateHashTiming);

        // 2. Issue another request to health endpoint
        // Immediately proceed and do not wait for response
        const getHealthTiming = {};
        const promiseHittingHealthEndpoint = issueTimedHttpGet('http://localhost:3000/health', getHealthTiming);

        // 3. Wait for both open requests to finish
        await Promise.all([promiseHittingHashEndpoint, promiseHittingHealthEndpoint]);

        // 4. Assert the health request started later but finished sooner
        assert.equal(getHealthTiming.startTime >= generateHashTiming.startTime, true);
        assert.equal(getHealthTiming.startTime < generateHashTiming.endTime, true);
        assert.equal(getHealthTiming.endTime < generateHashTiming.endTime, true);

    }).timeout(20000);
});
