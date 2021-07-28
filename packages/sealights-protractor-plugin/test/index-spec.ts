import {browser as protractorBrowser, Runner} from 'protractor';
import * as chaiAsPromised from 'chai-as-promised';
import {expect, use} from 'chai'
import {createSandbox, SinonSandbox, assert, SinonStub} from 'sinon';
import * as plugin from '../lib/index';
import {SealightsIntegration} from 'sealights-plugins-common';
import {SeleniumMethods} from "../lib/contracts";

use(chaiAsPromised)
const config = {
    plugins: [{inline: plugin}],
    framework: 'custom',
    capabilities: {
        browserName: 'chrome',
        chromeOptions: {args: ['--headless', '--disable-gpu', '--window-size=1920x1080']}
    }
}
describe('plugin', () => {
    let mocks: SinonSandbox;
    let mockExecute: SinonStub;

    before(async () => {
        let runner = new Runner(config);
        let browser = await runner.createBrowser([plugin]);
        runner.setupGlobals_(browser)
    })

    beforeEach(() => {
        mocks = createSandbox();
        mockExecute = mocks.stub(protractorBrowser, 'executeAsyncScript');
        mocks.stub(SealightsIntegration.prototype, 'tryInitAgent').resolves();
        mocks.stub(SealightsIntegration.prototype, 'taskStart').resolves();
    })

    afterEach(() => {
        mocks.restore();
    })

    describe('setup', () => {
        describe('wrap selenium methods', () => {
            beforeEach(() => {
                mockExecute.resolves();
            });

            it('should wrap \'get\' method', async () => {
                mocks.stub(protractorBrowser, SeleniumMethods.GET).resolves();

                await (plugin as any).setup();
                await protractorBrowser.get('fake');

                assert.calledOnce(mockExecute);
            });

            it('should wrap \'close\' method', async () => {
                mocks.stub(protractorBrowser, SeleniumMethods.CLOSE).resolves();

                await (plugin as any).setup();
                await protractorBrowser.close();

                assert.calledOnce(mockExecute);
            });

            it('should wrap \'quit\' method', async () => {
                mocks.stub(protractorBrowser, SeleniumMethods.QUIT).resolves();

                await (plugin as any).setup();
                await protractorBrowser.quit();

                assert.calledOnce(mockExecute);
            });
        });

        describe('wrap selenium methods - executeAsyncScript failed', () => {
            beforeEach(() => {
                mockExecute.rejects();
            });

            it('should not fail on \'get\' method', async () => {
                mocks.stub(protractorBrowser, SeleniumMethods.GET).resolves();

                await (plugin as any).setup();

                await expect(protractorBrowser.get('fake')).to.eventually.be.fulfilled;
            });

            it('should not fail on \'close\' method', async () => {
                mocks.stub(protractorBrowser, SeleniumMethods.CLOSE).resolves();

                await (plugin as any).setup();

                await expect(protractorBrowser.close()).to.eventually.be.fulfilled;
            });

            it('should not fail on \'quit\' method', async () => {
                mocks.stub(protractorBrowser, SeleniumMethods.QUIT).resolves();

                await (plugin as any).setup();

                await expect(protractorBrowser.quit()).to.eventually.be.fulfilled;
            });
        });
    });

    describe('teardown', () => {
        it('should call send footprints script', async () => {
            mockExecute.resolves();

            await (plugin as any).teardown();

            assert.calledOnce(mockExecute);
        });

        it('should not fail if \'executeAsyncScript\' rejected', async () => {
            mockExecute.rejects();

            await expect((plugin as any).teardown()).to.eventually.be.fulfilled;
        });
    });
});