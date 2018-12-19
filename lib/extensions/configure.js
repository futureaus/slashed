'use strict'

var path = require('path')

module.exports = function(app, basedir){
    
    var appvars = {}
    set('basedir', basedir)
    var envvars = getenvvars(get('path:.env')) || {}
    
    
    function get(setting) {
        if(isSolvable(setting)){
            return solve(setting)
        }
    
        if(typeof appvars[setting] !== 'undefined'){
            return appvars[setting]
        }
    
        if(typeof envvars[setting] !== 'undefined'){
            return envvars[setting]
        }
    
        return searchConfig(setting)
    }
    
    function set(setting, value) {
        appvars[setting] = value
        return value
    }
    
    function searchConfig(setting) {
        try {
            var lookup = setting.split('.')
            var file = lookup.shift()
            var config = require(path.resolve(get('path:config'), file + '.js'))
            var result = lookup.reduce(function (prev, curr) {
                return prev ? prev[curr] : undefined
            }, config || self)
            return recursiveSearch(result)
        } catch (e) {
            if (e.code == 'MODULE_NOT_FOUND') {
                return
            }
            throw e
        }
    
    }

    function recursiveSearch(object){
        if(isSolvable(object)){
            return solve(object)
        }
        var solution = {}

        if(typeof object === 'object' && Object.keys(object).length >= 1){
            for(var x in object){
                solution[x] = recursiveSearch(object[x])
            }
        }
        
        if(Object.keys(solution).length === 0){
            return object
        }

        return solution
    }
    
    function isSolvable(problem) {
        return typeof problem === 'string' && problem.split(":").length > 1
    }
    
    function solve(problem) {
        var ors = problem.split('|')
        var solution
    
        for (var arr in ors) {
            if (isSolvable(ors[arr])) {
                var arrayproblem = ors[arr].split(":")
                var method = arrayproblem[0]
                var lookup = arrayproblem[1]
    
                solution = handleSolution(method, lookup)
                if (typeof solution === 'undefined') continue
                break
            }
            solution = arr
            break
        }
        return solution
    }
    
    function handleSolution(method, problem){
        switch(method){
            case 'env':
                return envvars[problem]
            case 'path':
                return path.resolve(get('basedir'), problem)
            case 'config':
                return searchConfig(problem)
        }
        return
    }
    
    function getenvvars(path){
        try{
            var object = {}
            require('fs')
                .readFileSync(path, 'utf8')
                .split(require('os').EOL)
                .map(function(line){
                    var split = line.split('=')
                    object[split[0]] = split[1]
                })
            return object
        }catch(e){
            console.log('no .env file found')
        }
    }

    app.get = get
    app.set = set
    app.isSolvable = isSolvable
    
}