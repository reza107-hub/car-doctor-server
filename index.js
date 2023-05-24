const express = require('express');
const cors = require('cors');
const app = express()
const port = process.env.PORT || 5000
const jwt = require('jsonwebtoken')

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

require('dotenv').config()

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
    res.send('hello')
})

app.post('/jwt', (req, res) => {
    const user = req.body
    const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '1h'
    })
    res.send({ token })
})

const verifyJwt = (req, res, next) => {
    const authorization = req.headers.authorization
    if (!authorization) {
        return res.status(401).send({ error: true, message: 'Unauthorize access' })
    }
    const token = authorization.split(' ')[1]
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ error: true, message: 'unauthorized access' })
        }
        req.decoded = decoded
        next()
    })
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tfxumrl.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        const serviceCollection = client.db('carDoctor').collection('services')
        const bookingsCollection = client.db('carDoctor').collection('bookings')

        app.get('/services', async (req, res) => {
            const search = req.query.search
            const sort = req.query.sort
            
            const query = { title: { $regex: search, $options: 'i' } }
            const options = {
                sort: { "price": sort === 'asc' ? -1 : 1 }
            }
            const result = await serviceCollection.find(query, options).toArray()
            res.send(result)
        })
        app.get('/services/:id', async (req, res) => {
            const query = { _id: new ObjectId(req.params.id) }
            const result = await serviceCollection.findOne(query)
            res.send(result)
        })

        app.get('/booking', verifyJwt, async (req, res) => {
            const decoded = req.decoded
            if (decoded.email !== req.query.email) {
                return res.status(401).send({ error: true, message: 'unauthorized access' })
            }
            let query = {};
            if (req.query?.email) {
                query = { email: req.query.email }
            }
            const result = await bookingsCollection.find(query).toArray()
            res.send(result)
        })

        app.post('/booking', async (req, res) => {
            const booking = req.body
            const result = await bookingsCollection.insertOne(booking)
            res.send(result)
        })

        app.patch('/booking/:id', async (req, res) => {
            const id = req.params.id
            const filter = { _id: new ObjectId(id) }
            const updateBody = req.body
            const updateDoc = {
                $set: {
                    status: updateBody.status
                }
            }
            const result = await bookingsCollection.updateOne(filter, updateDoc)
            res.send(result)
        })

        app.delete('/booking/:id', async (req, res) => {
            const query = { _id: new ObjectId(req.params.id) }
            const result = await bookingsCollection.deleteOne(query)
            res.send(result)
        })

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.listen(port)