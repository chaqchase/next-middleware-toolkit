import { NextRequest } from 'next/server';

/**
 * Configuration options for the internationalization plugin
 */
export interface I18nPluginOptions {
  /** Whether i18n is enabled */
  enabled?: boolean;
  /** Default locale to use */
  defaultLocale?: string;
  /** List of supported locales */
  supportedLocales?: string[];
  /** Strategy for locale handling */
  strategy?: 'prefix' | 'domain' | 'subdomain';
  /** Whether to automatically detect locale */
  localeDetection?: boolean;
  /** Cookie name for storing locale preference */
  localeCookie?: string | false;
  /** Domain for locale cookie */
  cookieDomain?: string;
  /** Maximum age for locale cookie */
  cookieMaxAge?: number;
  /** Domain-specific locale configurations */
  domains?: Array<{
    domain: string;
    defaultLocale: string;
    locales?: string[];
  }>;
  /** Strategy for redirecting to correct locale */
  redirectStrategy?: 'redirect' | 'rewrite';
  /** Integration with i18n libraries */
  integration?: 'next-intl' | 'next-i18next' | 'react-i18next' | 'custom';
  /** Callback when locale is detected */
  onLocaleDetected?: (locale: string, detectionMethod: string) => void;
  /** Fallback locale when detection fails */
  fallbackLocale?: string;
  /** Function to extract locale from path */
  localeFromPath?: (path: string) => string | null;
  /** Function to rewrite paths with locale */
  pathRewriter?: (path: string, locale: string) => string;
}

/**
 * Required version of i18n options for internal use
 */
export interface RequiredI18nPluginOptions {
  enabled: boolean;
  defaultLocale: string;
  supportedLocales: string[];
  strategy: 'prefix' | 'domain' | 'subdomain';
  localeDetection: boolean;
  localeCookie: string | false;
  cookieDomain: string | undefined;
  cookieMaxAge: number;
  domains: Array<{
    domain: string;
    defaultLocale: string;
    locales?: string[];
  }>;
  redirectStrategy: 'redirect' | 'rewrite';
  integration: 'next-intl' | 'next-i18next' | 'react-i18next' | 'custom';
  onLocaleDetected: (locale: string, detectionMethod: string) => void;
  fallbackLocale: string;
  localeFromPath: (path: string) => string | null;
  pathRewriter: (path: string, locale: string) => string;
}

/**
 * Information about detected locale
 */
export interface LocaleInfo {
  /** The detected locale */
  locale: string;
  /** How the locale was detected */
  detectedFrom: 'path' | 'cookie' | 'header' | 'domain' | 'default';
  /** Original request path */
  originalPath: string;
  /** Path with locale applied */
  localizedPath: string;
  /** Optional country code */
  country?: string;
  /** Optional region code */
  region?: string;
}

/**
 * Context information about current i18n state
 */
export interface I18nContext {
  /** Current locale */
  locale: string;
  /** Default locale */
  defaultLocale: string;
  /** All supported locales */
  supportedLocales: string[];
  /** Detailed locale information */
  localeInfo: LocaleInfo;
  /** Path without locale prefix */
  pathWithoutLocale: string;
  /** Whether current locale is the default */
  isDefaultLocale: boolean;
}

/**
 * Parsed locale information
 */
export interface ParsedLocale {
  /** Language code */
  language: string;
  /** Country code */
  country?: string;
  /** Region code */
  region?: string;
  /** Full locale string */
  full: string;
}

/**
 * Entry from Accept-Language header
 */
export interface AcceptLanguageEntry {
  /** Locale string */
  locale: string;
  /** Quality value */
  quality: number;
  /** Parsed locale components */
  parsed: ParsedLocale;
}

/**
 * Integration with next-intl
 */
export interface NextIntlIntegration {
  type: 'next-intl';
  /** next-intl middleware function */
  middleware?: any;
  /** next-intl configuration */
  config?: {
    routing?: {
      locales: string[];
      defaultLocale: string;
      localePrefix?: 'always' | 'as-needed' | 'never';
    };
  };
}

/**
 * Integration with next-i18next
 */
export interface NextI18nextIntegration {
  type: 'next-i18next';
  /** next-i18next configuration */
  config?: {
    i18n?: {
      locales: string[];
      defaultLocale: string;
      domains?: Array<{
        domain: string;
        defaultLocale: string;
      }>;
    };
  };
}

/**
 * Custom i18n integration
 */
export interface CustomI18nIntegration {
  type: 'custom';
  /** Custom locale detection function */
  detectLocale?: (req: NextRequest) => Promise<string | null> | string | null;
  /** Custom path rewriting function */
  rewritePath?: (path: string, locale: string) => string;
  /** Custom redirect logic */
  shouldRedirect?: (currentLocale: string, detectedLocale: string) => boolean;
}

/**
 * Union of all i18n integration types
 */
export type I18nIntegration =
  | NextIntlIntegration
  | NextI18nextIntegration
  | CustomI18nIntegration;
