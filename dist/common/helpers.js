"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Helpers = void 0;
/**
 * Common helper functions.
 */
var Helpers = /** @class */ (function () {
    function Helpers() {
    }
    /**
     * Group a collection of objects by a specific key.
     *
     * @param items Collection of items to group.
     * @param key Property name to group by.
     */
    Helpers.groupByName = function (items, key) {
        return items.reduce(function (prev, cur) {
            var prop = cur[key];
            var group = (prev[prop] = prev[prop] || []);
            group.push(cur);
            return prev;
        }, {});
    };
    return Helpers;
}());
exports.Helpers = Helpers;
//# sourceMappingURL=helpers.js.map