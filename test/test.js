let psfile = require("../index");
psfile(__dirname).write("./a/b/c.js", "console.log(1,2,3)", true);