const mysql = require('mysql')
const util = require( 'util' );
const { db_host, db_user, db_pwd, db_name, google } = require('../env');

module.exports = {
    makeDb,
    db
};

function makeDb( ) {
  const connection = mysql.createConnection({
    host: db_host,
    user: db_user,
    password: db_pwd,
    database: db_name
})
  return {
    query( sql, args ) {
      return util.promisify( connection.query )
        .call( connection, sql, args );
    },
    close() {
      return util.promisify( connection.end ).call( connection );
    }
  };
}

function db( ) {
    const connection = mysql.createConnection({
      host: db_host,
      user: db_user,
      password: db_pwd,
      database: db_name
     
  });

    return connection;
  }