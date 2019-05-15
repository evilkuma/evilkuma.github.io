
const MongoClient = require('mongodb').MongoClient

const config = {
    host: 'localhost',
    port: 27017,
    db: 'artIndustry'
}

let db
new MongoClient(`mongodb://${config.host}:${config.port}/`, { useNewUrlParser: true }).connect(function(err, client){
    if(err) {
        return console.log(err)
    }

    db = client.db(config.db)
});

// work with user collection
const user = {
    get({params, callback}) {
        const collection = db.collection('users')
        collection.findOne(params, (err, result) => {
            callback(result)
        })
    },
    add({params, callback}) {
        const collection = db.collection('users')
        collection.insertOne(params, (err, result) => {
            if(err) callback(false)
            else callback(result.ops)
        })
    },
    toString(key) {
        key += ''
        while(key.length < 5) key = '0' + key
        return key
    }
}

const room = {
    add({callback = null} = {}) {
        const collection = db.collection('rooms')
        var a = collection.aggregate([
            {
                $group: {
                    _id: null,
                    max: {
                      $max: '$key'
                    }
                }
            }
        ]).toArray(function(err, docs) {
            if(err) callback(false)
            else {
                const key = +docs[0].max + 1
                collection.insertOne({key, secure: false}, (err, result) => {
                    if(err) callback(false)
                    else callback(result.ops[0])
                })
            }
        })
    },
    get({params, callback}) {
        const collection = db.collection('rooms')
        collection.findOne(params, (err, result) => {
            if(err) callback(false)
            callback(result)
        })
    }
}

exports.user = user
exports.room = room
