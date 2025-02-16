import assert from 'assert';
import { cleanRouteAndParams } from './utils.js';
import { ERROR_CODES } from './middleware/errors.js';
import ScopeExpressionTemplate from './expressions.js';
import API from './api.js';
import path from 'path';
import fs from 'fs/promises';
import * as middleware from './middleware/index.js';

export * from './pagination.js';
export * from './error-reply.js';

/**
 * @template {Record<string, any>} TContext
 * @typedef {import('../@types/index.d.ts').APIEntryOptions<TContext>} APIEntryOptions
 */
/**
 * @template {Record<string, any>} TContext
 * @typedef {import('../@types/index.d.ts').APIBuilderOptions<TContext>} APIBuilderOptions
 */

/**
 * @typedef {import('../@types/index.d.ts').StabilityLevel} StabilityLevel
 * @typedef {import('../@types/index.d.ts').APIRequest} APIRequest
 * @typedef {import('../@types/index.d.ts').APIResponse} APIResponse
 */

/**
 * @type {object | null}
 */
let taskclusterVersion = null;
export const loadVersion = async () => {
  if (!taskclusterVersion) {
    const __dirname = new URL('.', import.meta.url).pathname;
    const REPO_ROOT = path.join(__dirname, '../../../');
    const taskclusterVersionFile = path.resolve(REPO_ROOT, 'version.json');

    taskclusterVersion = JSON.parse(await fs.readFile(taskclusterVersionFile, 'utf8'));
  }
  return taskclusterVersion;
};

/**
 * A ping method, added automatically to every service
 * @type {APIEntryOptions<{}>}
 */
const ping = {
  method: 'get',
  route: '/ping',
  name: 'ping',
  stability: 'stable',
  title: 'Ping Server',
  category: 'Monitoring',
  description: [
    'Respond without doing anything.',
    'This endpoint is used to check that the service is up.',
  ].join('\n'),
  handler: function(req, res) {
    res.status(200).json({
      alive: true,
      uptime: process.uptime(),
    });
  },
};

/**
 * A load balancer heartbeat method, added automatically to every service
 * Following Dockerflow standards https://github.com/mozilla-services/Dockerflow/#containerized-app-requirements
 * Can likely remove the /ping endpoint but I left for backwards compatibility
 * @type {APIEntryOptions<{}>}
 */
const lbHeartbeat = {
  method: 'get',
  route: '/__lbheartbeat__',
  name: 'lbheartbeat',
  stability: 'stable',
  title: 'Load Balancer Heartbeat',
  category: 'Monitoring',
  description: [
    'Respond without doing anything.',
    'This endpoint is used to check that the service is up.',
  ].join('\n'),
  handler: function(_req, res) {
    res.json({});
  },
};

/**
 * A version method, added automatically to every service
 * Following Dockerflow standards https://github.com/mozilla-services/Dockerflow/#containerized-app-requirements
 * @type {APIEntryOptions<{}>}
 */
const version = {
  method: 'get',
  route: '/__version__',
  name: 'version',
  stability: 'stable',
  title: 'Taskcluster Version',
  category: 'Monitoring',
  description: [
    'Respond with the JSON version object.',
    'https://github.com/mozilla-services/Dockerflow/blob/main/docs/version_object.md',
  ].join('\n'),
  handler: async function(_req, res) {
    res.json(await loadVersion());
  },
};

/**
 * Create an APIBuilder; see README for syntax
 *
 * @template {Record<string, any>} TContext
 */
export class APIBuilder {
  /**
   * Create an APIBuilder
   * @param {APIBuilderOptions<TContext>} options
   */
  constructor(options) {
    assert(!options.schemaPrefix, 'schemaPrefix is no longer allowed!');
    assert(!options.version, 'version is now apiVersion');
    /** @satisfies {Array<keyof APIBuilderOptions<TContext>>} */
    (['title', 'description', 'serviceName', 'apiVersion']).forEach(function(key) {
      assert(options[key], 'Option \'' + key + '\' must be provided');
    });
    assert(/^[a-z][a-z0-9_-]*$/.test(options.serviceName), `api serviceName "${options.serviceName}" is not valid`);
    assert(/^v[0-9]+$/.test(options.apiVersion), `apiVersion "${options.apiVersion}" is not valid`);
    options = {
      params: {},
      context: [],
      ...options,
      ...{
        errorCodes: {
          ...ERROR_CODES,
          ...(options?.errorCodes || {}),
        },
      },
    };
    // @ts-ignore - we know that options.errorCodes is defined
    Object.entries(options.errorCodes).forEach(([key, value]) => {
      assert(/[A-Z][A-Za-z0-9]*/.test(key), 'Invalid error code: ' + key);
      assert(typeof value === 'number', 'Expected HTTP status code to be int');
    });
    /** @type {string} */
    this.serviceName = options.serviceName;
    this.apiVersion = options.apiVersion;
    this.title = options.title;
    this.description = options.description;
    this.params = options.params;
    this.context = options.context;
    /** @type {import('../@types/index.d.ts').ErrorCodes} */
    this.errorCodes = options.errorCodes;
    /** @type {APIEntryOptions<TContext>[]} */
    this.entries = [ping, lbHeartbeat, version];
    this.hasSchemas = false;
  }

  /**
   * Declare an API end-point entry, where options is on the following form:
   *
   * {
   *   method:   'post|head|put|get|delete',
   *   route:    '/object/:id/action/:param',      // URL pattern with parameters
   *   params: {                                   // Patterns for URL params
   *     param: /.../,                             // Reg-exp pattern
   *     id(val) { return "..." }                  // Function, returns message
   *                                               // if value is invalid
   *     // The `params` option from new API(), will be used as fall-back
   *   },
   *   query: {                                    // Query-string parameters
   *     offset: /.../,                            // Reg-exp pattern
   *     limit(n) { return "..." }                 // Function, returns message
   *                                               // if value is invalid
   *     // Query-string options are always optional (at-least in this iteration)
   *   },
   *   name:     'identifierForLibraries',         // identifier for client libraries
   *   stability: base.API.stability.experimental, // API stability level
   *   scopes:   {AllOf: ['admin', 'superuser']},  // scopes expression (mandatory)
   *                                               // can be empty: null
   *   input:    'input-schema.yaml',              // optional, null if no input
   *   output:   'output-schema.yaml' || 'blob',   // optional, null if no output
   *   skipInputValidation:    true,               // defaults to false
   *   skipOutputValidation:   true,               // defaults to false
   *   title:     "My API Method",
   *   noPublish: true                             // defaults to false, causes
   *                                               // endpoint to be left out of api
   *                                               // references
   *   description: [
   *     "Description of method in markdown, enjoy"
   *   ].join('\n'),
   *   cleanPayload: payload => payload,           // function to 'clean' the payload for
   *                                               // error messages (e.g., remove secrets)
   * }
   *
   * The handler parameter is a normal connect/express request handler, it should
   * return JSON replies with `request.reply(json)` and errors with
   * `request.json(code, json)`, as `request.reply` may be validated against the
   * declared output schema.
   *
   * **Note** the handler may return a promise, if this promise fails we will
   * log the error and return an error message. If the promise is successful,
   * nothing happens.
   *
   * @template {keyof TContext} K
   * @param {APIEntryOptions<TContext>} options
   * @param {(this: Pick<TContext, K>, req: APIRequest, res: APIResponse) => Promise<void>} handler
   */
  declare(options, handler) {
    /** @satisfies {Array<keyof APIEntryOptions<TContext>>} */
    (['name', 'method', 'route', 'title', 'description', 'category']).forEach(function(key) {
      assert(options[key], 'Option \'' + key + '\' must be provided');
    });
    // unlike other options above, scopes is allowed to be null, but not undefined...
    assert.notStrictEqual(options.scopes, undefined);
    // Default to experimental API end-points
    if (!options.stability) {
      options.stability = stability.experimental;
    }
    assert(STABILITY_LEVELS.indexOf(options.stability) !== -1,
      'options.stability must be a valid stability-level, ' +
           'see base.API.stability for valid options');
    options.params = { ...this.params, ...(options.params || {}) };
    options.query = options.query || {};
    Object.entries(options.query).forEach(([key, value]) => {
      if (!(value instanceof RegExp || value instanceof Function)) {
        throw new Error('query.' + key + ' must be a RegExp or a function!');
      }
    });
    assert(!options.deferAuth,
      'deferAuth is deprecated! https://github.com/taskcluster/taskcluster-lib-api#request-handlers');
    if (options.scopes && !ScopeExpressionTemplate.validate(options.scopes)) {
      throw new Error(`Invalid scope expression template: ${JSON.stringify(options.scopes, null, 2)}`);
    }

    assert(!(options.method === 'get' && options.input), "Can't have an `input` with method: 'get'");

    options.handler = handler;
    if (this.entries.filter(entry => entry.route === options.route && entry.method === options.method).length > 0) {
      throw new Error('Identical route and method declaration.');
    }
    if (this.entries.some(entry => entry.name === options.name)) {
      throw new Error('This function has already been declared.');
    }
    // make options.input and options.output relative to the service schemas
    // (<rootUrl>/schemas>/<serviceName>)
    if (options.input) {
      this.hasSchemas = true;
      assert(!options.input.startsWith('http'), 'entry.input should be a filename, not a url');
      options.input = `${this.apiVersion}/${options.input.replace(/\.(ya?ml|json)$/, '.json#')}`;
    }
    if (options.output && options.output !== 'blob') {
      this.hasSchemas = true;
      assert(!options.output.startsWith('http'), 'entry.output should be a filename, not a url');
      options.output = `${this.apiVersion}/${options.output.replace(/\.(ya?ml|json)$/, '.json#')}`;
    }
    this.entries.push(options);
  }

  /**
   * Build an API.
   * @param {import('../@types/index.d.ts').APIOptions<TContext>} options
   */
  async build(options) {
    options.builder = this;
    assert(!options.validator, 'validator is deprecated. use a schemaset instead');
    if (this.hasSchemas) {
      assert(options.schemaset, 'must provide a schemaset if any schemas are used.');
      options.validator = await options.schemaset.validator(options.rootUrl);
    }
    const service = new API(options);
    return service;
  }

  /**
   * Construct the API reference document as a JSON value.
   */
  reference() {
    const reference = {
      $schema: '/schemas/common/api-reference-v0.json#',
      title: this.title,
      description: this.description,
      serviceName: this.serviceName,
      apiVersion: this.apiVersion,
      entries: this.entries.filter(entry => !entry.noPublish).map(entry => {
        const [route, params] = cleanRouteAndParams(entry.route);

        /** @type {Record<string, any>} */
        const retval = {
          type: 'function',
          method: entry.method,
          route: route,
          query: Object.keys(entry.query || {}),
          args: params,
          name: entry.name,
          stability: entry.stability,
          title: entry.title,
          input: entry.input,
          output: entry.output,
          description: entry.description,
          category: entry.category,
        };
        if (entry.scopes) {
          retval.scopes = entry.scopes;
        }
        return retval;
      }),
    };

    return reference;
  }
}

/**
 * Stability levels offered by API method
 *
 * @type {Record<StabilityLevel, StabilityLevel>}
 */
const stability = {
  /**
   * API has been marked for deprecation and should not be used in new clients.
   *
   * Note, documentation string for a deprecated API end-point should outline
   * the deprecation strategy.
   */
  deprecated: 'deprecated',
  /**
   * Unless otherwise stated API may change and resources may be deleted
   * without warning. Often we will, however, try to deprecate the API first
   * and keep around as `deprecated`.
   *
   * **Intended Usage:**
   *  - Prototype API end-points,
   *  - API end-points intended displaying unimportant state.
   *    (e.g. API to fetch state from a provisioner)
   *  - Prototypes used in non-critical production by third parties,
   *  - API end-points of little public interest,
   *    (e.g. API to define workerTypes for a provisioner)
   *
   * Generally, this is a good stability levels for anything under-development,
   * or when we know that there is a limited number of consumers so fixing
   * the world after breaking the API is easy.
   */
  experimental: 'experimental',
  /**
   * API is stable and we will not delete resources or break the API suddenly.
   * As a guideline we will always facilitate gradual migration if we change
   * a stable API.
   *
   * **Intended Usage:**
   *  - API end-points used in critical production.
   *  - APIs so widely used that refactoring would be hard.
   */
  stable: 'stable',
};

// List of valid stability-levels
const STABILITY_LEVELS = Object.values(stability);
APIBuilder.stability = stability;

// Re-export middleware
APIBuilder.middleware = middleware;
