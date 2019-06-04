const loader = require('./loader');
const randomForest = require('./randomForest').withPredictor;
const cart = require('./cart').withPredictor;
const SPLIT_FACTOR = 300;
const CLASS_INDEX = 6;
const NUM_TREES = 200;

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

let forestPredictor = randomForest(training, CLASS_INDEX, minSplitSize, NUM_TREES);
let cartPredictor = cart(training, CLASS_INDEX, minSplitSize);

console.log('forest:', calculateResults(forestPredictor));
console.log('cart:', calculateResults(cartPredictor));