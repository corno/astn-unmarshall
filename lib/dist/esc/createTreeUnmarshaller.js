"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTreeUnmarshaller = void 0;
const createValueUnmarshaller_1 = require("./createValueUnmarshaller");
function createTreeUnmarshaller($) {
    return {
        root: {
            exists: (0, createValueUnmarshaller_1.createValueUnmarshaller)($.schema["root type"].get().value, $.handler.root, $.onError, () => { }, null, $.dummyHandlers),
            missing: () => {
                (0, createValueUnmarshaller_1.defaultInitializeValue)($.schema["root type"].get().value, $.handler.root, $.onError);
            },
        },
        onEnd: () => $.handler.onEnd({}),
    };
}
exports.createTreeUnmarshaller = createTreeUnmarshaller;
