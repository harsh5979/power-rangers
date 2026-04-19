const mongoose = require('mongoose');

const url = process.env.MONGODB_URI || 'mongodb://localhost:27017/academic_risk_platform';

const connectDb = async () => {
    try {

        await mongoose.connect(url)
        console.log("Database is connected........")

    } catch (error) {
        console.error("database is not connected!!!", error);

    }
}
module.exports = connectDb;