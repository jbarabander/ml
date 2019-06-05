const cart = require('./cart');
const withPredictor = require('./Predictor').withPredictor;

function randomForest(data, classIndex, minSplitSize, numOfTrees, numOfFeatures) {
    let numFeatures = typeof numOfFeatures === 'number' ? numOfFeatures : Math.sqrt(data[0].length);
    let randomFeaturesFunc = () => {
        let featuresToInclude = [];
        for (let j = 0; j < numFeatures; j++) {
            let toInclude;
            do {
                toInclude = Math.floor(Math.random() * data[0].length);
            } while (toInclude === classIndex)
            featuresToInclude.push(toInclude);
        }
        return featuresToInclude;
    }
    let trees = [];
    for (let i = 0; i < numOfTrees; i++) {
        let dataToChoose = [];
        for (let k = 0; k < data.length; k++) {
            let index = Math.floor(Math.random() * data.length);
            dataToChoose.push(data[index]);
        }
        let tree = cart(dataToChoose, classIndex, minSplitSize, randomFeaturesFunc);
        trees.push(tree);
    }
    return trees;
}

function randomForestWithPredictor(data, classIndex, minSplitSize, numOfTrees, numOfFeatures, formatter = (entry => entry)) {
    let treeCreator = (data) => randomForest(data, classIndex, minSplitSize, numOfTrees, numOfFeatures);
    return withPredictor(treeCreator, formatter, data);
}

module.exports = randomForest;
module.exports.withPredictor = randomForestWithPredictor;