const giniImpurity = require('./giniImpurity');
const { mode, fillArr } = require('./utils');
const withPredictor = require('./Predictor').withPredictor;

function getOptions(data, index) {
    let hash = {};
    let values = data.reduce((prev, curr) => {
        let feature = curr.features[index];
        prev[feature] = feature;
        return prev;
    }, {});
    return Object.keys(values).map((key) => values[key]);
}

function findSplit(choices, data, index, isNumeric) {
    let splitter = isNumeric ? ((test, upper) => test < upper) : ((test, upper) => test === upper);
    let minGiniImpurity;
    let optimizedSplitPoint;
    let optimizedSplit;
    for (let i = 0; i < choices.length; i++) {
        let splits = data.reduce((prev, curr) => {
            if (splitter(curr.features[index], choices[i])) {
                prev[0].push(curr);
            } else {
                prev[1].push(curr);
            }
            return prev;
        }, [[], []]);
        let firstClassifiersOnly = splits[0].map(entry => entry.classification);
        let secondClassifiersOnly = splits[1].map(entry => entry.classification);

        let firstSplitImpurity = (splits[0].length / data.length) * giniImpurity(firstClassifiersOnly);
        let secondSplitImpurity = (splits[1].length / data.length) * giniImpurity(secondClassifiersOnly);
        let currGini = firstSplitImpurity + secondSplitImpurity;
        if (optimizedSplitPoint === undefined || currGini < minGiniImpurity) {
            minGiniImpurity = currGini;
            optimizedSplitPoint = choices[i];
            optimizedSplit = splits;
        }
    }
    return {
        split: optimizedSplitPoint,
        data: optimizedSplit,
        impurity: minGiniImpurity,
        numeric: isNumeric,
        choicesLen: choices.length
    }
}

function findNumericSplit(data, index) {
    let keys = getOptions(data, index);
    keys.sort();
    let midpoints = [];
    for (let i = 1; i < keys.length; i++) {
        midpoints.push((keys[i] + keys[i - 1]) / 2);
    }
    return findSplit(midpoints, data, index, true);
}

function findCategoricalSplit(data, index) {
    let keys = getOptions(data, index);
    return findSplit(keys, data, index, false);
}

function split(data, index) {
    let isNumeric = typeof data[0][index] === 'number';
    if (isNumeric) {
        return findNumericSplit(data, index);
    }
    return findCategoricalSplit(data, index);
}

function createPredictionNode(data) {
    return { prediction: mode(data) };
}

// data looks like: {features: [string], classifier: something else}
function cart(data, minSplitSize, includedFeaturesFunc, maxDepth = Infinity, currentDepth = 0) {
    let featuresIncluded = includedFeaturesFunc ? includedFeaturesFunc() : fillArr(data[0].features.length);
    if (data.length === 0) return null;
    let classificationsOnly = data.map((entry) => entry.classification);
    if (data.length < minSplitSize || giniImpurity(classificationsOnly) === 0 || currentDepth >= maxDepth) {
        return createPredictionNode(classificationsOnly);
    }

    let minIndex;
    let minResults;
    for (let i = 0; i < data[0].features.length; i++) {
        if (!featuresIncluded.includes(i)) continue;
        let results = split(data, i);
        if (minResults === undefined || results.impurity < minResults.impurity) {
            minIndex = i;
            minResults = results;
        }
    }
    if (minResults.choicesLen === 1) {
        return createPredictionNode(classificationsOnly);
    }
    
    return {
        impurity: minResults.impurity,
        index: minIndex,
        numeric: minResults.numeric,
        split: minResults.split,
        left: cart(minResults.data[0], minSplitSize, includedFeaturesFunc, maxDepth, currentDepth++),
        right: cart(minResults.data[1], minSplitSize, includedFeaturesFunc, maxDepth, currentDepth++),
    }
}

function cartWithPredictor (data, minSplitSize, includedFeatures, maxDepth, formatter) {
    let treeCreator = (newData) => [cart(newData, minSplitSize, includedFeatures, maxDepth)];
    return withPredictor(treeCreator, data, formatter);
}

module.exports = cart;
module.exports.withPredictor = cartWithPredictor;