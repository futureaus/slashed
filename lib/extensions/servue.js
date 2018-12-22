var Servue = require('servue')

module.exports = function(app){
    var servue = new Servue(app.get('basedir'))
    app.servue = servue
    app.use(async (ctx, next) => {
        /**
         * render returns promise to the string which contians the rendered .vue file
         * @param {string} vueFile - path to vue single-file-component
         * @param {Object=} [data={}] - data to be inserted into .vue file when generating renderer
         * @param {boolean=} [hydrate=false] - should hydrate on `.$mount`?
         * @returns {Promise<string>}
         */
        ctx.render = async(vueFile, data, hydrate) => {
            ctx.body = await servue.render(vueFile, data, hydrate)
        }
    
        await next()
    })
}