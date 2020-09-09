const mongoose = require('mongoose')
const config = require('config')

const connectDB = async () => {
    try {
        await mongoose.connect(config.get('MongoUri'),{
            useUnifiedTopology: true,
            useNewUrlParser: true,
            useCreateIndex: true
        });
        console.log("Database connected")
    } catch (e) {
        console.log("Server error", e.message)
        process.exit(1)
    }
}

module.exports = connectDB;

