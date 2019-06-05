const { modeFromValueCountHash, defaultFormatter } = require('./utils');

class Predictor {
    constructor(trees, transformer) {
        this.trees = trees;
        this.transformer = transformer; // TODO: add transformation
    }
    classify(data) {
        let entry = this.transformer(data);
        let votes = {};
        for (let i = 0; i < this.trees.length; i++) {
            let currentTree = this.trees[i];
            while(currentTree.prediction === undefined) {
                if(currentTree.numeric) {
                    currentTree = entry.features[currentTree.index] < currentTree.split ? currentTree.left : currentTree.right;
                    continue;
                }
                currentTree = entry.features[currentTree.index] === currentTree.split ? currentTree.left : currentTree.right;
            }
            if (votes[currentTree.prediction] === undefined) {
                votes[currentTree.prediction] = {value: currentTree.prediction, count: 0};
            }
            votes[currentTree.prediction].count++;
        }
        return modeFromValueCountHash(votes);
    }
}

function withPredictor (cb, data, transformer = defaultFormatter) {
    let transformedData = data.map((entry) => transformer(entry));
    let trees = cb(transformedData);
    return new Predictor(trees, transformer);
}

module.exports = Predictor;
module.exports.withPredictor = withPredictor;