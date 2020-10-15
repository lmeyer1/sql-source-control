"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var chalk = require("chalk");
var checksum = require("checksum");
var filenamify = require("filenamify");
var fs = require("fs-extra");
var glob = require("glob");
var multimatch = require("multimatch");
var path = require("path");
var cache_1 = require("./cache");
/**
 * File system interaction and tracking.
 */
var FileUtility = /** @class */ (function () {
    function FileUtility(config) {
        /**
         * Counts about files written / removed.
         */
        this.stats = {
            added: 0,
            removed: 0,
            updated: 0,
        };
        this.config = config;
        this.existingCache = new cache_1.default(config);
        this.newCache = new cache_1.default(config);
        this.load();
    }
    /**
     * Write file to the file system.
     *
     * @param file Directory to write, relative to root.
     * @param file File name to write to.
     * @param content File content to write.
     */
    FileUtility.prototype.write = function (dir, file, content) {
        if (dir === false) {
            return;
        }
        // remove unsafe characters
        file = filenamify(file);
        if (!this.shouldWrite(file)) {
            return;
        }
        file = path.join(this.config.getRoot(), dir, file);
        content = content.trim();
        var cacheKey = this.normalize(file);
        var cacheValue = checksum(content);
        this.newCache.add(cacheKey, cacheValue);
        if (!this.doesExist(file)) {
            this.stats.added++;
        }
        else if (this.existingCache.didChange(cacheKey, cacheValue)) {
            this.stats.updated++;
        }
        fs.outputFileSync(file, content);
        this.markAsWritten(file);
    };
    /**
     * Delete all paths remaining in `existing`.
     */
    FileUtility.prototype.finalize = function () {
        var _this = this;
        this.existingFiles.forEach(function (file) {
            _this.stats.removed++;
            fs.removeSync(file);
        });
        this.newCache.write();
        var added = chalk.green(this.stats.added.toString());
        var updated = chalk.cyan(this.stats.updated.toString());
        var removed = chalk.red(this.stats.removed.toString());
        return "Successfully added " + added + ", updated " + updated + ", and removed " + removed + " files.";
    };
    /**
     * Check if a file passes the glob pattern.
     *
     * @param file File path to check.
     */
    FileUtility.prototype.shouldWrite = function (file) {
        if (!this.config.files || !this.config.files.length) {
            return true;
        }
        var results = multimatch([file], this.config.files);
        return !!results.length;
    };
    /**
     * Check if a file existed.
     *
     * @param file File path to check.
     */
    FileUtility.prototype.doesExist = function (file) {
        if (!this.existingFiles || !this.existingFiles.length) {
            return false;
        }
        file = this.normalize(file);
        var index = this.existingFiles.indexOf(file);
        return index !== -1;
    };
    /**
     * Remove `file` from `existing`, if it exists.
     *
     * @param file File path to check.
     */
    FileUtility.prototype.markAsWritten = function (file) {
        if (!file) {
            return;
        }
        file = this.normalize(file);
        var index = this.existingFiles.indexOf(file);
        if (index !== -1) {
            this.existingFiles.splice(index, 1);
        }
    };
    /**
     * Normalize file path for comparison.
     *
     * @param file File path to normalize.
     */
    FileUtility.prototype.normalize = function (file) {
        var root = this.config.getRoot();
        if (root.startsWith('./') && !file.startsWith('./')) {
            file = "./" + file;
        }
        return file.replace(/\\/g, '/');
    };
    /**
     * Load existing files and cache for comparison.
     */
    FileUtility.prototype.load = function () {
        this.existingFiles = glob.sync(this.config.getRoot() + "/**/*.sql");
        this.existingCache.load();
    };
    return FileUtility;
}());
exports.default = FileUtility;
//# sourceMappingURL=file-utility.js.map