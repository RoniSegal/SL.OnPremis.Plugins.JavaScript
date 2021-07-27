const minimist = require('minimist');

export function getSLArgs() {
    const args = minimist(process.argv.slice(2));
    const slKeys = Object.keys(args).filter(key => key.indexOf('sl-') === 0);
    const slArgs = {};

    slKeys.forEach(key => {
        slArgs[key.replace('sl-', '').toLowerCase()] = args[key];
    });
    return slArgs;
}
