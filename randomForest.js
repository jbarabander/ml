const cart = require('./cart');
const withPredictor = require('./Predictor').withPredictor;

function randomForest(data, minSplitSize, numOfTrees, numOfFeatures) {
    let featuresLen = data[0].features.length;
    let numFeatures = typeof numOfFeatures === 'number' ? numOfFeatures : Math.sqrt(featuresLen);
    let randomFeaturesFunc = () => {
        let featuresToInclude = [];
        for (let j = 0; j < numFeatures; j++) {
            let toInclude = Math.floor(Math.random() * featuresLen);
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
        let tree = cart(dataToChoose, minSplitSize, randomFeaturesFunc);
        trees.push(tree);
    }
    return trees;
}

function randomForestWithPredictor(data, minSplitSize, numOfTrees, numOfFeatures, formatter) {
    let treeCreator = (newData) => randomForest(newData, minSplitSize, numOfTrees, numOfFeatures);
    return withPredictor(treeCreator, data, formatter);
}

module.exports = randomForest;
module.exports.withPredictor = randomForestWithPredictor;