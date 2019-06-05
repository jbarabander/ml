function giniImpurity(data) {
    let classes = {};
    for (let i = 0; i < data.length; i++) {
        if (classes[data[i]] === undefined) {
            classes[data[i]] = 0;
        }
        classes[data[i]]++;
    }
    return (
        Object
        .keys(classes)
        .map((key) => classes[key])
        .reduce((prev, curr) => prev - Math.pow(curr / data.length, 2), 1)
    );
}

module.exports = giniImpurity;