const jwt = require("jsonwebtoken");
const {jwt_secret} = require('../env')

const Authorized = async (req, res, next) => {
 
  let token;

  let authHeader = req.headers.Authorization || req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer")) {
    token = authHeader.split(" ")[1];
    jwt.verify(token, jwt_secret, (err, decoded) => {
        req.id = decoded.id
        next();
      if (err) {
        res.status(401);
       res.json({"message":"User untauthorized"})
      }
     
    });
    
    
  }else{
        res.status(401);
       res.json({"message":"User is not authorized or token is missing"})
   
  }
};

module.exports = Authorized;