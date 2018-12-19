'use strict'

/**
 * Module dependencies.
 * @private
 */
var statuses = require('statuses')

var entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };
  
function escapeHtml (string) {
    return String(string).replace(/[&<>"'`=\/]/g, function (s) {
        return entityMap[s];
    });
}

/**
 * Create a minimal HTML document.
 *
 * @param {string} message
 * @private
 */

function createHtmlDocument(err, status) {
    var body = escapeHtml(err.stack)
        .replace(RegExp(/\n/, 'g'), '<br>')
        .replace(RegExp(/\x20{2}/, 'g'), ' &nbsp;')

    return `<!DOCTYPE html>
        <html>
            <head>
                <meta charset="utf-8">
                <title>Error ${status}</title>
            </head>
            <body>
                <h1><pre>Error ${status}</pre></h1>
                <pre>${err.title}</pre>
                <pre>${body}</pre>
            </body>
        </html>`
}

/**
 * Module exports.
 * @public
 */

module.exports = finalhandler

/**
 * Create a function to handle the final response.
 *
 * @param {Request} req
 * @param {Response} res
 * @param {Object} [options]
 * @return {Function}
 * @public
 */

function finalhandler(ctx) {
    
    return function (err) {
        var headers
        var msg
        var status

        // ignore 404 on in-flight response
        if (!err && ctx.res._header) {
            debug('cannot 404 after headers sent')
            return
        }

        // unhandled error
        if (err) {
            // respect status code from error
            status = getErrorStatusCode(err)

            // respect headers from error
            if (status !== undefined) {
                headers = getErrorHeaders(err)
            }

            // fallback to status code on response
            if (status === undefined) {
                status = getResponseStatusCode(ctx.res)
            }
        } else {
            //not found
            err = new Error('Cannot ' + ctx.req.method + ' ' + ctx.req.url)
            status = 404
        }

        err.title = statuses[status]

        // cannot actually respond
        if (ctx.res._header) {
            ctx.req.socket.destroy()
            return
        }
        
        // send response
        send(ctx, status, err)
    }
}

/**
 * Get headers from Error object.
 *
 * @param {Error} err
 * @return {object}
 * @private
 */

function getErrorHeaders(err) {
    if (!err.headers || typeof err.headers !== 'object') {
        return undefined
    }

    var headers = Object.create(null)
    var keys = Object.keys(err.headers)

    for (var i = 0; i < keys.length; i++) {
        var key = keys[i]
        headers[key] = err.headers[key]
    }

    return headers
}

/**
 * Get status code from Error object.
 *
 * @param {Error} err
 * @return {number}
 * @private
 */

function getErrorStatusCode(err) {
    // check err.status
    if (typeof err.status === 'number' && err.status >= 400 && err.status < 600) {
        return err.status
    }

    // check err.statusCode
    if (typeof err.statusCode === 'number' && err.statusCode >= 400 && err.statusCode < 600) {
        return err.statusCode
    }

    return undefined
}

/**
 * Get status code from response.
 *
 * @param {OutgoingMessage} res
 * @return {number}
 * @private
 */

function getResponseStatusCode(res) {
    var status = res.statusCode

    // default status code to 500 if outside valid range
    if (typeof status !== 'number' || status < 400 || status > 599) {
        status = 500
    }

    return status
}

/**
 * Send response.
 *
 * @param {Context} ctx
 * @param {number} status
 * @param {object} headers
 * @param {string} message
 * @private
 */

function send(ctx, status, err) {
    // response body
    var body = createHtmlDocument(err, status)

    // response status
    ctx.res.statusCode = status
    ctx.res.statusMessage = statuses[status]

    // standard headers
    ctx.res.setHeader('Content-Type', 'text/html; charset=utf-8')
    ctx.res.setHeader('Content-Length', Buffer.byteLength(body, 'utf8'))

    if (ctx.req.method === 'HEAD') {
        ctx.res.end()
        return
    }

    ctx.res.end(body, 'utf8')

}