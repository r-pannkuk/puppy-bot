var condition = (b) => b;

var inverse = (b) => !condition(b);

var array = [true, false, true, false, true, false];

var filterTest = array.filter(condition);
var inverseTest = array.filter(inverse);

console.log(filterTest);