const cart = require('./cart');
const Predictor = require('./Predictor');

function randomForest(data, classIndex, minSplitSize, numOfTrees, numOfFeatures) {
    let numFeatures = typeof numOfFeatures === 'number' ? numOfFeatures : Math.sqrt(data[0].length - 1);
    let trees = [];
    for (let i = 0; i < numOfTrees; i++) {
        let featuresToInclude = [];
        let dataToChoose = [];
        for (let j = 0; j < numFeatures; j++) {
            let toInclude;
            do {
                toInclude = Math.floor(Math.random() * data[0].length);
            } while (toInclude === classIndex)
            featuresToInclude.push(toInclude);
        }
        for (let k = 0; k < data.length; k++) {
            let index = Math.floor(Math.random() * data.length);
            dataToChoose.push(data[index]);
        }
        let tree = cart(dataToChoose, classIndex, minSplitSize, featuresToInclude);
        trees.push(tree);
    }
    return trees;
}

function randomForestWithPredictor(data, classIndex, minSplitSize, numOfTrees, numOfFeatures) {
    let trees = randomForest(data, classIndex, minSplitSize, numOfTrees, numOfFeatures);
    return new Predictor(trees);
}

module.exports = randomForest;
module.exports.withPredictor = randomForestWithPredictor;