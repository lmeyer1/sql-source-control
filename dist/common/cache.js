"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs-extra");
var path = require("path");
/**
 * File checksum cache.
 */
var Cache = /** @class */ (function () {
    function Cache(config) {
        /**
         * File checksums.
         */
        this.files = {};
        this.config = config;
    }
    /**
     * Load configuration options from file.
     */
    Cache.prototype.load = function () {
        if (!this.doesDefaultExist()) {
            return;
        }
        try {
            var file = path.join(this.config.getRoot(), Cache.defaultCacheFile);
            var cache = fs.readJsonSync(file);
            this.files = cache.files;
        }
        catch (error) {
            console.error("Could not parse cache file. Try deleting the existing " + Cache.defaultCacheFile + " file!");
            process.exit();
        }
    };
    /**
     * Check if a `newSum` is different from the existing file's checksum.
     *
     * @param file File to check.
     * @param newSum New checksum value.
     */
    Cache.prototype.didChange = function (file, newSum) {
        if (!this.files) {
            return true;
        }
        var oldSum = this.files[file];
        if (!oldSum) {
            return true;
        }
        return newSum !== oldSum;
    };
    /**
     * Add file checksum to cache.
     *
     * @param file File to check.
     * @param newSum New checksum value.
     */
    Cache.prototype.add = function (file, newSum) {
        if (!file || !newSum) {
            return;
        }
        this.files[file] = newSum;
    };
    /**
     * Write a config file with provided configuration.
     */
    Cache.prototype.write = function () {
        var file = path.join(this.config.getRoot(), Cache.defaultCacheFile);
        var content = { files: this.files };
        fs.writeJson(file, content, { spaces: 2 });
    };
    /**
     * Check if default cache file exists.
     */
    Cache.prototype.doesDefaultExist = function () {
        var file = path.join(this.config.getRoot(), Cache.defaultCacheFile);
        return fs.existsSync(file);
    };
    /**
     * Default cache file.
     */
    Cache.defaultCacheFile = 'cache.json';
    return Cache;
}());
exports.default = Cache;
//# sourceMappingURL=cache.js.map