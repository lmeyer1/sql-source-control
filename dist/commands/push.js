"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var chalk = require("chalk");
var fs = require("fs-extra");
var glob = require("glob");
var inquirer = require("inquirer");
var sql = require("mssql");
var ora = require("ora");
var os_1 = require("os");
var config_1 = require("../common/config");
var Push = /** @class */ (function () {
    function Push(name, options) {
        this.name = name;
        this.options = options;
        /**
         * Spinner instance.
         */
        this.spinner = ora();
    }
    /**
     * Invoke actions.
     */
    Push.prototype.invoke = function () {
        var _this = this;
        var config = new config_1.default(this.options.config);
        var conn = config.getConnection(this.name);
        inquirer
            .prompt([
            {
                message: [
                    chalk.yellow('WARNING!') + " All local SQL files will be executed against the requested database.",
                    'This can not be undone!',
                    'Make sure to backup your database first.',
                    os_1.EOL,
                    'Are you sure you want to continue?',
                ].join(' '),
                name: 'continue',
                type: 'confirm',
                when: !this.options.skip,
            },
        ])
            .then(function (answers) {
            if (answers.continue === false) {
                throw new Error('Command aborted!');
            }
        })
            .then(function () { return _this.batch(config, conn); })
            .then(function () { return _this.spinner.succeed('Successfully pushed!'); })
            .catch(function (error) { return _this.spinner.fail(error); });
    };
    /**
     * Execute all files against database.
     *
     * @param config Configuration used to execute commands.
     * @param conn Connection used to execute commands.
     */
    Push.prototype.batch = function (config, conn) {
        var files = this.getFilesOrdered(config);
        var promise = new sql.ConnectionPool(conn).connect();
        this.spinner.start("Pushing to " + chalk.blue(conn.server) + " ...");
        files.forEach(function (file) {
            var content = fs.readFileSync(file, 'utf8');
            var statements = content.split('GO' + os_1.EOL);
            statements.forEach(function (statement) {
                promise = promise.then(function (pool) {
                    return pool
                        .request()
                        .batch(statement)
                        .then(function () { return pool; });
                });
            });
        });
        return promise;
    };
    /**
     * Get all SQL files in correct execution order.
     *
     * @param config Configuration used to search for connection.
     */
    Push.prototype.getFilesOrdered = function (config) {
        var output = [];
        var directories = [
            config.output.schemas,
            config.output.tables,
            config.output.types,
            config.output.views,
            config.output.functions,
            config.output.procs,
            config.output.triggers,
            config.output.data,
            config.output.jobs,
        ];
        directories.forEach(function (dir) {
            if (dir) {
                var files = glob.sync(config.getRoot() + "/" + dir + "/**/*.sql");
                output.push.apply(output, files);
            }
        });
        return output;
    };
    return Push;
}());
exports.default = Push;
//# sourceMappingURL=push.js.map