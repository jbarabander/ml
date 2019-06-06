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

function findSplits(choices, data, index, isNumeric) {
    let splitter = isNumeric ? ((test, upper) => test < upper) : ((test, upper) => test === upper);
    return choices.map(choice => {
        let splits = data.reduce((prev, curr) => {
            if (splitter(curr.features[index], choices[i])) {
                prev[0].push(curr);
            } else {
                prev[1].push(curr);
            }
            return prev;
        }, [[], []]);
        return {
            index,
            split: choice,
            data: splits,
            numeric: isNumeric,
            choicesLen: choices.length
        }
    });
}

let getNumericOptions(data, index) {
    let keys = getOptions(data, index);
    keys.sort();
    let midpoints = [];
    for (let i = 1; i < keys.length; i++) {
        midpoints.push((keys[i] + keys[i - 1]) / 2);
    }
    return midpoints;
}

function findNumericSplits(data, index) {
    let midpoints = getNumericOptions(data, index);
    return findSplits(midpoints, data, index, true);
}

function findCategoricalSplits(data, index) {
    let keys = getOptions(data, index);
    return findSplits(keys, data, index, false);
}

function split(data, index) {
    let isNumeric = typeof data[0][index] === 'number';
    if (isNumeric) {
        return findNumericSplits(data, index);
    }
    return findCategoricalSplits(data, index);
}

function createPredictionNode(data) {
    return { prediction: mode(data) };
}

function findPossibleSplits (data, includedFeatures) {
    return includedFeatures.reduce((prev, curr) => {
        let splitsForFeature = split(data, curr);
        return prev.concat(splitsForFeature);
    }, []);
}

function findBestSplit (splits, data, errorFunc) {
    return splits.reduce((prev, curr) => {
        let currentError = errorFunc(data, curr);
        if (!prev.minSplit || currentError < prev.minError) {
            prev.minSplit = curr;
            prev.minError = currentError;
        }
        return prev;
    }, {minSplit: null, minError: null})
}


// data looks like: {features: [string], classifier: something else}
function decisionTree(data, minSplitSize, includedFeaturesFunc, errorFunc, shouldStop = () => false, maxDepth = Infinity, currentDepth = 0) {
    let featuresIncluded = includedFeaturesFunc ? includedFeaturesFunc() : fillArr(data[0].features.length);
    if (data.length === 0) return null;
    let classificationsOnly = data.map((entry) => entry.classification);
    if (data.length < minSplitSize || shouldStop(classificationsOnly) || currentDepth >= maxDepth) {
        return createPredictionNode(classificationsOnly);
    }
    let splits = findPossibleSplits(data, featuresIncluded);
    let { minSplit, minError } = findBestSplit(splits, data, errorFunc);

    if (minSplit.choicesLen === 1) {
        return createPredictionNode(classificationsOnly);
    }
    
    return {
        error: minError,
        index: minSplit.index,
        numeric: minSplit.numeric,
        split: minSplit.split,
        left: decisionTree(minSplit.data[0], minSplitSize, includedFeaturesFunc, errorFunc, shouldStop, maxDepth, currentDepth++),
        right: cart(minSplit.data[1], minSplitSize, includedFeaturesFunc, errorFunc, shouldStop, maxDepth, currentDepth++),
    }
}

module.exports = decisionTree;