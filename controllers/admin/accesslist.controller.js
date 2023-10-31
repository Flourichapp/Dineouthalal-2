const { makeDb } = require("../../_helpers/db");

module.exports.createAccesslist = async (req, res) => {
  const connection = makeDb();

  const { screen_name, url, subscreen, parent_screen } = req.body;
  if (!screen_name || screen_name == null) {
    res.status(403).json({
      statusCode: 403,
      message: "Screen name is required !",
    });
  } else {
    var slug = screen_name.replace(/\s+/g, "-").toLowerCase(); // all spaces to the slug;
    connection.query(
      `INSERT INTO access_lists (screen_name,url,slug,subscreen,parent_screen) VALUES (?,?,?,?,?) `,
      [screen_name, url, slug, subscreen, parent_screen]
    );
    res.status(201).json({
      statusCode: 201,
      message: "Data created successfully",
    });
    connection.close();
  }
};
module.exports.updateAccesslist = async (req, res) => {
  const connection = makeDb();
  let { id } = req.query
  const { screen_name, url, subscreen, parent_screen, is_deleted } = req.body;
  if (!screen_name || screen_name == null) {
    res.status(403).json({
      statusCode: 403,
      message: "Screen name is required !",
    });
  } else if (!id || id == null) {
    res.status(403).json({
      statusCode: 403,
      message: "Id is missing !",
    });
  } else {
    var slug = screen_name.replace(/\s+/g, "-").toLowerCase();
    connection.query(
      `UPDATE access_lists SET screen_name = ?, url = ?, slug =? , subscreen = ?, parent_screen = ? , is_deleted = ? where id = ? `,
      [screen_name, url, slug, subscreen, parent_screen, is_deleted,id]
    );
    res.status(200).json({
      statusCode: 200,
      message: "Data update successfully",
    });
    connection.close();
  }
};
module.exports.deleteAccesslist = async (req, res) => {
  const connection = makeDb();
  const {id} = req.query
  if(!id || !id == null){
      res.status(403).json({
      statusCode: 403,
      message: "Id is missing !",
    });
  }else{
    connection.query(`DELETE FROM access_lists WHERE id = ?`,[id]);
    res.status(204).json({
      statusCode: 204,
      message: "Data deleted successfully",
    });
    connection.close();
  }

};
module.exports.getAccesslist = async (req, res) => {
  const connection = makeDb();
  const { pageIndex = null, pageSize = null } = req.query;

  let data;
  let count = 0;

  if (pageIndex >= 0 && pageSize) {
    let offset = parseInt(pageIndex) * parseInt(pageSize);
    data = await connection.query(
      `SELECT * from access_lists LIMIT ${offset},${pageSize}`
    );
  } else {
    data = await connection.query(`SELECT * from access_lists`);
  }

  count = await connection.query(`SELECT COUNT(*) as count from access_lists`);

  if (count.length) {
    count = count[0].count;
  }

  res.status(200).json({
    statusCode: 200,
    message: "Data featched successfully",
    data,
    count: count,
  });
  connection.close();
};
module.exports.getAccesslistById = async (req, res) => {
  const connection = makeDb();
  const { id } = req.query;

  let data;
  if (id) {
    data = await connection.query(
      `SELECT * from access_lists WHERE id = ?`,[id]
    );
    connection.close();
    res.status(200).json({
      statusCode: 200,
      message: "Data fetched successfully",
      data: data.length ? data[0] : {},
    });
  } else {
    res.status(404).json({
      statusCode: 404,
      message: "AccessList id required",
    });
  }
};
