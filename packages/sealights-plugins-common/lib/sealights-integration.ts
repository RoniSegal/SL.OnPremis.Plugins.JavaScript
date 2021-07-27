import { createTiaAgent, ITestRunnerArgs, RemoteAgent, getSystemDateValueOf} from 'slnodejs';
import {buildTestFullName} from './utils';

export class SealightsIntegration {
    private agent: RemoteAgent;
    private slArgs: ITestRunnerArgs;

    constructor(slArgs: ITestRunnerArgs) {
        this.slArgs = slArgs;
    }

    public async tryInitAgent() {
        try {
            this.agent = await createTiaAgent(this.slArgs);
            await this.agent.start();
        } catch (e) {
            // eslint-disable-next-line no-console
            console.log(`Error while initializing Sealights agent ${e.message}`)
        }
    }

    @SealightsIntegration.runAgentMethodSafe()
    public async taskStart(): Promise<void> {
        await this.agent.startExecution();
    }

    @SealightsIntegration.runAgentMethodSafe({})
    public async getExcludedTests(): Promise<any> {
        return await this.agent.getExcludedTests();
    }

    @SealightsIntegration.runAgentMethodSafe()
    public async taskDone(): Promise<void> {
        await this.agent.endExecution();
        await this.agent.stop();
    }
    private testStart(name: string, fixtureName: string, duration: number): void {
        const fullName = buildTestFullName(name, fixtureName);
        const startTime = getSystemDateValueOf() - duration;
        this.agent.testStart(fullName, fixtureName, startTime);
    }

    @SealightsIntegration.runAgentMethodSafe()
    public async testDone(name: string, fixtureName: string, testRunInfo, coverage): Promise<void> {
        const errors = testRunInfo.errs;
        const hasErrors = !!errors.length;
        const result = testRunInfo.skipped ? 'skipped' : (hasErrors ? 'failed' : 'passed');
        const fullName = buildTestFullName(name, fixtureName);
        const duration = testRunInfo.durationMs;
        this.testStart(name, fixtureName, duration);
        this.agent.testEnd(fullName, fixtureName, duration, result, coverage);
    }

    @SealightsIntegration.runAgentMethodSafe()
    public getBuildSessionId(): string {
        return this.agent.agentConfig.buildSessionId.value
    }

    public static runAgentMethodSafe(defaultResult?: object) {
        return function(target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<any>): TypedPropertyDescriptor<any> | void {
            const method = descriptor.value;
            descriptor.value = function(...args) {
                if (!this.agent) return defaultResult;
                try {
                    let result = method.apply(this, args);
                    // If method is asynchronous error does not thrown but rejected promise returned
                    if (result && result instanceof Promise) {
                        return result.catch((error: any) => {
                            return this.handleAgentError(error, method.name, defaultResult);
                        });
                    }
                    return result;
                } catch (error) {
                    return this.handleAgentError(error, method.name, defaultResult);
                }
            }
        }
    }

    private handleAgentError(e: Error, methodName: string, defaultResult: object) {
        // eslint-disable-next-line no-console
        console.log(`Error while executing method '${methodName}', Err: '${e.message}'`);
        return defaultResult;
    }

}

