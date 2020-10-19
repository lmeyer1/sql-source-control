"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var os_1 = require("os");
var ts_util_is_1 = require("ts-util-is");
var helpers_1 = require("../common/helpers");
/**
 * MSSQL generator.
 */
var MSSQLGenerator = /** @class */ (function () {
    function MSSQLGenerator(config) {
        this.config = config;
    }
    /**
     * Get data file content.
     *
     * @param item Row from query.
     */
    MSSQLGenerator.prototype.data = function (item) {
        var _this = this;
        var output = '';
        switch (this.config.idempotency.data) {
            case 'delete':
                output += "DELETE FROM [" + item.schema + "].[" + item.name + "]" + os_1.EOL;
                output += os_1.EOL;
                break;
            case 'delete-and-reseed':
                output += "DELETE FROM [" + item.schema + "].[" + item.name + "]";
                output += os_1.EOL;
                output += "DBCC CHECKIDENT ('[" + item.schema + "].[" + item.name + "]', RESEED, 0)";
                output += os_1.EOL;
                break;
            case 'truncate':
                output += "TRUNCATE TABLE [" + item.schema + "].[" + item.name + "]";
                output += os_1.EOL;
                break;
        }
        output += os_1.EOL;
        if (item.hasIdentity) {
            output += "SET IDENTITY_INSERT [" + item.schema + "].[" + item.name + "] ON";
            output += os_1.EOL;
            output += os_1.EOL;
        }
        item.result.recordset.forEach(function (row) {
            var keys = Object.keys(row);
            var columns = keys.join(', ');
            var values = keys.map(function (key) { return _this.safeValue(row[key]); }).join(', ');
            output += "INSERT INTO [" + item.schema + "].[" + item.name + "] (" + columns + ") VALUES (" + values + ")";
            output += os_1.EOL;
        });
        if (item.hasIdentity) {
            output += os_1.EOL;
            output += "SET IDENTITY_INSERT [" + item.schema + "].[" + item.name + "]\n       OFF";
            output += os_1.EOL;
        }
        output += os_1.EOL;
        return output;
    };
    /**
     * Get function file content.
     *
     * @param item Row from query.
     */
    MSSQLGenerator.prototype.function = function (item) {
        var objectId = "[" + item.schema + "].[" + item.name + "]";
        var type = item.type.trim();
        var output = '';
        switch (this.config.idempotency.functions) {
            case 'if-exists-drop':
                output += "IF EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID('" + objectId + "') AND type = '" + type + "')";
                output += os_1.EOL;
                output += "DROP FUNCTION " + objectId;
                output += os_1.EOL;
                output += 'GO';
                output += os_1.EOL;
                break;
            case 'if-not-exists':
                output += "IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID('" + objectId + "') AND type = '" + type + "')";
                output += os_1.EOL;
                break;
        }
        output += item.text;
        return output;
    };
    /**
     * Get stored procedure file content.
     *
     * @param item Row from query.
     */
    MSSQLGenerator.prototype.storedProcedure = function (item) {
        var objectId = "[" + item.schema + "].[" + item.name + "]";
        var type = item.type.trim();
        var output = '';
        switch (this.config.idempotency.procs) {
            case 'if-exists-drop':
                output += "IF EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID('" + objectId + "') AND type = '" + type + "')";
                output += os_1.EOL;
                output += "DROP PROCEDURE " + objectId;
                output += os_1.EOL;
                output += 'GO';
                output += os_1.EOL;
                break;
            case 'if-not-exists':
                output += "IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID('" + objectId + "') AND type = '" + type + "')";
                output += os_1.EOL;
                break;
        }
        output += item.text;
        return output;
    };
    /**
     * Get schema file content.
     *
     * @param item Row from query.
     */
    MSSQLGenerator.prototype.schema = function (item) {
        var output = '';
        output += "IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = '" + item.name + "')";
        output += os_1.EOL;
        output += "EXEC('CREATE SCHEMA " + item.name + "')";
        return output;
    };
    /**
     * Get table file content.
     *
     * @param item Row from query.
     * @param columns Columns from query.
     * @param primaryKeys Primary key from query.
     * @param foreignKeys Foreign keys from query.
     * @param indexes Indexes from query.
     */
    MSSQLGenerator.prototype.table = function (item, columns, primaryKeys, foreignKeys, indexes) {
        var _this = this;
        var objectId = "[" + item.schema + "].[" + item.name + "]";
        var type = item.type.trim();
        var output = '';
        switch (this.config.idempotency.tables) {
            case 'if-exists-drop':
                output += "IF EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID('" + objectId + "') AND type = '" + type + "')";
                output += os_1.EOL;
                output += "DROP TABLE " + objectId;
                output += os_1.EOL;
                output += 'GO';
                output += os_1.EOL;
                break;
            case 'if-not-exists':
                output += "IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID('" + objectId + "') AND type = '" + type + "')";
                output += os_1.EOL;
                break;
        }
        output += "CREATE TABLE " + objectId;
        output += os_1.EOL;
        output += '(';
        output += os_1.EOL;
        columns
            .filter(function (x) { return x.object_id === item.object_id; })
            .forEach(function (col) {
            output += _this.indent() + _this.column(col) + ',';
            output += os_1.EOL;
        });
        primaryKeys = primaryKeys.filter(function (x) { return x.object_id === item.object_id; });
        foreignKeys = foreignKeys.filter(function (x) { return x.object_id === item.object_id; });
        indexes = indexes.filter(function (x) { return x.object_id === item.object_id; });
        var groupedKeys = helpers_1.Helpers.groupByName(primaryKeys, 'name');
        Object.keys(groupedKeys).forEach(function (name) {
            output += _this.primaryKey(groupedKeys[name]);
            output += os_1.EOL;
        });
        output += ')';
        if (foreignKeys.length || indexes.length) {
            output += os_1.EOL;
            output += os_1.EOL;
        }
        var groupedForeignKeys = helpers_1.Helpers.groupByName(foreignKeys, 'name');
        Object.keys(groupedForeignKeys).forEach(function (name) {
            output += _this.foreignKey(groupedForeignKeys[name]);
            output += os_1.EOL;
        });
        var groupedIndexes = helpers_1.Helpers.groupByName(indexes, 'name');
        Object.keys(groupedIndexes).forEach(function (name) {
            output += _this.index(groupedIndexes[name]);
            output += os_1.EOL;
        });
        return output;
    };
    /**
     * Get trigger file content.
     *
     * @param item Row from query.
     */
    MSSQLGenerator.prototype.trigger = function (item) {
        var objectId = "[" + item.schema + "].[" + item.name + "]";
        var type = item.type.trim();
        var output = '';
        switch (this.config.idempotency.triggers) {
            case 'if-exists-drop':
                output += "IF EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID('" + objectId + "') AND type = '" + type + "')";
                output += os_1.EOL;
                output += "DROP TRIGGER " + objectId;
                output += os_1.EOL;
                output += 'GO';
                output += os_1.EOL;
                break;
            case 'if-not-exists':
                output += "IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID('" + objectId + "') AND type = '" + type + "')";
                output += os_1.EOL;
                break;
        }
        output += item.text;
        return output;
    };
    /**
     * Get type file content.
     *
     * @param item Row from query.
     */
    MSSQLGenerator.prototype.type = function (item) {
        var objectId = "[" + item.schema + "].[" + item.name + "]";
        var output = '';
        switch (this.config.idempotency.types) {
            case 'if-exists-drop':
                output += 'IF EXISTS (';
                output += os_1.EOL;
                output += this.indent() + 'SELECT 1 FROM sys.types AS t';
                output += os_1.EOL;
                output +=
                    this.indent() + 'JOIN sys.schemas s ON t.schema_id = s.schema_id';
                output += os_1.EOL;
                output +=
                    this.indent() +
                        ("WHERE t.name = '" + item.name + "' AND s.name = '" + item.schema + "'");
                output += os_1.EOL;
                output += ')';
                output += os_1.EOL;
                output += "DROP TYPE " + item.name;
                output += os_1.EOL;
                output += 'GO';
                output += os_1.EOL;
                break;
            case 'if-not-exists':
                output += "IF NOT EXISTS (";
                output += os_1.EOL;
                output += this.indent() + 'SELECT 1 FROM sys.types AS t';
                output += os_1.EOL;
                output +=
                    this.indent() + 'JOIN sys.schemas s ON t.schema_id = s.schema_id';
                output += os_1.EOL;
                output +=
                    this.indent() +
                        ("WHERE t.name = '" + item.name + "' AND s.name = '" + item.schema + "'");
                output += os_1.EOL;
                output += ')';
                output += os_1.EOL;
                break;
        }
        output += "CREATE TYPE " + objectId;
        output += os_1.EOL;
        output += "FROM " + item.system_type.toUpperCase();
        switch (item.system_type) {
            case 'char':
            case 'nvarchar':
            case 'varchar':
                output += "(" + (item.max_length === -1 ? 'max' : item.max_length) + ")";
                break;
            case 'decimal':
            case 'numeric':
                output += "(" + item.scale + "," + item.precision + ")";
                break;
        }
        output += item.is_nullable ? ' NULL' : ' NOT NULL';
        return output;
    };
    /**
     * Get table type file content.
     *
     * @param item Row from query.
     * @param columns Columns from query.
     */
    MSSQLGenerator.prototype.tableType = function (item, columns) {
        var _this = this;
        var objectId = "[" + item.schema + "].[" + item.name + "]";
        var type = item.type.trim();
        var output = '';
        switch (this.config.idempotency.types) {
            case 'if-exists-drop':
                output += 'IF EXISTS (';
                output += os_1.EOL;
                output += this.indent() + 'SELECT 1 FROM sys.table_types AS t';
                output += os_1.EOL;
                output +=
                    this.indent() + 'JOIN sys.schemas s ON t.schema_id = s.schema_id';
                output += os_1.EOL;
                output +=
                    this.indent() +
                        ("WHERE t.name = '" + item.name + "' AND s.name = '" + item.schema + "'");
                output += os_1.EOL;
                output += ')';
                output += os_1.EOL;
                output += "DROP TYPE " + objectId;
                output += os_1.EOL;
                output += 'GO';
                output += os_1.EOL;
                break;
            case 'if-not-exists':
                output += "IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID('" + objectId + "') AND type = '" + type + "')";
                output += os_1.EOL;
                break;
        }
        output += "CREATE TYPE " + objectId + " AS TABLE";
        output += os_1.EOL;
        output += '(';
        output += os_1.EOL;
        columns
            .filter(function (x) { return x.object_id === item.object_id; })
            .forEach(function (col, idx, array) {
            output += _this.indent() + _this.column(col);
            if (idx !== array.length - 1) {
                // not the last column
                output += ',';
            }
            output += os_1.EOL;
        });
        output += ')';
        return output;
    };
    /**
     * Get view file content.
     *
     * @param item Row from query.
     */
    MSSQLGenerator.prototype.view = function (item) {
        var objectId = "[" + item.schema + "].[" + item.name + "]";
        var type = item.type.trim();
        var output = '';
        switch (this.config.idempotency.views) {
            case 'if-exists-drop':
                output += "IF EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID('" + objectId + "') AND type = '" + type + "')";
                output += os_1.EOL;
                output += "DROP VIEW " + objectId;
                output += os_1.EOL;
                output += 'GO';
                output += os_1.EOL;
                break;
            case 'if-not-exists':
                output += "IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID('" + objectId + "') AND type = '" + type + "')";
                output += os_1.EOL;
                break;
        }
        output += item.text;
        return output;
    };
    /**
     * Get job file content.
     *
     * @param steps Steps from query.
     * @param schedules Schedules from query.
     */
    MSSQLGenerator.prototype.job = function (job, steps, schedules) {
        var output = '';
        switch (this.config.idempotency.views) {
            case 'if-exists-drop':
                output += "IF EXISTS (SELECT 1 FROM msdb.dbo.sysjobs WHERE name = '" + job.name + "')";
                output += os_1.EOL;
                output += "EXEC msdb.dbo.sp_delete_job @job_name = '" + job.name + "'";
                output += os_1.EOL;
                output += 'GO';
                output += os_1.EOL;
                output += os_1.EOL;
                output += this.addJob(job, steps, schedules);
                output += os_1.EOL;
                break;
            case 'if-not-exists':
                output += "IF NOT EXISTS (SELECT 1 FROM msdb.dbo.sysjobs WHERE name = '" + job.name + "')";
                output += os_1.EOL;
                output += 'BEGIN';
                output += os_1.EOL;
                output += this.addJob(job, steps, schedules);
                output += os_1.EOL;
                output += 'END';
                output += os_1.EOL;
                break;
        }
        return output;
    };
    /**
     * Safely transform SQL value for scripting.
     *
     * @param value SQL data value.
     */
    MSSQLGenerator.prototype.safeValue = function (value) {
        if (ts_util_is_1.isNull(value)) {
            return 'NULL';
        }
        if (ts_util_is_1.isString(value)) {
            value = value.replace("'", "''");
            return "'" + value + "'";
        }
        if (ts_util_is_1.isDate(value)) {
            value = value.toISOString();
            return "'" + value + "'";
        }
        if (ts_util_is_1.isBoolean(value)) {
            return value ? 1 : 0;
        }
        return value;
    };
    /**
     * Get script for table's column.
     *
     * @param item Row from query.
     */
    MSSQLGenerator.prototype.column = function (item) {
        var output = "[" + item.name + "]";
        var size;
        if (item.is_computed) {
            output += " AS " + item.formula;
            if (item.is_persisted) {
                output += ' PERSISTED';
                output += item.is_nullable ? ' NULL' : ' NOT NULL';
            }
            return output;
        }
        output += " " + item.datatype;
        switch (item.datatype) {
            case 'varchar':
            case 'char':
            case 'varbinary':
            case 'binary':
                size = item.max_length === -1 ? 'max' : item.max_length;
                output += "(" + size + ")";
                break;
            case 'nvarchar':
            case 'nchar':
                size = item.max_length === -1 ? 'max' : item.max_length / 2;
                output += "(" + size + ")";
                break;
            case 'datetime2':
            case 'time2':
            case 'datetimeoffset':
                output += "(" + item.scale + ")";
                break;
            case 'decimal':
                output += "(" + item.precision + ", " + item.scale + ")";
                break;
        }
        if (item.collation_name && !item.is_user_defined) {
            output += " COLLATE " + item.collation_name;
        }
        output += item.is_nullable ? ' NULL' : ' NOT NULL';
        if (item.definition) {
            if (this.config.includeConstraintName && item.default_name) {
                output += " CONSTRAINT [" + item.default_name + "]";
            }
            output += " DEFAULT" + item.definition;
        }
        if (item.is_identity) {
            output += " IDENTITY(" + (item.seed_value || 0) + ", " + (item.increment_value || 1) + ")";
        }
        return output;
    };
    /**
     * Get script for table's primary key.
     *
     * @param items Rows from query.
     */
    MSSQLGenerator.prototype.primaryKey = function (items) {
        var _this = this;
        var first = items[0];
        var output = '';
        output += this.indent() + ("CONSTRAINT [" + first.name + "] PRIMARY KEY ");
        switch (first.type) {
            case 'CLUSTERED':
                output += 'CLUSTERED ';
                break;
            case 'NONCLUSTERED':
                output += 'NONCLUSTERED ';
                break;
        }
        if (items.length > 1) {
            output += os_1.EOL;
            output += this.indent() + '(';
            output += os_1.EOL;
            items.forEach(function (item, idx, array) {
                output += _this.indent(2) + _this.primaryKeyColumn(item);
                if (idx !== array.length - 1) {
                    // not the last column
                    output += ',';
                }
                output += os_1.EOL;
            });
            output += this.indent() + ')';
        }
        else {
            output += '(' + this.primaryKeyColumn(first) + ')';
        }
        return output;
    };
    /**
     * Get script for an individual primary key column.
     *
     * @param item Row from query.
     */
    MSSQLGenerator.prototype.primaryKeyColumn = function (item) {
        var direction = item.is_descending_key ? 'DESC' : 'ASC';
        return "[" + item.column + "] " + direction;
    };
    /**
     * Get script for table's foreign key.
     *
     * @param item Row from foreignKeys query.
     */
    MSSQLGenerator.prototype.foreignKey = function (items) {
        var first = items[0];
        var objectId = "[" + first.schema + "].[" + first.table + "]";
        var keyObjectId = "[" + first.schema + "].[" + first.name + "]";
        var parentObjectId = "[" + first.parent_schema + "].[" + first.parent_table + "]";
        var output = '';
        var columns = [];
        var references = [];
        output += "IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE object_id = OBJECT_ID('" + keyObjectId + "') AND parent_object_id = OBJECT_ID('" + objectId + "'))";
        output += os_1.EOL;
        output += 'BEGIN';
        output += os_1.EOL;
        output +=
            this.indent() +
                ("ALTER TABLE " + objectId + " WITH " + (first.is_not_trusted ? 'NOCHECK' : 'CHECK'));
        items.forEach(function (item) {
            columns.push(item.column);
            references.push(item.reference);
        });
        output += " ADD CONSTRAINT [" + first.name + "] FOREIGN KEY ([" + columns.join(', ') + "])";
        output += " REFERENCES " + parentObjectId + " ([" + references.join(', ') + "])";
        switch (first.delete_referential_action) {
            case 1:
                output += ' ON DELETE CASCADE';
                break;
            case 2:
                output += ' ON DELETE SET NULL';
                break;
            case 3:
                output += ' ON DELETE SET DEFAULT';
                break;
        }
        switch (first.update_referential_action) {
            case 1:
                output += ' ON UPDATE CASCADE';
                break;
            case 2:
                output += ' ON UPDATE SET NULL';
                break;
            case 3:
                output += ' ON UPDATE SET DEFAULT';
                break;
        }
        output += os_1.EOL;
        output +=
            this.indent() +
                ("ALTER TABLE " + objectId + " CHECK CONSTRAINT [" + first.name + "]");
        output += os_1.EOL;
        output += 'END';
        output += os_1.EOL;
        return output;
    };
    /**
     * Get script for table's index.
     *
     * @param items Rows from query.
     */
    MSSQLGenerator.prototype.index = function (items) {
        var _this = this;
        var first = items[0];
        var objectId = "[" + first.schema + "].[" + first.table + "]";
        var output = '';
        output += "IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('" + objectId + "') AND name = '" + first.name + "')";
        output += os_1.EOL;
        output += 'CREATE';
        if (first.is_unique) {
            output += ' UNIQUE';
        }
        output += " " + first.type + " INDEX [" + first.name + "] ON " + objectId;
        output += '(';
        if (items.length > 1) {
            output += os_1.EOL;
            items.forEach(function (item, idx, array) {
                output += _this.indent() + _this.indexColumn(item);
                if (idx !== array.length - 1) {
                    // not the last column
                    output += ',';
                }
                output += os_1.EOL;
            });
        }
        else {
            output += this.indexColumn(first);
        }
        output += ')';
        output += os_1.EOL;
        return output;
    };
    /**
     * Get script for an individual index column.
     *
     * @param item Row from query.
     */
    MSSQLGenerator.prototype.indexColumn = function (item) {
        var direction = item.is_descending_key ? 'DESC' : 'ASC';
        return "[" + item.column + "] " + direction;
    };
    /**
     * Get job file content.
     *
     * @param steps Steps from query.
     * @param schedules Schedules from query.
     */
    MSSQLGenerator.prototype.addJob = function (job, steps, schedules) {
        var _this = this;
        var output = '';
        // job
        output += 'EXEC msdb.dbo.sp_add_job ';
        output += os_1.EOL;
        output += this.indent() + ("@job_name = N'" + job.name + "',");
        output += os_1.EOL;
        output += this.indent() + ("@enabled = " + job.enabled + ",");
        output += os_1.EOL;
        output += this.indent() + ("@description = N'" + job.description + "',");
        output += os_1.EOL;
        output +=
            this.indent() + ("@notify_level_eventlog = " + job.notify_level_eventlog + ",");
        output += os_1.EOL;
        output +=
            this.indent() + ("@notify_level_email = " + job.notify_level_email + ",");
        output += os_1.EOL;
        output +=
            this.indent() + ("@notify_level_netsend = " + job.notify_level_netsend + ",");
        output += os_1.EOL;
        output += this.indent() + ("@notify_level_page = " + job.notify_level_page + ",");
        output += os_1.EOL;
        output += this.indent() + ("@delete_level = " + job.delete_level + ";");
        output += os_1.EOL;
        output += 'GO';
        output += os_1.EOL;
        output += os_1.EOL;
        // steps
        steps.forEach(function (step) {
            output += 'EXEC msdb.dbo.sp_add_jobstep';
            output += os_1.EOL;
            output += _this.indent() + ("@job_name = N'" + step.job_name + "',");
            output += os_1.EOL;
            output += _this.indent() + ("@step_name = N'" + step.step_name + "',");
            output += os_1.EOL;
            output += _this.indent() + ("@subsystem = N'" + step.subsystem + "',");
            output += os_1.EOL;
            output += _this.indent() + ("@command = N'" + step.command + "',");
            output += os_1.EOL;
            if (step.additional_parameters) {
                output +=
                    _this.indent() +
                        ("@additional_parameters = N'" + step.additional_parameters + "',");
                output += os_1.EOL;
            }
            output +=
                _this.indent() + ("@cmdexec_success_code = " + step.cmdexec_success_code + ",");
            output += os_1.EOL;
            output +=
                _this.indent() + ("@on_success_action = " + step.on_success_action + ",");
            output += os_1.EOL;
            output +=
                _this.indent() + ("@on_success_step_id = " + step.on_success_step_id + ",");
            output += os_1.EOL;
            output += _this.indent() + ("@on_fail_action = " + step.on_fail_action + ",");
            output += os_1.EOL;
            output += _this.indent() + ("@on_fail_step_id = " + step.on_fail_step_id + ",");
            output += os_1.EOL;
            output += _this.indent() + ("@database_name = N'" + step.database_name + "',");
            output += os_1.EOL;
            if (step.database_user_name) {
                output +=
                    _this.indent() +
                        ("@database_user_name = N'" + step.database_user_name + "',");
                output += os_1.EOL;
            }
            output += _this.indent() + ("@retry_attempts = " + step.retry_attempts + ",");
            output += os_1.EOL;
            output += _this.indent() + ("@retry_interval = " + step.retry_interval + ",");
            output += os_1.EOL;
            output += _this.indent() + ("@os_run_priority = " + step.os_run_priority + ",");
            output += os_1.EOL;
            output += _this.indent() + ("@flags = " + step.flags + ";");
            output += os_1.EOL;
            output += 'GO';
            output += os_1.EOL;
            output += os_1.EOL;
        });
        // schedule
        if (schedules.length) {
            output += 'EXEC msdb.dbo.sp_add_schedule';
            output += os_1.EOL;
            schedules.forEach(function (schedule) {
                output +=
                    _this.indent() + ("@schedule_name = N'" + schedule.schedule_name + "',");
                output += os_1.EOL;
                output += _this.indent() + ("@enabled = " + schedule.enabled + ",");
                output += os_1.EOL;
                output += _this.indent() + ("@freq_type = " + schedule.freq_type + ",");
                output += os_1.EOL;
                output += _this.indent() + ("@freq_interval = " + schedule.freq_interval + ",");
                output += os_1.EOL;
                output +=
                    _this.indent() + ("@freq_subday_type = " + schedule.freq_subday_type + ",");
                output += os_1.EOL;
                output +=
                    _this.indent() +
                        ("@freq_subday_interval = " + schedule.freq_subday_interval + ",");
                output += os_1.EOL;
                output +=
                    _this.indent() +
                        ("@freq_relative_interval = " + schedule.freq_relative_interval + ",");
                output += os_1.EOL;
                output +=
                    _this.indent() +
                        ("@freq_recurrence_factor = " + schedule.freq_recurrence_factor + ",");
                output += os_1.EOL;
                output +=
                    _this.indent() + ("@active_start_date = " + schedule.active_start_date + ",");
                output += os_1.EOL;
                output +=
                    _this.indent() + ("@active_end_date = " + schedule.active_end_date + ",");
                output += os_1.EOL;
                output +=
                    _this.indent() + ("@active_start_time = " + schedule.active_start_time + ",");
                output += os_1.EOL;
                output +=
                    _this.indent() + ("@active_end_time = " + schedule.active_end_time + ";");
                output += os_1.EOL;
            });
            output += 'GO';
            output += os_1.EOL;
            output += os_1.EOL;
            // attach
            var scheduleName = schedules[0].schedule_name;
            output += 'EXEC msdb.dbo.sp_attach_schedule';
            output += os_1.EOL;
            output += this.indent() + ("@job_name = N'" + job.name + "',");
            output += os_1.EOL;
            output += this.indent() + ("@schedule_name = N'" + scheduleName + "';");
            output += os_1.EOL;
            output += 'GO';
            output += os_1.EOL;
            output += os_1.EOL;
        }
        // job server
        output += 'EXEC msdb.dbo.sp_add_jobserver';
        output += os_1.EOL;
        output += this.indent() + ("@job_name = N'" + job.name + "';");
        output += os_1.EOL;
        output += 'GO';
        output += os_1.EOL;
        return output;
    };
    /**
     * Generate indentation spacing.
     *
     * @param count Number of levels to indent.
     */
    MSSQLGenerator.prototype.indent = function (count) {
        if (count === void 0) { count = 1; }
        return '    '.repeat(count);
    };
    return MSSQLGenerator;
}());
exports.default = MSSQLGenerator;
//# sourceMappingURL=mssql.js.map