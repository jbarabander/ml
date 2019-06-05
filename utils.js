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

function mode (data) {
    let valuesHash = data.reduce((prev, curr) => {
        if (prev[curr] === undefined) {
            prev[curr] = {value: curr, count: 0};
        }
        prev[curr].count++;
        return prev;
    }, {});
    return modeFromValueCountHash(valuesHash);
}

function fillArr (num) {
    let arr = [];
    for (let i = 0; i < num - 1; i++) {
        arr.push(i);
    }
    return arr;
}

module.exports = {
    mode,
    modeFromValueCountHash,
    fillArr
};