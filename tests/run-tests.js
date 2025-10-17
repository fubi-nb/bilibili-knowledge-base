const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

require.extensions[".ts"] = function (module, filename) {
  const source = fs.readFileSync(filename, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      target: "ES2020",
      module: ts.ModuleKind.CommonJS,
      esModuleInterop: true,
      strict: true,
    },
    fileName: filename,
  });
  module._compile(outputText, filename);
};

const testFile = path.join(__dirname, "bilibiliTranscript.test.ts");
require(testFile);
