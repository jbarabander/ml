const giniImpurity = require('./giniImpurity');
const { mode, fillArr } = require('./utils');
const decisionTree = require('./decisionTree');
const withPredictor = require('./Predictor').withPredictor;

const getSplitError = (data, split) => {
    let firstClassifiersOnly = split.data[0].map(entry => entry.classification);
    let secondClassifiersOnly = split.data[1].map(entry => entry.classification);

    let firstSplitImpurity = (split.data[0].length / data.length) * giniImpurity(firstClassifiersOnly);
    let secondSplitImpurity = (split.data[1].length / data.length) * giniImpurity(secondClassifiersOnly);
    return firstSplitImpurity + secondSplitImpurity;
}

const shouldStop = (data) => giniImpurity(data) === 0;

// data looks like: {features: [string], classifier: something else}
function cart(data, minSplitSize, includedFeaturesFunc, maxDepth = Infinity) {
    return decisionTree(data, minSplitSize, includedFeaturesFunc, getSplitError, shouldStop, maxDepth)
}

function cartWithPredictor (data, minSplitSize, includedFeatures, maxDepth, formatter) {
    let treeCreator = (newData) => [cart(newData, minSplitSize, includedFeatures, maxDepth)];
    return withPredictor(treeCreator, data, formatter);
}

module.exports = cart;
module.exports.withPredictor = cartWithPredictor;