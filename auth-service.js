const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

let Schema = mongoose.Schema;

//Define a new "userSchema" 
let userSchema = new Schema({
    userName:{
        type:String,
        unique: true
    },
    password: String,
    email: String,
    loginHistory:[{
        dateTime: Date,
        userAgent: String
    }]
});

//define a User class(object)
let User;

//initialize
module.exports.initialize = function () {
    return new Promise(function (resolve, reject) {
        let db = mongoose.createConnection("mongodb+srv://yzheng103:Zyc45117231@cluster0.dbxcg7v.mongodb.net/?retryWrites=true&w=majority");

        db.on('error', (err)=>{
            reject(err); // reject the promise with the provided error
        });
        db.once('open', ()=>{
           User = db.model("users", userSchema);
           resolve();
        });
    });
};

//register
module.exports.registerUser = function(userData){
    return new Promise(function(resolve, reject){
        if(userData.password != userData.password2){
            reject("Passwords do not match");
        }else{
            bcrypt.hash(userData.password, 10).then((hash)=>{
                userData.password = hash;

                let newUser = new User(userData); 
                newUser.save().then(()=>{
                    resolve();
                    }).catch((err)=>{
                        if(err.code = 11000){
                            reject("User Name already taken");
                        }else {
                            reject("There was an error creating the user:" +err);
                        }
                    });
                }).catch((err)=>{
                    reject("There was an error encrypting the password");
                });
        }
    });
};

//check User
module.exports.checkUser = function(userData){
    return new Promise(function(resolve, reject){
        User.find({userName: userData.userName})
        .exec()
        .then((users)=>{
            if(users.length == 0){
                reject("Unable to find user:" + userData.userName);
            }else{
                bcrypt.compare(userData.password, users[0].password).then((res)=>{
                    if(res === true){
                        users[0].loginHistory.push({dateTime: (new Date()).toString(), userAgent: userData.userAgent});
    
                        User.updateOne({userName: users[0].userName},
                            {$set: {loginHistory: users[0].loginHistory}}
                            ).exec()
                            .then(()=>{
                                resolve(users[0]);
                            })
                            .catch((err)=>{
                                reject("There was an error verifying the user:" + err);
                            })
                    }else{
                        reject("Incorrect Password for user:" + userData.userName);
                    }
                })
            }
        })
        .catch((err)=>{
            reject("Unable to find user: " + userData.userName);
        })
    })
}
