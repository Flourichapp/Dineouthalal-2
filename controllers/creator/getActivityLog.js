const { makeDb } = require("../../_helpers/db");
module.exports.getActivityLog = async (req, res) => {
  const { pageIndex, pageSize } = req.query;
  // console.log(pageIndex, pageSize);
  var offset = parseInt(pageIndex) * parseInt(pageSize);
  const connection = makeDb();
  let rows = await connection.query(
    `SELECT * FROM activity_log ORDER BY activity_time DESC LIMIT ?,? `,
    [offset, parseInt(pageSize)]
  );
  let total = await connection.query(
    `SELECT count(*) as count from activity_log`
  );
  res.status(200);
  res.json({
    statusCode: 200,
    message: "Data fetched successfully",
    rows,
    total: total[0].count,
  });
  connection.close();
};
module.exports.getActivitySearch = async (req, res) => {
  const connection = makeDb();
  const { search, pageIndex, pageSize } = req.query;
  var offset = parseInt(pageIndex) * parseInt(pageSize);
  let rows = await connection.query(
    `SELECT * FROM activity_log WHERE title REGEXP '.*${search}' OR description REGEXP '.*${search}' 
    OR user_id REGEXP '.*${search}' OR user_id REGEXP '.*${search}' OR ipaddress REGEXP '.*${search}' ORDER BY activity_time  LIMIT ${offset}, ${parseInt(pageSize)}`,
    
  );
  let total = await connection.query(`SELECT count(*) as count FROM activity_log WHERE title REGEXP '^${search}' OR description REGEXP '.*${search}' 
  OR user_id REGEXP '.*${search}' OR user_id REGEXP '.*${search}' OR ipaddress REGEXP '.*${search}' ORDER BY activity_time`)
  res.json({
    statusCode: 200,
    message: "Data fetched successfully",
    rows,
    total: total[0].count,
  });
  connection.close()
};
// work done