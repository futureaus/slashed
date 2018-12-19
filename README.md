# Slashed

Fast, opinionated, minimalist web framework for nodeJS

## Usage:

```
'use strict'

var slashed = require('slashed')
var router = slashed.Router()

var app = slashed(__dirname)

router.get('/', function(req, res){
    res.send('Hello World')
})

app.use(router)

app.listen(8000)
```

## Configuration
Docs Coming Soon

## Routing
Docs Coming Soon