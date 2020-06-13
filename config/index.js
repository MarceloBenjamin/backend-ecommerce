module.exports = {
  secret: process.env.NODE_ENV === "production" ? process.env.SECRET : "testkey",
  api: process.env.NODE_ENV === "production" ? "http://localhost:3000" : "http://localhost:3000",
  loja: process.env.NODE_ENV === "production" ? "http://localhost:3000" : "http://localhost:8000"
}