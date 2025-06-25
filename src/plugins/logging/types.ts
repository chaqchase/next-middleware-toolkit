/**
 * Configuration options for the logging plugin
 */
export interface LoggingPluginOptions {
  /** Whether logging is enabled */
  enabled?: boolean;
  /** Log level threshold */
  level?: 'debug' | 'info' | 'warn' | 'error';
  /** Prefix for log messages */
  prefix?: string;
  /** Whether to include request headers in logs */
  includeHeaders?: boolean;
  /** Whether to include request body in logs */
  includeBody?: boolean;
}
