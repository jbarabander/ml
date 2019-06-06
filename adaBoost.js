const cart = require('./cart').withPredictor;

function getErrorRate (predictor, data, weights) {
    return data.reduce((prev, curr, index) => {
        let weightedError = 0;
        if (curr.classification !== predictor(curr)) {
            weightedError = weights[index];
        }
        return prev + weightedError;
    }, 0);
}

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
    for (let i = 0; i < count; i++) {
        let chosenPredictor;
        let minError;
        for (let j = 0; j < data[0].features.length; j++) {
            let predictor = cart(data, 1, () => [j], 1, entry => entry);
            let predictorFunc = predictor.classify.bind(predictor);
            let error = getErrorRate(predictorFunc, data, dataWeights);
            if (!minError || error < minError) {
                minError = error;
                chosenPredictor = predictorFunc;
            }
        }
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
        return predictors.reduce((prev, curr) => prev + curr.weight * curr.predictor(entry), 0);
    }
}

module.exports = adaBoost;
module.exports.withPredictor = adaBoostPredictor;