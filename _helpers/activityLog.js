const { makeDb } = require("../_helpers/db");
const requestIp = require("request-ip");
module.exports.createLog = (
  title,
  description,
  ref_id,
  user_type,
  user_id,
  name,
  request
) => {
  const connection = makeDb();
  var clientIp = requestIp.getClientIp(request);
  connection.query(
    `INSERT INTO activity_log (title,description,ref_id,user_type,user_id,name,ipaddress) VALUES(?,?,?,?,?,?,?)`
  ,[title, description, ref_id, user_type, user_id, name, clientIp]);
  connection.close()
};

