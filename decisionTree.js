
function giniImpurity(data, classIndex) {
    let classes = {};
    for (let i = 0; i < data.length; i++) {
        if (classes[data[i][classIndex]] === undefined) {
            classes[data[i][classIndex]] = 0;
        }
        classes[data[i][classIndex]]++;
    }
    return (
        Object
        .keys(classes)
        .map((key) => classes[key])
        .reduce((prev, curr) => prev - Math.pow(curr / data.length, 2), 1)
    );
} 

function modeFromValueCountHash (valuesHash) {
    let values = Object.keys(valuesHash).map(key => valuesHash[key]);
    return values.reduce((prev, curr) => {
        if (prev.count < curr.count) {
            prev.count = curr.count;
            prev.value = curr.value;
        }
        return prev;
    }, {value: null, count: 0}).value;
}

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

function mode (data, classIndex) {
    let valuesHash = data.reduce((prev, curr) => {
        if (prev[curr[classIndex]] === undefined) {
            prev[curr[classIndex]] = {value: curr[classIndex], count: 0};
        }
        prev[curr[classIndex]].count++;
        return prev;
    }, {});
    return modeFromValueCountHash(valuesHash);
}

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
        numeric: isNumeric
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

function fillArr (num) {
    let arr = [];
    for (let i = 0; i < num - 1; i++) {
        arr.push(i);
    }
    return arr;
}

function cart(data, classIndex, minSplitSize, includedFeatures) {
    let featuresIncluded = includedFeatures ? includedFeatures : fillArr(data[0].length);
    if (data.length === 0) {
        return null;
    }

    if (data.length <= minSplitSize || giniImpurity(data, classIndex) === 0) {
        return {
            prediction: mode(data, classIndex)
        }   
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