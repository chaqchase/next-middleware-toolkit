import {
  Plugin,
  MiddlewareContext,
  MiddlewareResult,
  MiddlewareRule,
} from '../../types/core';
import { LoggingPluginOptions } from './types';

/**
 * Logging plugin that provides comprehensive request and rule execution logging.
 * Tracks middleware execution flow with configurable log levels and detail.
 */
export class LoggingPlugin<T = any> implements Plugin<T> {
  name = 'logging';
  private options: Required<LoggingPluginOptions>;

  constructor(options: LoggingPluginOptions = {}) {
    this.options = {
      enabled: true,
      level: 'info',
      prefix: '[MIDDLEWARE]',
      includeHeaders: false,
      includeBody: false,
      ...options,
    };
  }

  /**
   * Internal logging method that respects the configured log level
   */
  private log(level: string, message: string, data?: any) {
    if (!this.options.enabled) return;

    const logMessage = `${this.options.prefix} ${message}`;

    switch (level) {
      case 'debug':
        console.debug(logMessage, data);
        break;
      case 'info':
        console.info(logMessage, data);
        break;
      case 'warn':
        console.warn(logMessage, data);
        break;
      case 'error':
        console.error(logMessage, data);
        break;
    }
  }

  /**
   * Called before request processing begins
   */
  async beforeRequest(context: MiddlewareContext<T>): Promise<void> {
    this.log('info', `🔍 Processing path: ${context.path}`);

    if (this.options.includeHeaders) {
      this.log(
        'debug',
        'Headers:',
        Object.fromEntries(context.req.headers.entries()),
      );
    }
  }

  /**
   * Called before each rule execution
   */
  async beforeRule(
    context: MiddlewareContext<T>,
    rule: MiddlewareRule<T>,
  ): Promise<void> {
    this.log('debug', `🔗 Executing rule for ${context.path}`);
  }

  /**
   * Called after each rule execution
   */
  async afterRule(
    context: MiddlewareContext<T>,
    rule: MiddlewareRule<T>,
    result: MiddlewareResult,
  ): Promise<void> {
    if (result) {
      const isRedirect = result.headers.get('location');
      if (isRedirect) {
        this.log('info', `🔄 Rule redirecting to: ${isRedirect}`);
      } else {
        this.log('info', `🛑 Rule returned response`);
      }
    }
  }

  /**
   * Called after request processing completes
   */
  async afterRequest(
    context: MiddlewareContext<T>,
    result: MiddlewareResult,
  ): Promise<void> {
    if (!result?.headers.get('location')) {
      this.log('info', `✨ Request completed for ${context.path}`);
    }
  }

  /**
   * Called when an error occurs during processing
   */
  async onError(context: MiddlewareContext<T>, error: Error): Promise<void> {
    this.log('error', `🚨 Error processing ${context.path}:`, error.message);
  }
}
