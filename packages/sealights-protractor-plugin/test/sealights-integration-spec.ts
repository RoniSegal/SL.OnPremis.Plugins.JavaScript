/**
 * This file copied from sl-testcafe-plugin
 * Til end August 21 it should be moved to a plugin-common repo
 */
import {createSandbox, SinonSandbox, SinonStubbedInstance, createStubInstance, assert,  match} from 'sinon';
import {expect, use} from 'chai'
import {SealightsIntegration} from '../src/sealights-integration';
import * as slnodejs from 'slnodejs';
import {buildTestFullName} from '../src/utils';
import * as chaiAsPromised from 'chai-as-promised';
use(chaiAsPromised);

let mocks: SinonSandbox;
let sealightsIntegration: SealightsIntegration;
let mockAgent: SinonStubbedInstance<slnodejs.RemoteAgent>;

describe('SealightsIntegration', () => {
    const fixtureName = 'Fixture 1';
    const testName = 'test 1';
    const fullName = buildTestFullName(testName, fixtureName);
    let testRunInfo;
    const coverage = {}

    beforeEach(() => {
        mocks = createSandbox();
        mockAgent = createStubInstance(slnodejs.RemoteAgent);
        sealightsIntegration = new SealightsIntegration({} as any);
        testRunInfo = {
            durationMs: 500,
            errs: []
        }
    });

    afterEach(() => {
        mocks.restore();
    });

    describe('Agent initialized', () => {
        beforeEach (async () => {
            mocks.stub(slnodejs, 'createTiaAgent').resolves(mockAgent as any);
            await sealightsIntegration.tryInitAgent();
        });

        it('should call \'agent.startExecution\'', async () => {
            await sealightsIntegration.taskStart();

            assert.calledOnce(mockAgent.startExecution);
        });

        it('should call \'agent.getExcludedTests\'', async () => {
            await sealightsIntegration.getExcludedTests();

            assert.calledOnce(mockAgent.getExcludedTests);
        });

        it('should call \'agent.endExecution\' and \'agent.stop\'', async () => {
            await sealightsIntegration.taskDone();

            assert.calledOnce(mockAgent.endExecution);
            assert.calledOnce(mockAgent.stop);
        });

        describe('testDone', () => {
            it('should call \'agent.testEnd\' with result == passed', async () => {
                await sealightsIntegration.testDone(testName, fixtureName, testRunInfo, coverage);

                assert.calledOnceWithExactly(mockAgent.testEnd, fullName, fixtureName, testRunInfo.durationMs, 'passed', coverage);
            });

            it('should call \'agent.testStart\' with calculated start time', async () => {
                await sealightsIntegration.testDone(testName, fixtureName, testRunInfo, coverage);

                assert.calledOnceWithExactly(mockAgent.testStart, fullName, fixtureName, match.number);
            });

            it('should call \'agent.testEnd\' with result == failed', async () => {
                testRunInfo.errs.push(new Error());

                await sealightsIntegration.testDone(testName, fixtureName, testRunInfo, coverage);

                assert.calledOnceWithExactly(mockAgent.testEnd, fullName, fixtureName, testRunInfo.durationMs, 'failed', coverage);
            });

            it('should call \'agent.testEnd\' with result == skipped', async () => {
                testRunInfo.skipped = true;

                await sealightsIntegration.testDone(testName, fixtureName, testRunInfo, coverage);

                assert.calledOnceWithExactly(mockAgent.testEnd, fullName, fixtureName, testRunInfo.durationMs, 'skipped', coverage);
            });
        });
    });

    describe('Agent methods failed', () => {
        beforeEach (async () => {
            mocks.stub(slnodejs, 'createTiaAgent').resolves(mockAgent as any);
            await sealightsIntegration.tryInitAgent();
        });

        it('should not fail when  \'agent.taskStart\' rejects', async () => {
            mockAgent.startExecution.rejects();
            await expect(sealightsIntegration.taskStart()).to.eventually.be.fulfilled;
        });

        it('should not fail when \'agent.getExcludedTests\' rejects', async () => {
            mockAgent.getExcludedTests.rejects();
            await sealightsIntegration.getExcludedTests();

            await expect(sealightsIntegration.getExcludedTests()).to.eventually.deep.equal({});
        });

        it('should not fail when  \'agent.endExecution\' rejects', async () => {
            mockAgent.endExecution.rejects();
            mockAgent.stop.resolves();
            await expect(sealightsIntegration.taskDone()).to.eventually.be.fulfilled;
        });

        it('should not fail when  \'agent.stop\' rejects', async () => {
            mockAgent.endExecution.resolves();
            mockAgent.stop.rejects();
            await expect(sealightsIntegration.taskDone()).to.eventually.be.fulfilled;
        });

        it('should not fail when  \'agent.testEnd\' throws', async () => {
            mockAgent.testEnd.throws();
            await expect(sealightsIntegration.testDone(testName, fixtureName, testRunInfo, coverage)).to.eventually.be.fulfilled;
        });

        it('should not fail when  \'agent.testStart\' throws', async () => {
            mockAgent.testStart.throws();
            mockAgent.testEnd.returns();
            await expect(sealightsIntegration.testDone(testName, fixtureName, testRunInfo, coverage)).to.eventually.be.fulfilled;
        });

        it('should not fail when  \'agent.stop\' rejects', async () => {
            mockAgent.stop.rejects();
            await expect(sealightsIntegration.taskDone()).to.eventually.be.fulfilled;
        });
    });

    describe('Agent failed to initialized', () => {
        beforeEach (async () => {
            mocks.stub(slnodejs, 'createTiaAgent').rejects();
            await sealightsIntegration.tryInitAgent();
        });

        it('should not call \'agent.startExecution\'', async () => {
            await sealightsIntegration.taskStart();

            assert.notCalled(mockAgent.startExecution);
        });

        it('should not call \'agent.endExecution\' and \'agent.stop\'', async () => {
            await sealightsIntegration.taskDone();

            assert.notCalled(mockAgent.endExecution);
            assert.notCalled(mockAgent.stop);
        });

        it('should not call \'agent.testEnd\' and \'agent.testStart\'', async () => {
            await sealightsIntegration.testDone(testName, fixtureName, {}, {});

            assert.notCalled(mockAgent.testStart);
            assert.notCalled(mockAgent.testEnd);
        });

        it('should return empty object when asking for excluded tests', async () => {
            const excludedTests = await sealightsIntegration.getExcludedTests();

            assert.notCalled(mockAgent.getExcludedTests);
            expect(excludedTests).deep.eq({})
        });
    });
});