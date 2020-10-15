"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mock = require("mock-fs");
var config_1 = require("./config");
describe('Config class', function () {
    var name = 'dev';
    var server = 'localhost';
    var port = 1433;
    var database = 'awesome-db';
    var user = 'example';
    var password = 'qwerty';
    var connection = {
        database: database,
        name: name,
        password: password,
        port: port,
        server: server,
        user: user,
    };
    var files = ['dbo.*'];
    var data = ['dbo.LookupTable'];
    var output = { root: './my-database' };
    var idempotency = { triggers: false };
    beforeEach(function () {
        mock.restore();
    });
    describe('getRoot method', function () {
        it('should return default root path', function () {
            var _a;
            var file = config_1.default.defaultConfigFile;
            mock((_a = {},
                _a[file] = JSON.stringify({
                    connections: [connection],
                }),
                _a));
            var config = new config_1.default();
            var root = config.getRoot();
            expect(root).toEqual('./_sql-database');
        });
        it('should return override root path', function () {
            var _a;
            var file = 'override-example.json';
            mock((_a = {},
                _a[file] = JSON.stringify({
                    connections: [connection],
                    output: output,
                }),
                _a));
            var config = new config_1.default(file);
            var root = config.getRoot();
            expect(root).toEqual('./my-database');
        });
        it('should return relative path when no root provided', function () {
            var _a;
            var file = 'override-example.json';
            mock((_a = {},
                _a[file] = JSON.stringify({
                    connections: [connection],
                    output: {
                        root: '',
                    },
                }),
                _a));
            var config = new config_1.default(file);
            var root = config.getRoot();
            expect(root).toEqual('./');
        });
        it('should return relative path when "." provided', function () {
            var _a;
            var file = 'override-example.json';
            mock((_a = {},
                _a[file] = JSON.stringify({
                    output: {
                        root: '.',
                    },
                }),
                _a));
            var config = new config_1.default(file);
            var root = config.getRoot();
            expect(root).toEqual('./');
        });
    });
    describe('write method', function () {
        it('should write to default file', function () {
            // todo (jbl): error thrown with nyc
            // mock();
            // Config.write({
            //   connections: [connection]
            // });
            // const config = new Config();
            // const conn = config.connections[0] as Connection;
            // expect(conn.name).toEqual(name);
            // expect(conn.server).toEqual(server);
            // expect(conn.port).toEqual(port);
            // expect(conn.database).toEqual(database);
            // expect(conn.user).toEqual(user);
            // expect(conn.password).toEqual(password);
        });
    });
    describe('doesDefaultExist method', function () {
        it('should return true if file exists', function () {
            var _a;
            var file = config_1.default.defaultConfigFile;
            mock((_a = {},
                _a[file] = '',
                _a));
            var value = config_1.default.doesDefaultExist();
            expect(value).toEqual(true);
        });
    });
    describe('doesDefaultExist method', function () {
        it('should return false if file not exists', function () {
            mock({});
            var value;
            // https://github.com/tschaub/mock-fs/issues/256
            try {
                value = config_1.default.doesDefaultExist();
            }
            catch (ex) {
                value = false;
            }
            expect(value).toEqual(false);
        });
    });
    describe('getConnectionsFromWebConfig method', function () {
        it('should return connections if default web.config exists', function () {
            var _a;
            var file = config_1.default.defaultWebConfigFile;
            mock((_a = {},
                _a[file] = "\n          <?xml version=\"1.0\" encoding=\"utf-8\"?>\n          <configuration>\n            <connectionStrings>\n            <add\n              name=\"" + name + "\"\n              connectionString=\"server=" + server + ";database=" + database + ";uid=" + user + ";password=" + password + ";\" />\n            </connectionStrings>\n          </configuration>\n        ",
                _a));
            var conns = config_1.default.getConnectionsFromWebConfig();
            var conn = conns[0];
            expect(conn.name).toEqual(name);
            expect(conn.server).toEqual(server);
            expect(conn.port).toBeUndefined();
            expect(conn.database).toEqual(database);
            expect(conn.user).toEqual(user);
            expect(conn.password).toEqual(password);
        });
        it('should return undefined if web.config not exists', function () {
            mock();
            var conns;
            // https://github.com/tschaub/mock-fs/issues/256
            try {
                conns = config_1.default.getConnectionsFromWebConfig();
            }
            catch (ex) {
                conns = undefined;
            }
            expect(conns).toBeUndefined();
        });
    });
    describe('constructor', function () {
        it('should load from default file', function () {
            var _a;
            var file = config_1.default.defaultConfigFile;
            mock((_a = {},
                _a[file] = JSON.stringify({
                    connections: [connection],
                    data: data,
                    files: files,
                    idempotency: idempotency,
                    output: output,
                }),
                _a));
            var config = new config_1.default();
            var conn = config.connections[0];
            expect(conn.name).toEqual(name);
            expect(conn.server).toEqual(server);
            expect(conn.port).toEqual(port);
            expect(conn.database).toEqual(database);
            expect(conn.user).toEqual(user);
            expect(conn.password).toEqual(password);
            expect(config.files).toEqual(files);
            expect(config.data).toEqual(data);
            expect(config.output.root).toEqual(output.root);
            expect(config.idempotency.triggers).toEqual(idempotency.triggers);
        });
        it('should load from specified file', function () {
            var _a;
            var file = 'override-example.json';
            mock((_a = {},
                _a[file] = JSON.stringify({
                    connections: [connection],
                    data: data,
                    files: files,
                    idempotency: idempotency,
                    output: output,
                }),
                _a));
            var config = new config_1.default(file);
            var conn = config.connections[0];
            expect(conn.name).toEqual(name);
            expect(conn.server).toEqual(server);
            expect(conn.port).toEqual(port);
            expect(conn.database).toEqual(database);
            expect(conn.user).toEqual(user);
            expect(conn.password).toEqual(password);
            expect(config.files).toEqual(files);
            expect(config.data).toEqual(data);
            expect(config.output.root).toEqual(output.root);
            expect(config.idempotency.triggers).toEqual(idempotency.triggers);
        });
    });
    describe('getConnection method', function () {
        it('should return first connection', function () {
            var _a;
            var file = config_1.default.defaultConfigFile;
            mock((_a = {},
                _a[file] = JSON.stringify({
                    connections: [connection],
                }),
                _a));
            var config = new config_1.default();
            var conn = config.getConnection();
            expect(conn.name).toEqual(name);
            expect(conn.server).toEqual(server);
            expect(conn.port).toEqual(port);
            expect(conn.database).toEqual(database);
            expect(conn.user).toEqual(user);
            expect(conn.password).toEqual(password);
        });
        it('should return connection by name', function () {
            var _a;
            var file = config_1.default.defaultConfigFile;
            mock((_a = {},
                _a[file] = JSON.stringify({
                    connections: [connection],
                }),
                _a));
            var config = new config_1.default();
            var conn = config.getConnection(name);
            expect(conn.name).toEqual(name);
            expect(conn.server).toEqual(server);
            expect(conn.port).toEqual(port);
            expect(conn.database).toEqual(database);
            expect(conn.user).toEqual(user);
            expect(conn.password).toEqual(password);
        });
    });
    describe('getConnections method', function () {
        it('should return all conneections', function () {
            var _a;
            var file = config_1.default.defaultConfigFile;
            mock((_a = {},
                _a[file] = JSON.stringify({
                    connections: [connection],
                }),
                _a));
            var config = new config_1.default();
            var conns = config.getConnections();
            expect(conns.length).toEqual(1);
        });
    });
});
//# sourceMappingURL=config.spec.js.map