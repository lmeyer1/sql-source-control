"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var chalk = require("chalk");
var sql = require("mssql");
var multimatch = require("multimatch");
var ora = require("ora");
var config_1 = require("../common/config");
var file_utility_1 = require("../common/file-utility");
var mssql_1 = require("../generators/mssql");
var mssql_2 = require("../queries/mssql");
var Pull = /** @class */ (function () {
    function Pull(name, options) {
        this.name = name;
        this.options = options;
        /**
         * Spinner instance.
         */
        this.spinner = ora();
    }
    /**
     * Invoke action.
     */
    Pull.prototype.invoke = function () {
        var _this = this;
        var config = new config_1.default(this.options.config);
        var conn = config.getConnection(this.name);
        this.spinner.start("Pulling from " + chalk.blue(conn.server) + " ...");
        // connect to db
        new sql.ConnectionPool(conn)
            .connect()
            .then(function (pool) {
            var queries = [
                pool.request().query(mssql_2.objectsRead),
                pool.request().query(mssql_2.tablesRead),
                pool.request().query(mssql_2.columnsRead),
                pool.request().query(mssql_2.primaryKeysRead),
                pool.request().query(mssql_2.foreignKeysRead),
                pool.request().query(mssql_2.indexesRead),
                pool.request().query(mssql_2.typesRead),
            ];
            if (config.output.jobs) {
                queries.push(pool.request().query(mssql_2.jobsRead(conn.database)), pool.request().query(mssql_2.jobStepsRead(conn.database)), pool.request().query(mssql_2.jobSchedulesRead()));
            }
            else {
                queries.push(null, null, null);
            }
            return Promise.all(queries)
                .then(function (results) {
                var tables = results[1].recordset;
                var names = tables.map(function (item) { return item.schema + "." + item.name; });
                var matched = multimatch(names, config.data);
                if (!matched.length) {
                    return results;
                }
                return Promise.all(matched.map(function (item) {
                    var match = tables.find(function (table) { return item === table.schema + "." + table.name; });
                    return pool
                        .request()
                        .query("SELECT * FROM [" + match.schema + "].[" + match.name + "]")
                        .then(function (result) { return ({
                        hasIdentity: match.identity_count > 0,
                        name: match.name,
                        result: result,
                        schema: match.schema,
                    }); });
                })).then(function (data) { return __spreadArrays(results, data); });
            })
                .then(function (results) {
                pool.close();
                return results;
            });
        })
            .then(function (results) { return _this.writeFiles(config, results); })
            .catch(function (error) { return _this.spinner.fail(error); });
    };
    /**
     * Write all files to the file system based on `results`.
     *
     * @param config Current configuration to use.
     * @param results Array of data sets from SQL queries.
     */
    Pull.prototype.writeFiles = function (config, results) {
        // note: array order MUST match query promise array
        var objects = results[0].recordset;
        var tables = results[1].recordset;
        var columns = results[2].recordset;
        var primaryKeys = results[3].recordset;
        var foreignKeys = results[4].recordset;
        var indexes = results[5].recordset;
        var types = results[6].recordset;
        var jobs = results[7] ? results[7].recordset : [];
        var jobSteps = results[8] ? results[8].recordset : [];
        var jobSchedules = results[9]
            ? results[9].recordset
            : [];
        var data = results.slice(10);
        var generator = new mssql_1.default(config);
        var file = new file_utility_1.default(config);
        // schemas
        tables
            .map(function (item) { return item.schema; })
            .filter(function (value, index, array) { return array.indexOf(value) === index; })
            .map(function (value) { return ({ name: value }); })
            .forEach(function (item) {
            var name = item.name + ".sql";
            var content = generator.schema(item);
            file.write(config.output.schemas, name, content);
        });
        // stored procedures
        objects
            .filter(function (item) { return item.type.trim() === 'P'; })
            .forEach(function (item) {
            var name = item.schema + "." + item.name + ".sql";
            var content = generator.storedProcedure(item);
            file.write(config.output.procs, name, content);
        });
        // views
        objects
            .filter(function (item) { return item.type.trim() === 'V'; })
            .forEach(function (item) {
            var name = item.schema + "." + item.name + ".sql";
            var content = generator.view(item);
            file.write(config.output.views, name, content);
        });
        // functions
        objects
            .filter(function (item) { return ['TF', 'IF', 'FN'].indexOf(item.type.trim()) !== -1; })
            .forEach(function (item) {
            var name = item.schema + "." + item.name + ".sql";
            var content = generator.function(item);
            file.write(config.output.functions, name, content);
        });
        // triggers
        objects
            .filter(function (item) { return item.type.trim() === 'TR'; })
            .forEach(function (item) {
            var name = item.schema + "." + item.name + ".sql";
            var content = generator.trigger(item);
            file.write(config.output.triggers, name, content);
        });
        // tables
        tables.forEach(function (item) {
            var name = item.schema + "." + item.name + ".sql";
            var content = generator.table(item, columns, primaryKeys, foreignKeys, indexes);
            file.write(config.output.tables, name, content);
        });
        // types
        types
            .filter(function (item) { return !item.type; })
            .forEach(function (item) {
            var name = item.schema + "." + item.name + ".sql";
            var content = generator.type(item);
            file.write(config.output.types, name, content);
        });
        // table types
        types
            .filter(function (item) { return item.type && item.type.trim() === 'TT'; })
            .forEach(function (item) {
            var name = item.schema + "." + item.name + ".sql";
            var content = generator.tableType(item, columns);
            file.write(config.output.types, name, content);
        });
        // data
        data.forEach(function (item) {
            var name = item.schema + "." + item.name + ".sql";
            var content = generator.data(item);
            file.write(config.output.data, name, content);
        });
        // jobs
        jobs.forEach(function (item) {
            var steps = jobSteps.filter(function (x) { return x.job_id === item.job_id; });
            var schedules = jobSchedules.filter(function (x) { return x.job_id === item.job_id; });
            var name = item.name + ".sql";
            var content = generator.job(item, steps, schedules);
            file.write(config.output.jobs, name, content);
        });
        var msg = file.finalize();
        this.spinner.succeed(msg);
    };
    return Pull;
}());
exports.default = Pull;
//# sourceMappingURL=pull.js.map