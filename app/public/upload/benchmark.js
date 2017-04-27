var layer = [

];

var level = [

];

var avgLevel = level.reduce(function(a, b){return a + b;}) / level.length;
var avgLayer = layer.reduce(function(a, b){return a + b;}) / layer.length;

console.log('Level: ' + avgLevel);
console.log('Layer: ' + avgLayer);

/*
 Level: 0.32193069306930344
 Layer: 1.3030693069306156

 Level: 0.19004950495043588
 Layer: 0.4248762376237457
*/
