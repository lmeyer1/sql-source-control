"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var connection_1 = require("./connection");
describe('Connection class', function () {
    var name = 'dev';
    var server = 'localhost';
    var port = 1433;
    var database = 'awesome-db';
    var user = 'example';
    var password = 'qwerty';
    describe('loadFromString method', function () {
        it('should hydrate from string (format #1)', function () {
            var str = "server=" + server + ";database=" + database + ";uid=" + user + ";password=" + password + ";";
            var conn = new connection_1.default();
            conn.loadFromString(name, str);
            expect(conn.name).toEqual(name);
            expect(conn.server).toEqual(server);
            expect(conn.port).toBeUndefined();
            expect(conn.database).toEqual(database);
            expect(conn.user).toEqual(user);
            expect(conn.password).toEqual(password);
        });
        it('should hydrate from string (format #2)', function () {
            var str = "server=" + server + ";database=" + database + ";uid=" + user + ";pwd=" + password + ";";
            var conn = new connection_1.default();
            conn.loadFromString(name, str);
            expect(conn.name).toEqual(name);
            expect(conn.server).toEqual(server);
            expect(conn.port).toEqual(undefined);
            expect(conn.database).toEqual(database);
            expect(conn.user).toEqual(user);
            expect(conn.password).toEqual(password);
        });
        it('should hydrate from string with port', function () {
            var str = "server=" + server + "," + port + ";database=" + database + ";uid=" + user + ";password=" + password + ";";
            var conn = new connection_1.default();
            conn.loadFromString(name, str);
            expect(conn.name).toEqual(name);
            expect(conn.server).toEqual(server);
            expect(conn.port).toEqual(port);
            expect(conn.database).toEqual(database);
            expect(conn.user).toEqual(user);
            expect(conn.password).toEqual(password);
        });
    });
    describe('loadFromObject method', function () {
        it('should hydrate from object', function () {
            var conn = new connection_1.default();
            conn.loadFromObject({
                database: database,
                name: name,
                password: password,
                port: port,
                server: server,
                user: user,
            });
            expect(conn.name).toEqual(name);
            expect(conn.server).toEqual(server);
            expect(conn.port).toEqual(port);
            expect(conn.database).toEqual(database);
            expect(conn.user).toEqual(user);
            expect(conn.password).toEqual(password);
        });
    });
});
//# sourceMappingURL=connection.spec.js.map