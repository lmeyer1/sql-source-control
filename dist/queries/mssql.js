"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobSchedulesRead = exports.jobStepsRead = exports.jobsRead = exports.objectsRead = exports.typesRead = exports.indexesRead = exports.foreignKeysRead = exports.primaryKeysRead = exports.columnsRead = exports.tablesRead = void 0;
/**
 * Get SQL table information.
 */
exports.tablesRead = "\n  SELECT\n    o.object_id,\n    o.type,\n    s.name AS [schema],\n    o.name,\n    ISNULL(c.identity_count, 0) AS [identity_count]\n  FROM\n    sys.objects o\n    JOIN sys.schemas s ON o.schema_id = s.schema_id\n    LEFT JOIN (\n      SELECT\n        i.object_id,\n        count(1) AS [identity_count]\n      FROM\n        sys.identity_columns i\n      GROUP BY\n        i.object_id\n    ) c on c.object_id = o.object_id\n  where\n    o.type = 'U'\n    AND o.is_ms_shipped = 0\n  ORDER BY\n    s.name,\n    o.name\n";
/**
 * Get SQL column information.
 */
exports.columnsRead = "\n  SELECT\n    c.object_id,\n    c.name,\n    tp.name AS [datatype],\n    tp.is_user_defined,\n    c.max_length,\n    c.is_computed,\n    c.precision,\n    c.scale AS [scale],\n    c.collation_name,\n    c.is_nullable,\n    dc.definition,\n    ic.is_identity,\n    ic.seed_value,\n    ic.increment_value,\n    cc.definition AS [formula],\n    cc.is_persisted,\n    dc.name as default_name\n  FROM\n    sys.columns c\n    JOIN sys.types tp ON c.user_type_id = tp.user_type_id\n    LEFT JOIN sys.computed_columns cc ON c.object_id = cc.object_id AND c.column_id = cc.column_id\n    LEFT JOIN sys.default_constraints dc ON\n      c.default_object_id != 0\n      AND c.object_id = dc.parent_object_id\n      AND c.column_id = dc.parent_column_id\n    LEFT JOIN sys.identity_columns ic ON\n      c.is_identity = 1\n      AND c.object_id = ic.object_id\n      AND c.column_id = ic.column_id\n";
/**
 * Get SQL primary key information.
 */
exports.primaryKeysRead = "\n  SELECT\n    c.object_id,\n    ic.is_descending_key,\n    k.name,\n    c.name AS [column],\n    CASE\n      WHEN ic.index_id = 1 THEN 'CLUSTERED'\n      WHEN ic.index_id > 1 THEN 'NONCLUSTERED'\n      ELSE 'HEAP'\n    END as [type]\n  FROM\n    sys.index_columns ic\n    JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id\n    LEFT JOIN sys.key_constraints k ON k.parent_object_id = ic.object_id\n  WHERE\n    ic.is_included_column = 0\n    AND ic.index_id = k.unique_index_id\n    AND k.type = 'PK'\n  ORDER BY\n    c.object_id,\n    k.name,\n    ic.key_ordinal\n";
/**
 * Get SQL foreign key information.
 */
exports.foreignKeysRead = "\n  SELECT\n    po.object_id,\n    k.constraint_object_id,\n    fk.is_not_trusted,\n    c.name AS [column],\n    rc.name AS [reference],\n    fk.name,\n    SCHEMA_NAME(po.schema_id) AS [schema],\n    po.name AS [table],\n    SCHEMA_NAME(ro.schema_id) AS [parent_schema],\n    ro.name AS [parent_table],\n    fk.delete_referential_action,\n    fk.update_referential_action,\n    fkc.constraint_column_id\n  FROM\n    sys.foreign_key_columns k\n    JOIN sys.columns rc ON rc.object_id = k.referenced_object_id AND rc.column_id = k.referenced_column_id\n    JOIN sys.columns c ON c.object_id = k.parent_object_id AND c.column_id = k.parent_column_id\n    JOIN sys.foreign_keys fk ON fk.object_id = k.constraint_object_id\n    JOIN sys.objects ro ON ro.object_id = fk.referenced_object_id\n    JOIN sys.objects po ON po.object_id = fk.parent_object_id\n    JOIN sys.foreign_key_columns fkc ON fkc.parent_object_id = fk.parent_object_id and fkc.parent_column_id = k.parent_column_id\n  ORDER BY\n    po.object_id,\n    k.constraint_object_id,\n    fkc.constraint_column_id\n";
/**
 * Get SQL index information.
 */
exports.indexesRead = "\n  SELECT\n    ic.object_id,\n    ic.index_id,\n    ic.is_descending_key,\n    ic.is_included_column,\n    i.is_unique,\n    i.name,\n    c.name AS [column],\n    SCHEMA_NAME(ro.schema_id) AS [schema],\n    ro.name AS [table],\n    CASE i.type WHEN 1 THEN 'CLUSTERED' WHEN 2 THEN 'NONCLUSTERED' END AS [type]\n  FROM\n    sys.index_columns ic\n    JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id\n    JOIN sys.indexes i ON i.object_id = c.object_id AND i.index_id = ic.index_id AND i.is_primary_key = 0 AND i.type IN (1, 2)\n    INNER JOIN sys.objects ro ON ro.object_id = c.object_id\n  WHERE\n    ro.is_ms_shipped = 0\n    AND ic.is_included_column = 0\n  ORDER BY\n    ro.schema_id,\n    ro.name,\n    ic.key_ordinal,\n    c.object_id\n";
/**
 * Get SQL information for user defined types.
 */
exports.typesRead = "\n  SELECT\n    o.object_id,\n    o.type,\n    s.name AS [schema],\n    t.name,\n    TYPE_NAME(t.system_type_id) as [system_type],\n    t.max_length,\n    t.precision,\n    t.scale,\n    t.is_nullable\n  FROM\n    sys.types t\n    LEFT JOIN sys.table_types tt ON tt.user_type_id = t.user_type_id\n    LEFT JOIN sys.objects o ON o.object_id = tt.type_table_object_id\n    JOIN sys.schemas s ON t.schema_id = s.schema_id\n  WHERE\n    t.is_user_defined = 1\n  ORDER BY\n    s.name,\n    o.name\n";
/**
 * Get SQL information for procs, triggers, functions, etc.
 */
exports.objectsRead = "\n  SELECT\n    so.name,\n    s.name AS [schema],\n    so.type AS [type],\n    STUFF\n    (\n      (\n        SELECT\n          CAST(sc_inner.text AS varchar(max))\n        FROM\n          sys.objects so_inner\n          INNER JOIN syscomments sc_inner ON sc_inner.id = so_inner.object_id\n          INNER JOIN sys.schemas s_inner ON s_inner.schema_id = so_inner.schema_id\n        WHERE\n          so_inner.name = so.name\n          AND s_inner.name = s.name\n        FOR XML PATH(''), TYPE\n      ).value('(./text())[1]', 'varchar(max)')\n      ,1\n      ,0\n      ,''\n    ) AS [text]\n  FROM\n    sys.objects so\n    INNER JOIN syscomments sc ON sc.id = so.object_id AND so.type in ('P', 'V', 'TF', 'IF', 'FN', 'TR')\n    INNER JOIN sys.schemas s ON s.schema_id = so.schema_id\n  GROUP BY\n    so.name,\n    s.name,\n    so.type\n";
/**
 * Get SQL information for jobs.
 */
var jobsRead = function (database) { return "\n  SELECT DISTINCT\n    j.job_id,\n    j.name,\n    j.enabled,\n    j.description,\n    j.notify_level_eventlog,\n    j.notify_level_email,\n    j.notify_level_netsend,\n    j.notify_level_page,\n    j.delete_level\n  FROM\n    msdb.dbo.sysjobs j\n    LEFT JOIN msdb.dbo.sysjobsteps s ON s.job_id = j.job_id\n  WHERE\n    s.database_name = '" + database + "'\n  ORDER BY\n    j.name\n"; };
exports.jobsRead = jobsRead;
/**
 * Get SQL information for jobs.
 */
var jobStepsRead = function (database) { return "\n  SELECT\n    s.job_id,\n    j.name as [job_name],\n    s.step_uid,\n    s.step_id AS step_number,\n    s.step_name,\n    s.subsystem,\n    s.command,\n    s.additional_parameters,\n    s.cmdexec_success_code,\n    s.on_success_action,\n    s.on_success_step_id,\n    s.on_fail_action,\n    s.on_fail_step_id,\n    s.database_name,\n    s.database_user_name,\n    s.retry_attempts,\n    s.retry_interval,\n    s.os_run_priority,\n    s.flags\n  FROM\n    msdb.dbo.sysjobsteps s\n    INNER JOIN msdb.dbo.sysjobs j ON j.job_id = s.job_id\n  WHERE\n    s.database_name = '" + database + "'\n  ORDER BY\n    s.job_id,\n    s.step_id\n"; };
exports.jobStepsRead = jobStepsRead;
/**
 * Get SQL information for job schedules.
 */
var jobSchedulesRead = function () { return "\n  SELECT\n    s.schedule_uid,\n    s.name AS [schedule_name],\n    s.enabled,\n    s.freq_type,\n    s.freq_interval,\n    s.freq_subday_type,\n    s.freq_subday_interval,\n    s.freq_relative_interval,\n    s.freq_recurrence_factor,\n    s.active_start_date,\n    s.active_end_date,\n    s.active_start_time,\n    s.active_end_time,\n    js.job_id\n  FROM\n    msdb.dbo.sysschedules s\n    INNER JOIN msdb.dbo.sysjobschedules js ON js.schedule_id = s.schedule_id\n  ORDER BY\n    s.name\n"; };
exports.jobSchedulesRead = jobSchedulesRead;
//# sourceMappingURL=mssql.js.map