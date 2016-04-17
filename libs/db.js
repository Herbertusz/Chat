/*!
 * Adatbázis-kezelő modul
 * Függőségek:
 *  HD.Function
 *  vargs (https://github.com/cloudhead/vargs)
 *  mysql (https://github.com/felixge/node-mysql)
 *
 * Használat:
 *  Kapcsolat:
 *   DB.connect('host', 'user', 'pass', 'dbname');
 *   DB.close();
 *  Lekérdezés futtatása:
 *   sql = DB.query("lekérdezés", binds = {}, run = true, preserve = false, callback(error, result));
 *  Eredménytábla lekérdezése:
 *   sql = DB.getRows("SELECT ...", binds = {}, callback(error, rows));
 *   sql = DB.getRow("SELECT ...", binds = {}, rownum = 0, callback(error, row));
 *   sql = DB.getColumns("SELECT ...", binds = {}, callback(error, columns));
 *   sql = DB.getColumn("SELECT ...", binds = {}, columnName, callback(error, column));
 *   sql = DB.getField("SELECT ...", binds = {}, columnName, rownum = 0, callback(error, field));
 *  Mező lekérdezése:
 *  Eredmény iteráció:
 *   DB.query("SELECT ...", ..., function(error, result){
 *       while (row = DB.fetch()){ ... }
 *   });
 *  Shortcut műveletek:
 *   sql = DB.insert(table, array(columnName => value, ...), callback(error, insertId));
 *   sql = DB.update(table, array(columnName => value, ...), where, binds = {}, callback(error, affectedRows));
 *   sql = DB.delete(table, where, binds = {}, callback(error, affectedRows));
 *   sql = DB.field(table, columnName, where, binds = {}, callback(error, field));
 *  Utility-k:
 *   DB.numRows();
 *   DB.affectedRows();
 *   DB.insertId();
 *   DB.countRows(table, where = null, binds = {}, callback(error, count));
 */

'use strict';

var Args = require('vargs').Constructor;
var mysql = require('mysql');

var DB = {

	/**
	 * DB-kapcsolat
	 * @type Object
	 */
	connection : null,

	/**
	 * Utoljára futtatott SQL lekérdezés
	 * @type String
	 */
	sql : null,

	/**
	 * Utoljára futtatott SQL parancs ("SELECT", "INSERT", "UPDATE", "DELETE", ...)
	 * @type Boolean|String
	 */
	command : false,

	/**
	 * Kapcsolódás adatbázishoz
	 * @param {Object} connectionData
	 * @description
	 * connectionData = {
	 *     host : 'localhost',
	 *     user : 'root',
	 *     password : '',
	 *     database : 'nodejs',
	 *     charset : 'utf8_hungarian_ci'
	 * }
	 */
	connect : function(connectionData){
		this.connection = mysql.createConnection(connectionData);
		this.connection.connect();

		this.connection.config.queryFormat = function(query, values){
			if (!values) return query;
			query = query.replace(/\:\:(\w+)/g, function(txt, key){
				if (values.hasOwnProperty(key)){
					return this.escapeId(values[key]);
				}
				return txt;
			}.bind(this));
			query = query.replace(/\:(\w+)/g, function(txt, key){
				if (values.hasOwnProperty(key)){
					return this.escape(values[key]);
				}
				return txt;
			}.bind(this));
			return query;
		};
	},

	/**
	 * Lekapcsolódás adatbázisról
	 */
	close : function(){
		this.connection.end();
	},

//	/**
//	 * Legutóbbi lekérdezés által lekérdezett sorok száma
//	 * A query("SELECT ...") alakú hívás üríti, a get*() függvények feltöltik
//	 * @returns int lekérdezett sorok száma
//	 */
//	numRows : function(){
//		hits = false;
//		if (this.command === 'SELECT'){
//			$hits = count(self::$statement->fetchAll(PDO::FETCH_ASSOC));
//		}
//		return $hits;
//	}
//
//	/**
//	 * Legutóbbi lekérdezés által módosított sorok száma
//	 * @returns int érintett sorok száma
//	 */
//	affectedRows(){
//		$hits = false;
//		if (self::$command == 'INSERT' || self::$command == 'UPDATE' || self::$command == 'DELETE'){
//			$hits = self::$statement->rowCount();
//		}
//		return $hits;
//	}
//
//	/**
//	 * Legutóbb beszúrt autoincrement mező értéke
//	 * @returns int|bool autoincrement érték vagy false ha nem létezik a tábla
//	 */
//	insertId(){
//		$id = false;
//		if (self::$command == 'INSERT'){
//			$id = self::$pdo->lastInsertId();
//		}
//		return $id;
//	}
//
//	/**
//	 * A tábla sorainak száma (nem módosítja a statement értékét)
//	 * @param {String table tábla neve
//	 * @param {String where where feltétel (csak azokat a sorokat számolja, amelyekre teljesül)
//	 * @param {Object} binds bindelő objektum
//	 * @returns int|bool sorok száma vagy false ha nem létezik a tábla
//	 */
//	countRows : function(table, where, binds){
//		where = HD.Function.param(where, null);
//		binds = HD.Function.param(binds, {});
//		var rownum = false;
//		var temp_res = this.statement;
//		if (where){
//			rownum = this.getField("SELECT COUNT(*) AS `count` FROM `$table` WHERE $where", "count", 0, binds);
//		}
//		else{
//			rownum = this.getField("SELECT COUNT(*) AS `count` FROM `$table`", "count", 0, binds);
//		}
//		this.statement = temp_res;
//		return rownum;
//	},
//
//	/**
//	 * Eredménytáblát ad vissza 2D-s tömbként (a sor az első kulcs)
//	 * @param string $sql lekérdezés
//	 * @param array $binds bindelő tömb
//	 * @returns array(array) lekérdezés eredménye
//	 */
//	public static function getrows($sql, $binds = array()){
//		self::query($sql, $binds);
//		$rows = self::$statement->fetchAll(PDO::FETCH_ASSOC);
//		self::$num_rows = count($rows);
//		return $rows;
//	}
//
//	/**
//	 * Eredménytábla egy sorát adja vissza 1D-s tömbként
//	 * @param string $sql lekérdezés
//	 * @param array $binds bindelő tömb
//	 * @param int $rownum sor sorszáma
//	 * @returns array sor
//	 */
//	public static function getrow($sql, $binds = array(), $rownum = 0){
//		self::query($sql, $binds);
//		$rows = self::$statement->fetchAll(PDO::FETCH_ASSOC);
//		self::$num_rows = count($rows);
//		return $rows[$rownum];
//	}
//
//	/**
//	 * Eredménytáblát ad vissza 2D-s tömbként (az oszlop az első kulcs)
//	 * @param string $sql lekérdezés
//	 * @param array $binds bindelő tömb
//	 * @returns array lekérdezés eredménye elforgatva
//	 */
//	public static function getcolumns($sql, $binds = array()){
//		self::query($sql, $binds);
//		$rows = self::$statement->fetchAll(PDO::FETCH_ASSOC);
//		self::$num_rows = count($rows);
//		$cols = Func::array_rotate($rows);
//		return $cols;
//	}
//
//	/**
//	 * Eredménytábla egy oszlopát adja vissza 1D-s tömbként
//	 * @param string $sql lekérdezés
//	 * @param array $binds bindelő tömb
//	 * @param string $colname oszlop neve
//	 * @returns array oszlop
//	 */
//	public static function getcolumn($sql, $binds = array(), $colname = ""){
//		self::query($sql, $binds);
//		$rows = self::$statement->fetchAll(PDO::FETCH_ASSOC);
//		self::$num_rows = count($rows);
//		$col = Func::array_rotate($rows, $colname);
//		return $col;
//	}
//
//	/**
//	 * Eredménytábla egy mezőjét adja vissza
//	 * @param string $sql lekérdezés
//	 * @param array $binds bindelő tömb
//	 * @param string $colname oszlop neve
//	 * @param int $rownum sor sorszáma
//	 * @returns string mezőben tárolt érték
//	 */
//	public static function getfield($sql, $binds = array(), $colname = "", $rownum = 0){
//		self::query($sql, $binds);
//		$rows = self::$statement->fetchAll(PDO::FETCH_ASSOC);
//		self::$num_rows = count($rows);
//		$field = $rows[$rownum][$colname];
//		return $field;
//	}
//
//	/**
//	 * Egyetlen mező értékét adja vissza
//	 * @param string $table tábla
//	 * @param string $field oszlopnév
//	 * @param string $where feltétel
//	 * @param array $binds bindelő tömb
//	 * @returns string|bool mezőben tárolt érték vagy false
//	 */
//	public static function field($table, $field, $where, $binds = array()){
//		$sql = "SELECT `$field` FROM `$table` WHERE $where";
//		self::query($sql, $binds);
//		$row = self::$statement->fetch(PDO::FETCH_ASSOC);
//		if (isset($row[$field])){
//			return $row[$field];
//		}
//		else{
//			return false;
//		}
//	}

	/**
	 * INSERT futtatása
	 * @param {String} table
	 * @param {Object} data
	 * @param {Function} [callback=function(){}] lefutás után meghívandó függvény
	 * @returns {String} nyers lekérdezés
	 */
	insert : function(table, data, callback){
		var args = new Args(arguments);
		callback = args.callback;

		var sql = "\
			INSERT INTO\
				`" + table + "`\
			(\
				`" + Object.keys(data).join("`,`") + "`\
			) VALUE (\
				:" + Object.keys(data).join(",:") + "\
			)\
		";
		return this.query(sql, data, callback);
	},

	/**
	 * UPDATE futtatása
	 * @param {String} table
	 * @param {Object} data
	 * @param {String} where
	 * @param {Object} [binds={}]
	 * @param {Function} [callback=function(){}] lefutás után meghívandó függvény
	 * @returns {String} nyers lekérdezés
	 */
	update : function(table, data, where, binds, callback){
		var args = new Args(arguments);
		binds = (typeof args.all[2] !== "undefined") ? args.all[2] : {};
		callback = args.callback;

		var rows = [], sql;
		data.forEach(function(value, col){
			rows.push("`" + col + "` = :" + col);
		});
		sql = "\
			UPDATE\
				`" + table + "`\
			SET\
				" + rows.join(",") + "\
			WHERE\
				" + where + "\
		";
		return this.query(sql, Object.assign(data, binds), callback);
	},

	/**
	 * DELETE futtatása
	 * @param {String} table
	 * @param {String} where
	 * @param {Object} [binds={}]
	 * @param {Function} [callback=function(){}] lefutás után meghívandó függvény
	 * @returns {String} nyers lekérdezés
	 */
	delete : function(table, where, binds, callback){
		var args = new Args(arguments);
		binds = (typeof args.all[2] !== "undefined") ? args.all[2] : {};
		callback = args.callback;

		var sql = "\
			DELETE FROM\
				`" + table + "`\
			WHERE\
				" + where + "\
		";
		return this.query(sql, binds, callback);
	},

//	/**
//	 * Statement következő iterációja 1D-s tömbként
//	 * @param object $statement
//	 * @returns array következő sor
//	 */
//	public static function fetch_assoc($statement = null){
//		if (!isset($statement)){
//			$statement = self::$statement;
//		}
//		$row = $statement->fetch(PDO::FETCH_ASSOC);
//		return $row;
//	}

	/**
	 * Lekérdezés előkészítése és futtatása
	 * @param {String} sql lekérdezés (bindelés esetén "... :name1 ... :name2 ...")
	 * @param {Object} [binds={}] bindelő tömb ({'name1' : '...', 'name2' : '...'})
	 * @param {Boolean} [run=true] futtatás (ha false, nem lesz lefuttatva, csak előkészítve)
	 * @param {Boolean} [preserve=false] legutóbbi lekérdezés adatait tároló változók megőrzése
	 * @param {Function} [callback=function(){}] lefutás után meghívandó függvény
	 * @returns {String} nyers lekérdezés
	 */
	query : function(sql, binds, run, preserve, callback){

		var args = new Args(arguments);
		sql = args.all[0];
		binds = (typeof args.all[1] !== "undefined") ? args.all[1] : {};
		run = (typeof args.all[2] !== "undefined") ? args.all[2] : true;
		preserve = (typeof args.all[3] !== "undefined") ? args.all[3] : false;
		callback = args.callback;

		var sql, temp_sql, temp_command;

		if (preserve){
			temp_sql = this.sql;
			temp_command = this.command;
		}

		//this.sql = mysql.format(sql, binds);
		//this.command = this._getCommand();
		//sql = this.sql;

		this.sql = sql;

		if (run){
			this.connection.query(this.sql, binds, function(error, result){
				if (error){
					callback(error);
				}
				callback(null, result);
			});
		}

		if (preserve){
			this.sql = temp_sql;
			this.command = temp_command;
		}

		return sql;
	},

	/**
	 * Utoljára futtatott SQL parancs meghatározása
	 * @returns {String|Boolean} parancs típusa ("SELECT", "INSERT", "UPDATE", "DELETE", ...)
	 */
	_getCommand : function(){
		if (this.sql){
			return this.sql.trim().split(' ')[0].toUpperCase();
		}
		else{
			return false;
		}
	}

};

module.exports = DB;
