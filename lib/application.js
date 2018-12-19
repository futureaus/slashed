
'use strict';

/**
 * Module dependencies.
 */
const middleware = require('./extensions/middleware')
const configure = require('./extensions/configure')
const finalhandler = require('./finalhandler')
const compress = require('koa-compress')
const response = require('./response')
const isJSON = require('koa-is-json')
const context = require('./context')
const request = require('./request')
const Router = require('./router')
const Emitter = require('events')
const Stream = require('stream')
const http = require('http')

/**
 * Expose `Application` class.
 * Inherits from `Emitter.prototype`.
 */
class Application extends Emitter {
    /**
     * Initialize a new `Application`.
     *
     * @api public
     */

    constructor(basedir) {
        super(basedir)

        configure(this, basedir)
        middleware(this)

        this.middleware = []
        this.env = this.get('env:env')
        this.context = Object.create(context)
        this.request = Object.create(request)
        this.response = Object.create(response)

        this.use(compress({threshold: 0}))
    }

    /**
     * Extend the application
     * 
     * @param {function} extendFunction 
     * @param {*} args 
     */
    extend(extendFunction, args) {
        return Object.assign(this, extendFunction(this, args))
    }

    /**
     * Shorthand for:
     *
     *    http.createServer(app.handle()).listen(arguments)
     *
     * @param {Mixed} ...
     * @return {Server}
     * @api public
     */

    listen() {
        var server = http.createServer(this.handle())
        return server.listen(...arguments)
    }

    /**
     * Use the given middleware `fn`.
     *
     * @param {Function} fn
     * @return {Application} self
     * @api public
     */

    use(fn) {
        if (typeof fn !== 'function') throw new TypeError('middleware must be a function!')
        this.middleware.push(fn)
        return this
    }

    /**
     * Return a request handler
     * for node's native http server.
     *
     * @return {Function}
     * @api public
     */

    handle() {
        if (!Array.isArray(this.middleware)) throw new TypeError('Middleware stack must be an array!')
        for (const fn of this.middleware) {
            if (typeof fn !== 'function') throw new TypeError('Middleware must be composed of functions!')
        }

        const handleRequest = async (req, res) => {
            var ctx = this.createContext(req, res)
            try {
                let index = -1

                const dispatch = async(i) => {
                    if (i <= index) throw new Error('next() called multiple times')
                    index = i
                    let fn = this.middleware[i]
                    if (!fn) return
                    return fn(ctx, () => {dispatch(i + 1)})
                }

                await dispatch(0)
                await respond(ctx)
            } catch (err) {
                await finalhandler(ctx)(err)
            }
        }

        return handleRequest
    }

    /**
     * Initialize a new context.
     *
     * @api private
     */

    createContext(req, res) {
        var context = Object.create(this.context)
        var request = context.request = Object.create(this.request)
        var response = context.response = Object.create(this.response)

        context.app = request.app = response.app = this
        context.req = request.req = response.req = req
        context.res = request.res = response.res = res
        request.ctx = response.ctx = context
        request.response = response
        response.request = request
        context.originalUrl = request.originalUrl = req.url
        context.state = {}

        return context
    }

}
/**
 * @returns {Router}
*/
Application.Router = Router

/**
 * Response helper.
 */
function respond(ctx) {
    var res = ctx.res

    let body = ctx.body;

    if ('HEAD' == ctx.method) {
        if (!res.headersSent && isJSON(body)) {
            ctx.length = Buffer.byteLength(JSON.stringify(body));
        }
        return res.end()
    }

    // responses
    if (body === undefined) return finalhandler(ctx)() //404
    if (Buffer.isBuffer(body)) return res.end(body)
    if (typeof body == 'string') return res.end(body)
    if (body instanceof Stream) return body.pipe(res)

    body = JSON.stringify(body)
    if (!res.headersSent) {
        ctx.length = Buffer.byteLength(body)
    }
    res.end(body)
}

module.exports = Application

