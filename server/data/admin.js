const bcrypt = require('bcryptjs')

let salt = bcrypt.genSaltSync(10)
let hash = bcrypt.hashSync('toto13!', salt)

module.exports = {
  "title": "mr",
  "firstname": "Greg",
  "lastname":"Croods",
  "picture":"https://randomuser.me/api/portraits/med/men/65.jpg",
  "dob":"28/05/1987",
  "address": {
    "email":"gcrood@outlook.fr",
    "street": "lieu-dit du Par Ailleurs",
    "city":"DeParIci",
    "state":"Deux-Sèvres",
    "postcode":"79100",
    "phone": "0699669966"
  },
  "login":{
    "username":"admin",
    "password": hash
  },
  "registered":"1941-03-29T04:47:46.198Z"
}
