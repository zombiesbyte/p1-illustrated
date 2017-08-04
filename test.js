var Jimp = require("jimp");
var platterW = 1000;
var platterH = 500;

var imageTracker = "";

var addPart = function(parts){
    Jimp.read('images\\assets\\' + parts.asset + '.png', function( err, el) {
        if (err) throw err;
        parts.image.composite( el, parts.xPos, parts.yPos );
        parts.image.write("set\\" + parts.saveAs) 
        console.log("Creating image file");
    });
};

for(var n = 0; n < 5; n++){
    console.log("Creating image Obj");
    var imgObj = new Jimp( platterW, platterH );
    addPart({
            'image':    imgObj,
            'saveAs':   n +'.png',
            'asset':    '_beta',
            'xPos':     920,
            'yPos':     436
    });
}
