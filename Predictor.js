const { modeFromValueCountHash } = require('./utils');

class Predictor {
    constructor(trees) {
        this.trees = trees;
    }
    classify(entry) {
        let votes = {};
        for (let i = 0; i < this.trees.length; i++) {
            let currentTree = this.trees[i];
            while(currentTree.prediction === undefined) {
                if(currentTree.numeric) {
                    currentTree = entry[currentTree.index] < currentTree.split ? currentTree.left : currentTree.right;
                    continue;
                }
                currentTree = entry[currentTree.index] === currentTree.split ? currentTree.left : currentTree.right;
            }
            if (votes[currentTree.prediction] === undefined) {
                votes[currentTree.prediction] = {value: currentTree.prediction, count: 0};
            }
            votes[currentTree.prediction].count++;
        }
        return modeFromValueCountHash(votes);
    }
}

module.exports = Predictor;