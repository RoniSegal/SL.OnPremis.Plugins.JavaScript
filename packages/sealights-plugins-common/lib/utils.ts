import {CoverageMap, createCoverageMap} from 'istanbul-lib-coverage'
export function buildTestFullName(testName: string, fixtureName: string): string {
    return `${fixtureName} - ${testName}`;
}

/**
 * Testcafe allows running tests in multiple browsers so each test may have several coverage objects.
 * This method aggregate them to one by using 'merge' from 'istanbul-lib-coverage'
 * If there is only single coverage object it will be returned as is.
 */
export function getAggregatedCoverageForTest(coverageForTest: CoverageMap[] = [<CoverageMap>{}]): CoverageMap {
    const aggregated = coverageForTest.shift();
    const coverageMap = createCoverageMap(aggregated);
    coverageForTest.forEach(coverage => coverageMap.merge(coverage));
    return aggregated;
}
