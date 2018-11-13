const fs = require("fs");
const file = fs.readFileSync("./src/nativeDialogGetContents.js").toString();
const replace = 'if(typeof module !== "undefined") module.exports.default =';
fs.writeFileSync("./src/nativeDialogGetContents.esm.js", file.replace(replace, 'export default'))