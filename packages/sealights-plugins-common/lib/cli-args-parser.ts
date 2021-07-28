import {ITestRunnerArgs} from "slnodejs";

const minimist = require('minimist');

export function getSLArgs(): ITestRunnerArgs {
    const args = minimist(process.argv.slice(2));
    const slKeys = Object.keys(args).filter(key => key.indexOf('sl-') === 0);
    const slArgs = <ITestRunnerArgs>{};

    slKeys.forEach(key => {
        slArgs[key.replace('sl-', '').toLowerCase()] = args[key];
    });
    return slArgs;
}
