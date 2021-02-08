
const username = process.env.MONGO_USERNAME
const mongo_password = process.env.MONGO_PASSWORD

const mongoose = require('mongoose');

var uri = "mongodb+srv://"+username+":"+mongo_password+"@cluster0.9l02g.gcp.mongodb.net/portfolio-db?retryWrites=true&w=majority"

try {
mongoose.connect( uri, {useNewUrlParser: true, useUnifiedTopology: true}, () =>
console.log("Connected"));    
}catch (error) { 
console.log("Could not connect");  
console.log(error);    
}
const connection = mongoose.connection;
connection.once("open", function() {
    console.log("MongoDB database connection established successfully");
});