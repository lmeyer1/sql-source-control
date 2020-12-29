"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs-extra");
var path = require("path");
var ts_util_is_1 = require("ts-util-is");
var xml2js = require("xml2js");
var connection_1 = require("./connection");
/**
 * Configuration options.
 */
var Config = /** @class */ (function () {
    function Config(file) {
        /**
         * Relative path to a `Web.config`, a file with an array of connections, or an array of connections
         */
        this.connections = [];
        /**
         * Glob of files to include/exclude during the `pull` command.
         */
        this.files = [];
        /**
         * List of table names to include for data scripting during the `pull` command.
         */
        this.data = [];
        /**
         * Defines paths where files will be scripted during the `pull` command.
         */
        this.output = {
            data: './data',
            functions: './functions',
            jobs: './jobs',
            procs: './stored-procedures',
            root: './_sql-database',
            schemas: './schemas',
            tables: './tables',
            triggers: './triggers',
            types: './types',
            views: './views',
        };
        /**
         * Defines what type of idempotency will scripted during the `pull` command.
         */
        this.idempotency = {
            data: 'truncate',
            functions: 'if-exists-drop',
            jobs: 'if-exists-drop',
            procs: 'if-exists-drop',
            tables: 'if-not-exists',
            triggers: 'if-exists-drop',
            types: 'if-not-exists',
            views: 'if-exists-drop',
        };
        /**
         * Indicates if constraint names should be scripted.
         */
        this.includeConstraintName = false;
        /**
         * Line ending character.
         */
        this.eol = 'auto';
        this.load(file);
    }
    /**
     * Write a config file with provided configuration.
     *
     * @param config Configuration object to write.
     * @param file Configuration file to write to.
     */
    Config.write = function (config, file) {
        var configFile = path.join(process.cwd(), file || Config.defaultConfigFile);
        var content = JSON.stringify(config, null, 2);
        fs.outputFile(configFile, content, function (error) {
            if (error) {
                return console.error(error);
            }
            console.log('Config file created!');
        });
    };
    /**
     * Check if default configuration file exists.
     */
    Config.doesDefaultExist = function () {
        return fs.existsSync(Config.defaultConfigFile);
    };
    /**
     * Safely get connections from a Web.config file.
     *
     * @param file Relative path to Web.config file.
     */
    Config.getConnectionsFromWebConfig = function (file) {
        var configFile = path.join(process.cwd(), file || Config.defaultWebConfigFile);
        var parser = new xml2js.Parser();
        var conns = [];
        if (!fs.existsSync(configFile)) {
            // not found, use defaults
            return;
        }
        var content = fs.readFileSync(configFile, 'utf-8');
        parser.parseString(content, function (err, result) {
            if (err) {
                console.error(err);
                process.exit();
            }
            try {
                var connectionStrings = result.configuration.connectionStrings[0].add;
                connectionStrings.forEach(function (item) {
                    var conn = new connection_1.default();
                    conn.loadFromString(item.$.name, item.$.connectionString);
                    conns.push(conn);
                });
            }
            catch (err) {
                console.error('Could not parse connection strings from Web.config file!');
                process.exit();
            }
        });
        return conns.length ? conns : undefined;
    };
    /**
     * Get root output directory.
     */
    Config.prototype.getRoot = function () {
        var root = this.output.root;
        if (!root || root === '.') {
            root = './';
        }
        return root;
    };
    /**
     * Get a connection by name, or the first available if `name` is not provided.
     *
     * @param name Optional connection `name` to get.
     */
    Config.prototype.getConnection = function (name) {
        var conns = this.getConnections();
        var conn;
        var error;
        if (name) {
            conn = conns.find(function (item) { return item.name.toLocaleLowerCase() === name.toLowerCase(); });
            error = "Could not find connection by name '" + name + "'!";
        }
        else {
            conn = conns[0];
            error = 'Could not find default connection!';
        }
        if (!conn) {
            console.error(error);
            process.exit();
        }
        return Object.assign(conn, {
            options: {
                // https://github.com/tediousjs/tedious/releases/tag/v7.0.0
                enableArithAbort: true,
            },
        });
    };
    /**
     * Safely get all connections.
     */
    Config.prototype.getConnections = function () {
        if (!ts_util_is_1.isString(this.connections)) {
            return this.connections;
        }
        var configFile = /\.config$/;
        if (configFile.test(this.connections)) {
            return Config.getConnectionsFromWebConfig(this.connections);
        }
        else {
            return this.getConnectionsFromJson(this.connections);
        }
    };
    /**
     * Load configuration options from file.
     *
     * @param file Configuration file to load.
     */
    Config.prototype.load = function (file) {
        var configFile = path.join(process.cwd(), file || Config.defaultConfigFile);
        try {
            var config = fs.readJsonSync(configFile);
            this.connections = config.connections || this.connections;
            this.data = config.data || this.data;
            this.files = config.files || this.files;
            Object.assign(this.output, config.output);
            Object.assign(this.idempotency, config.idempotency);
            this.includeConstraintName =
                config.includeConstraintName || this.includeConstraintName;
            this.eol = config.eol || this.eol;
        }
        catch (error) {
            console.error('Could not find or parse config file. You can use the `init` command to create one!');
            process.exit();
        }
    };
    /**
     * Safely get connections from a JSON file.
     *
     * @param file Relative path to connections JSON file.
     */
    Config.prototype.getConnectionsFromJson = function (file) {
        var jsonFile = path.join(process.cwd(), file);
        try {
            var config = fs.readJsonSync(jsonFile);
            return config.connections;
        }
        catch (error) {
            console.error('Could not find or parse connections config file!');
            process.exit();
        }
    };
    /**
     * Default connections JSON file.
     */
    Config.defaultConnectionsJsonFile = 'ssc-connections.json';
    /**
     * Default Web.config file.
     */
    Config.defaultWebConfigFile = 'Web.config';
    /**
     * Default configuration file.
     */
    Config.defaultConfigFile = 'ssc.json';
    return Config;
}());
exports.default = Config;
//# sourceMappingURL=config.js.map