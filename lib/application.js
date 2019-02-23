'use strict'

/**
 * Module dependencies.
 */
const middleware = require('./extensions/middleware')
const configure = require('./extensions/configure')
const finalhandler = require('./finalhandler')
const servue = require('./extensions/servue')
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
        this._router = new Router()
        this.use = this._router.use.bind(this._router)
        this.context = Object.create(context)
        this.request = Object.create(request)
        this.response = Object.create(response)

        this.extend(servue)
        this.use(compress({threshold: 0}))
    }

    /**
     * Extend the application
     * 
     * @param {function} extendFunction 
     * @param {*} args 
     */
    extend(extendFunction, ...args) {
        return Object.assign(this, extendFunction(this, ...args))
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

    handle() {
        return async (req, res)=>{
            var ctx = this.createContext(req, res)
            try {
                await this._router.handle(ctx)
                await respond(ctx)
            } catch (err) {
                await finalhandler(ctx, err)
            }
        }
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
    let body = ctx.body

    if ('HEAD' == ctx.method) {
        if (!res.headersSent && isJSON(body)) {
            ctx.length = Buffer.byteLength(JSON.stringify(body))
        }
        return res.end()
    }

    // responses
    if (body === undefined) return finalhandler(ctx) //404
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

