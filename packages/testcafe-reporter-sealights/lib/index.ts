import {skipBrowserAgentKey, slWindowObject} from 'slnodejs'
import {CoverageMap} from 'istanbul-lib-coverage'
import {getSLArgs, SealightsIntegration} from 'sealights-plugins-common';
import {buildTestFullName, getAggregatedCoverageForTest} from './utils';
import {ITestData} from './contracts';

let slArgs = getSLArgs();
const bootstrapperFile = 'testcafe/lib/runner/bootstrapper';
const skipAgentDownloadScript = `${slWindowObject} = ${slWindowObject} || {};
                                 ${skipBrowserAgentKey} = true;`;
const coverageObjectPrefix = '$SealightsCoverage';
const coverageForTest: {[fullName: string]: CoverageMap[]} = {};
const sealightsIntegration = new SealightsIntegration(slArgs as any);
const testIdToTestData: {[testId: string]: ITestData} = {}
module.exports  =  function() {

    wrapGetTestsMethod()

    return {
        async reportTaskStart() {
            await sealightsIntegration.taskStart();
        },

        async reportFixtureStart(name) {
            this.currentFixtureName = name;
        },

        async reportTestDone(name, testRunInfo) {
            const testData = testIdToTestData[testRunInfo.testId];
            const fullName = buildTestFullName(testData.testName, testData.fixtureName);
            let aggregatedCoverage = getAggregatedCoverageForTest(coverageForTest[fullName]);
            await sealightsIntegration.testDone(name, this.currentFixtureName, testRunInfo, aggregatedCoverage)
        },

        async reportTaskDone() {
            await sealightsIntegration.taskDone();
        }
    }
}

function wrapGetTestsMethod() {
    let bootstrapperPath = require.resolve(bootstrapperFile);
    let bootstrapper = require(bootstrapperPath);
    const originalGetTests = bootstrapper.prototype._getTests;
    bootstrapper.prototype._getTests = async function() {
        const relevantTests = await originalGetTests.apply(this, arguments);
        await sealightsIntegration.tryInitAgent();
        const excluded = await sealightsIntegration.getExcludedTests();
        relevantTests.forEach(tst => {
            testIdToTestData[tst.id] = {testName: tst.name, fixtureName: tst.fixture.name}
            tst.clientScripts.push({ content: skipAgentDownloadScript})
            markTestExcluded(tst, excluded);
            injectAfterHook(tst);
        });
        return relevantTests;
    };
}

function markTestExcluded(test, excludedTests): void {
    const fullName = buildTestFullName(test.name, test.fixture.name);
    if (excludedTests[fullName]) {
        test.skip = true;
    }
}

function injectAfterHook(tst) {
    const originalAfter = tst.afterFn;
    tst.afterFn = async function(t) {
        if (originalAfter) {
            await originalAfter.apply(this, arguments);
        }
        const fullName = buildTestFullName(t.test.name , t.test.fixture.name);
        const bsid = sealightsIntegration.getBuildSessionId();
        const coverageKey = `${coverageObjectPrefix}_${bsid}`.toString();
        coverageForTest[fullName] = coverageForTest[fullName] || [];
        const coverageData = await t.controller.eval(() => <any>window[coverageKey], {boundTestRun: t.controller, dependencies: {coverageKey}} as any);
        coverageForTest[fullName].push(coverageData);
    }
}
