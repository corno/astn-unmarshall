"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUnmarshallErrorMessage = void 0;
/* eslint
    "complexity": "off"
*/
const pr = __importStar(require("pareto-runtime"));
function createUnmarshallErrorMessage(error) {
    switch (error[0]) {
        case "missing elements":
            const $ = error[1];
            return `missing elements: ${$.elements.map((k) => `'${k}'`).join(", ")}`;
        case "object is not a dictionary": {
            return "object is not a dictionary: { }";
        }
        case "property key does not have apostrophes": {
            return "property key does not have apostrophes";
        }
        case "entry key does not have quotes": {
            return "entry key does not have quotes";
        }
        case "double key": {
            return "double key";
        }
        case "array is not a list": {
            return "array is not a list: []";
        }
        case "missing option": {
            return "missing option";
        }
        case "unknown option": {
            const $ = error[1];
            return `unknown option, choose from: ${$["known options"].map((k) => `'${k}'`).join(", ")}`;
        }
        case "unknown property": {
            const $ = error[1];
            return `unknown property, choose from: ${$["known properties"].map((k) => `'${k}'`).join(", ")}`;
        }
        case "value should have quotes": {
            return "value should have quotes: \"...\"";
        }
        case "value should not have quotes": {
            return "value should not have quotes";
        }
        case "value should not have apostrophes": {
            return "value should not have apostrophes";
        }
        case "value should have quotes instead of apostrophes": {
            return "value should have quotes instead of apostrophes";
        }
        case "expected a group": {
            return "expected a group";
        }
        case "expected an unquoted string": {
            return "expected an unquoted string";
        }
        case "expected a quoted string": {
            return "expected a quoted string: \"...\"";
        }
        case "expected a tagged union": {
            return "expected a tagged union: | 'option' ...";
        }
        case "expected a list": {
            return "expected a list: []";
        }
        case "expected a dictionary": {
            return "expected a dictionary: {}";
        }
        case "expected a multiline string": {
            return "expected a multiline string: `...`";
        }
        case "object is not a verbose group": {
            return "object is not a verbose group: ()";
        }
        case "array is not a shorthand group": {
            return "array is not a shorthand group: <>";
        }
        case "superfluous element": {
            return "superfluous element";
        }
        case "missing elements": {
            const $ = error[1];
            return `${$.elements.length} missing element(s): ${$.elements.map((e) => `'${e}'`).join(", ")}`;
        }
        case "this is interpreted as an option, expected apostrophes": {
            return "this is interpreted as an option, expected apostrophes";
        }
        case "property has default value, remove": {
            return "property has default value, remove";
        }
        default:
            return pr.au(error[0]);
    }
}
exports.createUnmarshallErrorMessage = createUnmarshallErrorMessage;
