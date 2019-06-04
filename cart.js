const giniImpurity = require('./giniImpurity');
const { mode, fillArr } = require('./utils');
const Predictor = require('./Predictor');

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
        let firstSplitImpurity = (splits[0].length / data.length) * giniImpurity(splits[0], classIndex);
        let secondSplitImpurity = (splits[1].length / data.length) * giniImpurity(splits[1], classIndex);
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
    return { prediction: mode(data, classIndex) };
}

function cart(data, classIndex, minSplitSize, includedFeatures) {
    let featuresIncluded = includedFeatures ? includedFeatures : fillArr(data[0].length);
    
    if (data.length === 0) return null;

    if (data.length < minSplitSize || giniImpurity(data, classIndex) === 0) {
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
        left: cart(minResults.data[0], classIndex, minSplitSize, includedFeatures),
        right: cart(minResults.data[1], classIndex, minSplitSize, includedFeatures),
    }
}

function cartWithPredictor (data, classIndex, minSplitSize, includedFeatures) {
    let tree = cart(data, classIndex, minSplitSize, includedFeatures);
    return new Predictor([tree]);
}

module.exports = cart;
module.exports.withPredictor = cartWithPredictor;