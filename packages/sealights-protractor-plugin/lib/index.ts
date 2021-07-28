import {browser as protractorBrowser} from "protractor";
import {SeleniumMethods} from "./contracts";
import {getSLArgs, SealightsIntegration} from "sealights-plugins-common";

const sendFootprintsScript = 'if(window && window.$SealightsAgent &&  window.$SealightsAgent.sendAllFootprints){' +
    'window.$SealightsAgent.sendAllFootprints().' +
    'then(arguments[arguments.length - 1])' +
    '} else {' +
    ' arguments[arguments.length - 1]()' +
    '}';
const originalSeleniumMethods: Map<SeleniumMethods, Function> = new Map();

async function runScriptSafe() {
    try {
        await protractorBrowser.executeAsyncScript(sendFootprintsScript);
    } catch (e) {
        console.log(`Unable to send footprints from browser, Error '${e.message}'`)
    }
}

module.exports = {
     name: 'sealights-protractor-plugin',
     sealightsIntegration: SealightsIntegration,

    setup: async function () {
         Object.values(SeleniumMethods).forEach(method => {
             originalSeleniumMethods[method] = protractorBrowser[method];
             protractorBrowser[method] = async function () {
                 await runScriptSafe();
                 return originalSeleniumMethods[method].apply(this, arguments)
             }
         });
        this.sealightsIntegration = new SealightsIntegration(getSLArgs())
        await this.sealightsIntegration.tryInitAgent();
        await this.sealightsIntegration.taskStart();
    },


    teardown: async function() {
        await runScriptSafe();
        await this.sealightsIntegration.taskDone();
    }
}
