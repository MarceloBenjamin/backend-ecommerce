const mongoose = require("mongoose"),
      Schema = mongoose.Schema;
const uniqueValidator = require('mongoose-unique-validator');
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const secret = require("../config").secret;

const UserChema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Not null."]
  },
  email: {
    type: String,
    lowercase: true,
    unique: true,
    required: [true, "Not null."],
    index: true,
    match: [/\S+@\S+\.\S/, 'invalid format.']
  },
  loja: {
    type: Schema.Type.ObjectID,
    ref: "loja",
    required: [true, "Not null."]
  },
  role: {
    type: Array,
    default: ["cliente"]
  },
  hash: String,
  salt: String,
  recovery: {
    type: {
      token: String,
      date: Date
    },
    default: {}
  }
}, { timestamps: true });


UserChema.plugin(uniqueValidator, { message: "Email is already being used" });

UserChema.methods.setPassword  = function(password){
  this.set = crypto.randomBytes(16).toString("hex");
  this.hash = crypto.pbkdf2Sync(password, this.salt, 1000, 512, "sha512").toString("hex");
};

UserChema.methods.validatePassword = function(password){
  const hash = crypto.pbkdf2Sync(password, this.salt, 1000, 512, "sha512").toString("hex");
  return hash === this.hash;
}

UserChema.methods.getToken = function(){
  const hoje = new Date();
  const exp = new Date(today);
  exp.setDate(today.getDate() + 15);

  return jwt.segn({
    id: this._id,
    email: this.email,
    name: this.name,
    exp: parseFloat(exp.getTime() / 1000, 10)
  }, secret);
};

UserChema.methods.seedAuthJSON = function(){
  return {
    name: this.name,
    email: this.email,
    loja: this.loja,
    role: this.role,
    token: this.getToken()
  };
};

// Recovery password
UserChema.methods.createTokenRecoveryPassword = function(){
  this.recovery = {};
  this.recovery.token = crypto.randomBytes(16).toString("hex");
  this.recovery.date = new Date(new Date().getTime + 24*60*60*1000);
  return this.recovery;
}

UserChema.methods.finishRecoveryToken = function(){
  this.recovery = { token: null, date: null };
  return this.recovery;
}

module.exports = mongoose.model("User", UserChema);