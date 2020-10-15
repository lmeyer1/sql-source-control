"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Table = require('cli-table');
var config_1 = require("../common/config");
var List = /** @class */ (function () {
    function List(options) {
        this.options = options;
    }
    /**
     * Invoke action.
     */
    List.prototype.invoke = function () {
        var config = new config_1.default(this.options.config);
        var connections = config.getConnections();
        var placeholder = 'n/a';
        var table = new Table({
            head: ['Name', 'Server', 'Port', 'Database', 'User', 'Password'],
        });
        connections.forEach(function (conn) {
            table.push([
                conn.name || placeholder,
                conn.server || placeholder,
                conn.port || placeholder,
                conn.database || placeholder,
                conn.user || placeholder,
                conn.password || placeholder,
            ]);
        });
        console.log(table.toString());
    };
    return List;
}());
exports.default = List;
//# sourceMappingURL=list.js.map