const express = require('express');
const cors = require('cors');
const app = express()
const port = process.env.PORT || 5000

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

require('dotenv').config()

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
    res.send('hello')
})


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
        await client.connect();

        const serviceCollection = client.db('carDoctor').collection('services')
        const bookingsCollection = client.db('carDoctor').collection('bookings')

        app.get('/services', async (req, res) => {
            const result = await serviceCollection.find().toArray()
            res.send(result)
        })
        app.get('/services/:id', async (req, res) => {
            const query = { _id: new ObjectId(req.params.id) }
            const result = await serviceCollection.findOne(query)
            res.send(result)
        })

        app.get('/booking', async (req, res) => {
            const result = await bookingsCollection.find().toArray()
            res.send(result)
        })

        app.post('/booking', async (req, res) => {
            const booking = req.body
            const result = await bookingsCollection.insertOne(booking)
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