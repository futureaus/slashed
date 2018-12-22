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
  }
  
function escapeHtml (string) {
    return String(string).replace(/[&<>"'`=\/]/g, function (s) {
        return entityMap[s]
    })
}

/**
 * Create a minimal HTML document.
 *
 * @param {string} message
 * @private
 */

function createHtmlDocument(err, status) {
    var body = ''

    let stack = escapeHtml(err.stack)
        .replace(RegExp(/\n/, 'g'), '<br>')
        .replace(RegExp(/\x20{2}/, 'g'), ' &nbsp;')
    
    body += `
        <div>
            <pre>${err.title}</pre>
            <pre>${stack}</pre>
        </div>
    `
    

    return `<!DOCTYPE html>
        <html>
            <head>
                <meta charset="utf-8">
                <title>Error ${status}</title>
            </head>
            <body>
                <h1><pre>Error ${status}</pre></h1>
                ${body}
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

function finalhandler(ctx, err) {
    var status

    if(err){
        if(!(err instanceof Error)) err = new Error('You wrote "throw ' + err + '" somewhere. "' + err + '" is not an instance of Error()')

        // respect status code from error
        if(!status){
            status = getErrorStatusCode(err)
        }
    
        err.title = statuses[status]
    
        // cannot actually respond
        if (ctx.res._header) {
            ctx.req.socket.destroy()
            return
        }
    } else {
        //not found
        err = new Error('Cannot ' + ctx.req.method + ' ' + ctx.req.url)
        status = 404
    }

    // send response
    send(ctx, status, err)
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

    return 500
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