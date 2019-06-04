const path = require('path');
const fs = require('fs');

function loader(fileName, trainingRatio) {
    if (trainingRatio >= 1) throw new Error('training ratio is greater than or equal to 1');
    let dataPath = path.join(__dirname, './data', fileName);
    let data = fs.readFileSync(dataPath, {encoding: 'utf8'});
    let rows = data.split('\n').map(row => row.split(','));
    let trainingSetRows = {};
    let trainingData = [];
    let len = rows.length;
    let numberOfTrainingRows = trainingRatio * len;
    for (let i = 0; i < numberOfTrainingRows; i++) {
        let pick;
        do {
            pick = Math.floor(Math.random() * len);
        } while (trainingSetRows[pick]);
        trainingSetRows[pick] = true;
        trainingData.push(rows[pick]);
    }
    let testData = rows.filter((row, index) => !trainingSetRows[index]);
    return [trainingData, testData];
}

console.log(loader('car.data', 2/3));