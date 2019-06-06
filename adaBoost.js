const { mode, sign } = require('./utils');
const decisionTree = require('./decisionTree');
const Predictor = require('./Predictor');

function predict(entry, currentTree, valueIfLeft, valueIfRight) {
    let isLeft = currentTree.numeric ? (feature, bound) => feature < bound : (feature, bound) => feature === bound; 
    return isLeft(entry.features[currentTree.index], currentTree.split) ?  valueIfLeft : valueIfRight;
}

function getErrorRate (data, split, weights) {
    let valueIfLeft = mode(split.data[0].map(entry => entry.classification));
    let valueIfRight = mode(split.data[1].map(entry => entry.classification));
    return data.reduce((prev, curr, index) => {
        let weightedError = 0;
        if (curr.classification !== predict(curr, split, valueIfLeft, valueIfRight)) {
            weightedError = weights[index];
        }
        return prev + weightedError;
    }, 0);
}

const shouldStop = () => false;

function getDataWeight(dataPoint, dataWeight, hypothesisWeight, predictor) {
    let exponent = -hypothesisWeight * dataPoint.classification * predictor(dataPoint);
    return dataWeight * Math.pow(Math.E, exponent);
}

function reweigh(data, weights, hypothesisWeight, predictor) {
    let basicWeights = data.map((point, index) => (
        getDataWeight(point, weights[index], hypothesisWeight, predictor)
    ));
    let totalWeight = basicWeights.reduce((prev, curr) => prev + curr, 0);
    return basicWeights.map((weight) => weight / totalWeight);
}

function adaBoost(data, count) {
    let dataWeights = data.map(() => 1 / data.length);
    let trees = [];
    let errorRate = (data, split) => getErrorRate(data, split, dataWeights);
    for (let i = 0; i < count; i++) {
        let stump = decisionTree(data, 1, null, errorRate, shouldStop, 1);
        let predictor = new Predictor([stump], entry => entry);
        console.log(stump);
        let chosenPredictor = predictor.classify.bind(predictor);
        let minError = stump.error;
        let weight = (1 / 2) * Math.log((1 - minError) / minError);
        trees.push({predictor: chosenPredictor, weight});
        dataWeights = reweigh(data, dataWeights, weight, chosenPredictor);
    }
    return trees;
}

function validateDataStructure(entry) {
    if (entry === null || typeof entry !== 'object' || !entry.classification || !Array.isArray(entry.features)) {
        throw new TypeError('data must be in format {features, classification}');
    }
}

function validateClassificationValues(entry) {
    if (entry.classification !== -1 && entry.classification !== 1) {
        throw new TypeError('classification must be either 1 or -1');
    }
}

function adaBoostPredictor(data, count, formatter) {
    let formatterWithValidation = (entry) => {
        let formattedEntry = formatter(entry, true);
        validateDataStructure(formattedEntry);
        validateClassificationValues(formattedEntry);
        return formattedEntry;
    }
    let newData = data.map(formatterWithValidation);
    let predictors = adaBoost(newData, count);
    return function predictor(entry) {
        let formattedEntry = formatter(data);
        validateDataStructure(formattedEntry);
        return sign(predictors.reduce((prev, curr) => prev + curr.weight * curr.predictor(entry), 0));
    }
}

module.exports = adaBoost;
module.exports.withPredictor = adaBoostPredictor;