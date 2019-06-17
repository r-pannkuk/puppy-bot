var object = {
    id: 1
}

var reference1 = {
    reference: object
}

var reference2 = {
    reference: object
}

console.log(object);
console.log(reference1);
console.log(reference2);

reference2.reference.id = 2;

console.log(object);
console.log(reference1);
console.log(reference2);