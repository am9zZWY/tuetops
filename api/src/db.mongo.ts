import {mongodb} from "../config/config";
import mongoose from "mongoose";
import {fillDb} from "./fillDb.mongo";

const mongoUri = mongodb.mongoUri

const connectDb = async () => {
    // Create a Mongoose clint with a MongoClientOptions object to set the Stable API version
    await mongoose.connect(mongoUri)
    await mongoose.connection.db.admin().command({ping: 1})
    console.log('Pinged pizza deployment!')
}

export default async function () {
    connectDb()
    return {
        connectDb
    }
}
