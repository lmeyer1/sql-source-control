"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Connection configuration.
 */
var Connection = /** @class */ (function () {
    function Connection(conn) {
        this.loadFromObject(conn);
    }
    /**
     * Parse connection string into object.
     *
     * @param name Connection name.
     * @param connString Connection string to parse.
     */
    Connection.prototype.loadFromString = function (name, connString) {
        var parts = connString.split(';');
        // match connection parts
        var server = parts.find(function (x) { return /^(server)/gi.test(x); });
        var database = parts.find(function (x) { return /^(database)/gi.test(x); });
        var user = parts.find(function (x) { return /^(uid)/gi.test(x); });
        var password = parts.find(function (x) { return /^(password|pwd)/gi.test(x); });
        var port;
        // get values
        server = server && server.split('=')[1];
        database = database && database.split('=')[1];
        user = user && user.split('=')[1];
        password = password && password.split('=')[1];
        // separate server and port
        if (server) {
            // format: `dev.example.com\instance,1435`
            var sub = server.split(',');
            server = sub[0];
            port = parseInt(sub[1], 10) || undefined;
        }
        Object.assign(this, {
            database: database,
            name: name,
            password: password,
            port: port,
            server: server,
            user: user,
        });
    };
    /**
     * Load connection object.
     *
     * @param conn Connection object to load.
     */
    Connection.prototype.loadFromObject = function (conn) {
        if (!conn) {
            return;
        }
        Object.assign(this, conn);
    };
    return Connection;
}());
exports.default = Connection;
//# sourceMappingURL=connection.js.map