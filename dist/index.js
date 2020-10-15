"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var program = require("commander");
var updateNotifier = require("update-notifier");
var pkg = require("../package.json");
var init_1 = require("./commands/init");
var list_1 = require("./commands/list");
var pull_1 = require("./commands/pull");
var push_1 = require("./commands/push");
// check for updates
updateNotifier({ pkg: pkg }).notify();
program
    .command('init')
    .description('Create default config file.')
    .option('-f, --force', 'Overwrite existing config file, if present.')
    .option('-s, --skip', 'Use defaults only and skip the option prompts.')
    .option('-w, --webconfig [value]', 'Relative path to Web.config file.')
    .action(function (options) {
    var action = new init_1.default(options);
    action.invoke();
});
program
    .command('list')
    .alias('ls')
    .description('List all available connections.')
    .option('-c, --config [value]', 'Relative path to config file.')
    .action(function (options) {
    var action = new list_1.default(options);
    action.invoke();
});
program
    .command('pull [name]')
    .description('Generate SQL files for all tables, stored procedures, functions, etc.')
    .option('-c, --config [value]', 'Relative path to config file.')
    .action(function (name, options) {
    var action = new pull_1.default(name, options);
    action.invoke();
});
program
    .command('push [name]')
    .description('Execute all scripts against the requested database.')
    .option('-c, --config [value]', 'Relative path to config file.')
    .option('-s, --skip', 'Skip user warning prompt.')
    .action(function (name, options) {
    var action = new push_1.default(name, options);
    action.invoke();
});
program.version(pkg.version).parse(process.argv);
//# sourceMappingURL=index.js.map