"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var inquirer = require("inquirer");
var config_1 = require("../common/config");
var connection_1 = require("../common/connection");
var eums_1 = require("./eums");
var Init = /** @class */ (function () {
    function Init(options) {
        this.options = options;
    }
    /**
     * Invoke action.
     */
    Init.prototype.invoke = function () {
        var _this = this;
        var webConfigConns = config_1.default.getConnectionsFromWebConfig(this.options.webconfig);
        var conn = new connection_1.default();
        if (!this.options.force && config_1.default.doesDefaultExist()) {
            // don't overwrite existing config file
            return console.error('Config file already exists!');
        }
        if (webConfigConns) {
            // use options from web config
            conn.loadFromObject(webConfigConns[0]);
        }
        if (this.options.skip) {
            // skip prompts and create with defaults
            config_1.default.write({ connections: this.options.webconfig || [conn] });
            return;
        }
        inquirer
            .prompt(this.getQuestions(conn, !!webConfigConns))
            .then(function (answers) { return _this.writeFiles(answers); });
    };
    /**
     * Get all applicable questions.
     *
     * @param conn Connection object to use for default values.
     */
    Init.prototype.getQuestions = function (conn, showWebConfig) {
        var _this = this;
        var questions = [
            {
                choices: function () { return _this.getPathChoices(showWebConfig); },
                message: 'Where would you like to store connections?',
                name: 'path',
                type: 'list',
            },
            {
                default: conn.server || undefined,
                message: 'Server URL.',
                name: 'server',
                when: function (answers) { return answers.path !== eums_1.PathChoices.WebConfig; },
            },
            {
                default: conn.port || undefined,
                message: 'Server port.',
                name: 'port',
                type: 'number',
                when: function (answers) { return answers.path !== eums_1.PathChoices.WebConfig; },
            },
            {
                default: conn.database || undefined,
                message: 'Database name.',
                name: 'database',
                when: function (answers) { return answers.path !== eums_1.PathChoices.WebConfig; },
            },
            {
                default: conn.user || undefined,
                message: 'Login username.',
                name: 'user',
                when: function (answers) { return answers.path !== eums_1.PathChoices.WebConfig; },
            },
            {
                default: conn.password || undefined,
                message: 'Login password.',
                name: 'password',
                type: 'password',
                when: function (answers) { return answers.path !== eums_1.PathChoices.WebConfig; },
            },
            {
                default: 'dev',
                message: 'Connection name.',
                name: 'name',
                when: function (answers) { return answers.path !== eums_1.PathChoices.WebConfig; },
            },
        ];
        return questions;
    };
    /**
     * Get all available configuration file path choices.
     *
     * @param showWebConfig Indicates if Web.config choice should be available.
     */
    Init.prototype.getPathChoices = function (showWebConfig) {
        var choices = [
            {
                name: 'Main configuration file.',
                value: eums_1.PathChoices.SscConfig,
            },
            {
                name: 'Separate connections configuration file.',
                value: eums_1.PathChoices.ConnsConfig,
            },
        ];
        if (showWebConfig) {
            choices.push({
                name: 'Web.config file with connection strings.',
                value: eums_1.PathChoices.WebConfig,
            });
        }
        return choices;
    };
    /**
     * From configuration files(s) based on answers.
     *
     * @param answers Answers from questions.
     */
    Init.prototype.writeFiles = function (answers) {
        var conn = {
            database: answers.database,
            name: answers.name,
            password: answers.password,
            port: answers.port,
            server: answers.server,
            user: answers.user,
        };
        if (answers.path === eums_1.PathChoices.WebConfig) {
            config_1.default.write({ connections: config_1.default.defaultWebConfigFile });
        }
        else if (answers.path === eums_1.PathChoices.ConnsConfig) {
            config_1.default.write({ connections: config_1.default.defaultConnectionsJsonFile });
            config_1.default.write({ connections: [conn] }, config_1.default.defaultConnectionsJsonFile);
        }
        else {
            config_1.default.write({ connections: [conn] });
        }
    };
    return Init;
}());
exports.default = Init;
//# sourceMappingURL=init.js.map