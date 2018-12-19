'use strict'

module.exports = function(app){
    var middlewares = app.get('middleware') || {}
    
    function getMiddleware(name){
        try {
            var middleware = middlewares.middleware[name];
            var middlewaremodule = middleware.module;
            
            if(app.isSolvable(middlewaremodule)){
                return require(app.get(middlewaremodule));
            }
            
            return require(middlewaremodule);
        } catch (e) {
            e.code = 'MIDDLEWARE_NOT_FOUND';
            throw e;
        }
    }
    
    function getMiddlewareGroup(middlewaregroup){
        for(var middleware in group){
            array.push(app.getmiddleware(group[middleware]));
        }
    
        return array.length > 0 ? array : [()=>{}];
    }

    return {
        getMiddleware: getMiddleware,
        getMiddlewareGroup: getMiddlewareGroup
    }
}
