const giniImpurity = require('./giniImpurity');
const { mode, fillArr } = require('./utils');
const withPredictor = require('./Predictor').withPredictor;

function getOptions(data, index) {
    let hash = {};
    let values = data.reduce((prev, curr) => {
        prev[curr[index]] = curr[index];
        return prev;
    }, {});
    return Object.keys(values).map((key) => values[key]);
}

function findSplit(choices, data, index, classIndex, isNumeric) {
    let splitter = isNumeric ? ((test, upper) => test < upper) : ((test, upper) => test === upper);
    let minGiniImpurity;
    let optimizedSplitPoint;
    let optimizedSplit;
    for (let i = 0; i < choices.length; i++) {
        let splits = data.reduce((prev, curr) => {
            if (splitter(curr[index], choices[i])) {
                prev[0].push(curr);
            } else {
                prev[1].push(curr);
            }
            return prev;
        }, [[], []]);
        let firstClassifiersOnly = splits[0].map(entry => entry[classIndex]);
        let secondClassifiersOnly = splits[1].map(entry => entry[classIndex]);

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

function findNumericSplit(data, index, classIndex) {
    let keys = getOptions(data, index);
    keys.sort();
    let midpoints = [];
    for (let i = 1; i < keys.length; i++) {
        midpoints.push((keys[i] + keys[i - 1]) / 2);
    }
    return findSplit(midpoints, data, index, classIndex, true);
}

function findCategoricalSplit(data, index, classIndex) {
    let keys = getOptions(data, index);
    return findSplit(keys, data, index, classIndex, false);
}

function split(data, index, classIndex) {
    let isNumeric = typeof data[0][index] === 'number';
    if (isNumeric) {
        return findNumericSplit(data, index, classIndex);
    }
    return findCategoricalSplit(data, index, classIndex);
}

function createPredictionNode(data, classIndex) {
    let classifications = data.map((entry) => entry[classIndex]);
    return { prediction: mode(classifications) };
}

// data looks like: {features: [string], classifier: something else}
function cart(data, classIndex, minSplitSize, includedFeaturesFunc, maxDepth = Infinity, currentDepth = 0) {
    let featuresIncluded = includedFeaturesFunc ? includedFeaturesFunc() : fillArr(data[0].length);
    
    if (data.length === 0) return null;
    let classificationsOnly = data.map((entry) => entry[classIndex]);
    if (data.length < minSplitSize || giniImpurity(classificationsOnly) === 0 || currentDepth >= maxDepth) {
        return createPredictionNode(data, classIndex);
    }

    let minIndex;
    let minResults;
    for (let i = 0; i < data[0].length; i++) {
        if (i === classIndex || !featuresIncluded.includes(i)) continue;
        let results = split(data, i, classIndex);
        if (minResults === undefined || results.impurity < minResults.impurity) {
            minIndex = i;
            minResults = results;
        }
    }

    if (minResults.choicesLen === 1) {
        return createPredictionNode(data, classIndex);
    }
    
    return {
        impurity: minResults.impurity,
        index: minIndex,
        numeric: minResults.numeric,
        split: minResults.split,
        left: cart(minResults.data[0], classIndex, minSplitSize, includedFeaturesFunc, maxDepth, currentDepth++),
        right: cart(minResults.data[1], classIndex, minSplitSize, includedFeaturesFunc, maxDepth, currentDepth++),
    }
}

function cartWithPredictor (data, classIndex, minSplitSize, includedFeatures, maxDepth, formatter = (entry => entry)) {
    let treeCreator = (data) => [cart(data, classIndex, minSplitSize, includedFeatures, maxDepth)];
    return withPredictor(treeCreator, formatter, data);
}

module.exports = cart;
module.exports.withPredictor = cartWithPredictor;