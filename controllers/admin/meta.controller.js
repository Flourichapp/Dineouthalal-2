const { makeDb } = require("../../_helpers/db");
const createMetaData = async (req, res) => {
  const { title, meta, routename } = req.body;
 
  const metaData = JSON.stringify(meta);
  const connection = makeDb();
  try {
    if (
      !title ||
      title == null ||
      !meta ||
      meta == null ||
      !routename ||
      routename == null
    ) {
      res.status(403);
      res.json({
        statusCode: 403,
        message: "All fields are required !",
      });
    } else {
      await connection.query(
        `INSERT INTO page_wise_meta (title,meta,route_name) VALUES(?,?,?)
         `,[title,metaData,routename]
      );
      res.status(201);
      res.json({
        statusCode: 201,
        message: "Data created successfully",
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500);
    res.json({
      statusCode: 500,
      message: "Internal Error",
      error: err,
    });
  }
  connection.close();
};
const updateMeta = async (req, res) => {
  const { title, meta, routename } = req.body;
  const {id} = req.params
  const metaData = JSON.stringify(meta);
  const connection = makeDb();
  await connection.query(
    `UPDATE page_wise_meta SET title = ? , meta = ? , route_name = ? WHERE id = ?`,[title,metaData,routename,id]
  );
  res.status(200);
  res.json({
    statusCode: 200,
    message: "Data updated successfully",
  });
  connection.close();
};
const getMetaData = async (req, res) => {
  const { all_pageIndex, all_pageSize } = req.query;
  var offset2 = parseInt(all_pageIndex) * parseInt(all_pageSize);
  const connection = makeDb();
  const data = await connection.query(
    `SELECT * FROM page_wise_meta LIMIT ${offset2},${all_pageSize}`
  );
  const totalcount = await connection.query(
    `SELECT COUNT(*) as count FROM page_wise_meta`
  );
  res.status(200);
  res.json({
    statusCode: 200,
    message: "Data fetched successfully",
    data,
    count: totalcount[0].count,
  });
  connection.close();
};

const DeleteMetadata = async (req, res) => {
  const connection = makeDb();
  const { id } = req.params;
  if (!id || id == null) {
    res.status(404);
    res.json({
      statusCode: 404,
      message: "id is missing !",
    });
    connection.close();
  } else {
    const data = await connection.query(
      `DELETE FROM page_wise_meta WHERE id = ?`,
      [id]
    );
    res.status(204);
    res.json({
      statusCode: 204,
      message: "Data deleted successfully",
      data,
    });
    connection.close();
  }
};

module.exports = { createMetaData, updateMeta, getMetaData, DeleteMetadata };
