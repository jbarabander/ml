const loader = require('./loader');
const randomForest = require('./randomForest').withPredictor;
const cart = require('./cart').withPredictor;
const adaBoost = require('./adaBoost').withPredictor;
const defaultFormatter = require('./utils').defaultFormatter;
const SPLIT_FACTOR = 300;
const CLASS_INDEX = 6;
const NUM_TREES = 200;
const NUM_OF_STUMPS = 100;

const {training, test} = loader('car.data', 2/3);

const minSplitSize = Math.ceil((training.length + test.length) / SPLIT_FACTOR);

function calculateResults(predictor) {
    let results = test.reduce((prev, curr) => {
        prev.total++;
        let classification = predictor.classify(curr);
        if (classification === curr[CLASS_INDEX]) {
            prev.correct++;
        }
        return prev;
    }, {correct: 0, total: 0});
    return results.correct / results.total;
}

function calculateAdaBoostResults(predictor, formatter) {
    let results = test.reduce((prev, curr) => {
        prev.total++;
        let formatted = formatter(curr);
        let prediction = predictor(formatted);

        if (prediction === formatted.classification) {
            prev.correct++;
        }
        return prev;
    }, {correct: 0, total: 0});
    return results.correct / results.total;
}

const adaBoostFormatter = (data) => {
    let formatted = defaultFormatter(data);
    let classification = 1;
    if (formatted.classification === 'unacc') {
      classification = -1;
    }
    return { ...formatted, classification };
}

let forestPredictor = randomForest(training, minSplitSize, NUM_TREES);
let cartPredictor = cart(training, minSplitSize);
let adaBoostPredictor = adaBoost(training, NUM_OF_STUMPS, adaBoostFormatter);

console.log('forest:', calculateResults(forestPredictor));
console.log('cart:', calculateResults(cartPredictor));
console.log('adaBoost', calculateAdaBoostResults(adaBoostPredictor, adaBoostFormatter));