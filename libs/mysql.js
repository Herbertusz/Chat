/*!
 * MySQL adatbázis-kezelő modul
 * Függőségek:
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
 * Paraméterek:
 *  Opcionális paraméterek esetén ha valamelyiket használni akarjuk, az előtte lévőket mind meg kell adni.
 *  Ez alól kivétel a callback függvény.
 */

'use strict';

const mysql = require('mysql');

const DB = {

    /**
     * DB-kapcsolat
     * @type Object
     */
    connection : null,

    /**
     * Utoljára futtatott SQL lekérdezés (bind paraméterekkel)
     * @type String
     */
    rawsql : null,

    /**
     * Utoljára futtatott SQL lekérdezés (escape-elt)
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
     *     charset : 'utf8_unicode_ci'
     * }
     */
    connect : function(connectionData){
        const db = this;

        db.connection = mysql.createConnection(connectionData);
        db.connection.connect();

        db.connection.config.queryFormat = function(query, values){
            if (!values) return query;
            query = query.replace(/::(\w+)/g, function(txt, key){
                if (values.hasOwnProperty(key)){
                    return this.escapeId(values[key]);
                }
                return txt;
            }.bind(this));
            query = query.replace(/:(\w+)/g, function(txt, key){
                if (values.hasOwnProperty(key)){
                    return this.escape(values[key]);
                }
                return txt;
            }.bind(this));
            return query;
        };

        return new Promise(function(resolve, reject){
            return resolve(db);
        });
    },

    /**
     * Lekapcsolódás adatbázisról
     */
    close : function(){
        this.connection.end();
    },

//    /**
//     * Legutóbbi lekérdezés által lekérdezett sorok száma
//     * A query("SELECT ...") alakú hívás üríti, a get*() függvények feltöltik
//     * @returns int lekérdezett sorok száma
//     */
//    numRows : function(){
//        hits = false;
//        if (this.command === 'SELECT'){
//            $hits = count(self::$statement->fetchAll(PDO::FETCH_ASSOC));
//        }
//        return $hits;
//    }
//
//    /**
//     * Legutóbbi lekérdezés által módosított sorok száma
//     * @returns int érintett sorok száma
//     */
//    affectedRows(){
//        $hits = false;
//        if (self::$command == 'INSERT' || self::$command == 'UPDATE' || self::$command == 'DELETE'){
//            $hits = self::$statement->rowCount();
//        }
//        return $hits;
//    }
//
//    /**
//     * Legutóbb beszúrt autoincrement mező értéke
//     * @returns int|bool autoincrement érték vagy false ha nem létezik a tábla
//     */
//    insertId(){
//        $id = false;
//        if (self::$command == 'INSERT'){
//            $id = self::$pdo->lastInsertId();
//        }
//        return $id;
//    }

    /**
     * Eredménytáblát ad vissza 2D-s tömbként (a sor az első kulcs)
     * @param {String} sql lekérdezés
     * @param {Array} binds bindelő tömb
     * @returns {Promise}
     */
    getRows : function(sql, binds){
        return this.query(sql, binds);
    },

//    /**
//     * Eredménytábla egy sorát adja vissza 1D-s tömbként
//     * @param string $sql lekérdezés
//     * @param array $binds bindelő tömb
//     * @param int $rownum sor sorszáma
//     * @returns array sor
//     */
//    public static function getRow($sql, $binds = array(), $rownum = 0){
//        self::query($sql, $binds);
//        $rows = self::$statement->fetchAll(PDO::FETCH_ASSOC);
//        self::$num_rows = count($rows);
//        return $rows[$rownum];
//    }
//
//    /**
//     * Eredménytáblát ad vissza 2D-s tömbként (az oszlop az első kulcs)
//     * @param string $sql lekérdezés
//     * @param array $binds bindelő tömb
//     * @returns array lekérdezés eredménye elforgatva
//     */
//    public static function getColumns($sql, $binds = array()){
//        self::query($sql, $binds);
//        $rows = self::$statement->fetchAll(PDO::FETCH_ASSOC);
//        self::$num_rows = count($rows);
//        $cols = Func::array_rotate($rows);
//        return $cols;
//    }
//
//    /**
//     * Eredménytábla egy oszlopát adja vissza 1D-s tömbként
//     * @param string $sql lekérdezés
//     * @param array $binds bindelő tömb
//     * @param string $colname oszlop neve
//     * @returns array oszlop
//     */
//    public static function getColumn($sql, $binds = array(), $colname = ""){
//        self::query($sql, $binds);
//        $rows = self::$statement->fetchAll(PDO::FETCH_ASSOC);
//        self::$num_rows = count($rows);
//        $col = Func::array_rotate($rows, $colname);
//        return $col;
//    }
//
//    /**
//     * Eredménytábla egy mezőjét adja vissza
//     * @param string $sql lekérdezés
//     * @param array $binds bindelő tömb
//     * @param string $colname oszlop neve
//     * @param int $rownum sor sorszáma
//     * @returns string mezőben tárolt érték
//     */
//    public static function getField($sql, $binds = array(), $colname = "", $rownum = 0){
//        self::query($sql, $binds);
//        $rows = self::$statement->fetchAll(PDO::FETCH_ASSOC);
//        self::$num_rows = count($rows);
//        $field = $rows[$rownum][$colname];
//        return $field;
//    }
//
//    /**
//     * Egyetlen mező értékét adja vissza
//     * @param string $table tábla
//     * @param string $field oszlopnév
//     * @param string $where feltétel
//     * @param array $binds bindelő tömb
//     * @returns string|bool mezőben tárolt érték vagy false
//     */
//    public static function field($table, $field, $where, $binds = array()){
//        $sql = "SELECT `$field` FROM `$table` WHERE $where";
//        self::query($sql, $binds);
//        $row = self::$statement->fetch(PDO::FETCH_ASSOC);
//        if (isset($row[$field])){
//            return $row[$field];
//        }
//        else {
//            return false;
//        }
//    }

    /**
     * INSERT futtatása
     * @param {String} table
     * @param {Object} data
     * @param {Function} [callback=function(){}] lefutás után meghívandó függvény
     * @returns {String} nyers lekérdezés
     */
    insert : function(table, data, callback){
        var sql;
        callback = (typeof callback !== 'undefined') ? callback : () => {};

        sql = `
            INSERT INTO
                \`${table}\`
            (
                \`${Object.keys(data).join("`,`")}\`
            ) VALUE (
                :${Object.keys(data).join(",:")}
            )
        `;
        return this.query(sql, data, callback);
    },

    /**
     * UPDATE futtatása
     * @param {String} table
     * @param {Object} data
     * @param {String} where
     * @param {Object|Function} [args]
     * @description args:
     *  {Object} [binds={}]
     *  {Function} [callback=function(){}] lefutás után meghívandó függvény
     * @returns {String} nyers lekérdezés
     */
    update : function(table, data, where, ...args){
        const rows = [];
        const binds = (typeof args[0] !== 'undefined') ? args[0] : {};
        const callback = (typeof args[args.length - 1] === 'function') ? args[args.length - 1] : () => {};

        data.forEach(function(value, col){
            rows.push(`\`${col}\` = :${col}`);
        });
        const sql = `
            UPDATE
                \`${table}\`
            SET
                ${rows.join(",")}
            WHERE
                ${where}
        `;
        return this.query(sql, Object.assign(data, binds), callback);
    },

    /**
     * DELETE futtatása
     * @param {String} table
     * @param {String} where
     * @param {Object|Function} [args]
     * @description args:
     *  {Object} [binds={}]
     *  {Function} [callback=function(){}] lefutás után meghívandó függvény
     * @returns {String} nyers lekérdezés
     */
    delete : function(table, where, ...args){
        const binds = (typeof args[0] !== 'undefined') ? args[0] : {};
        const callback = (typeof args[args.length - 1] === 'function') ? args[args.length - 1] : () => {};

        const sql = `
            DELETE FROM
                \`${table}\`
            WHERE
                ${where}
        `;
        return this.query(sql, binds, callback);
    },

//    /**
//     * Statement következő iterációja 1D-s tömbként
//     * @param object $statement
//     * @returns array következő sor
//     */
//    public static function fetch_assoc($statement = null){
//        if (!isset($statement)){
//            $statement = self::$statement;
//        }
//        $row = $statement->fetch(PDO::FETCH_ASSOC);
//        return $row;
//    }

    /**
     * Lekérdezés előkészítése és futtatása
     * @param {String} sql lekérdezés (bindelés esetén "... :name1 ... :name2 ...")
     * @param {Object|Boolean|Function} [args]
     *  {Object} [binds={}] bindelő tömb ({'name1' : '...', 'name2' : '...'})
     *  {Boolean} [run=true] futtatás (ha false, nem lesz lefuttatva, csak előkészítve)
     *  {Function} [callback=function(){}] lefutás után meghívandó függvény
     * @returns {Promise}
     */
    query : function(sql, ...args){

        var temp_sql, temp_command;
        const binds = (typeof args[0] !== "undefined") ? args[0] : {};
        const run = (typeof args[1] !== "undefined") ? args[1] : true;
        const callback = (typeof args[args.length - 1] === 'function') ? args[args.length - 1] : null;

        this.command = this._getCommand();
        this.rawsql = sql;
        this.sql = mysql.format(sql, binds);

        if (run){
            const connection = this.connection;

            if (callback){
                connection.query(sql, binds, function(error, result){
                    if (error){
                        callback(error);
                    }
                    callback(null, result);
                });
            }
            else {
                return new Promise(function(resolve, reject){
                    connection.query(sql, binds, function(error, result){
                        if (error){
                            return reject(error);
                        }
                        resolve(result);
                    });
                });
            }
        }

    },

    /**
     * Utoljára futtatott SQL parancs meghatározása
     * @returns {String|Boolean} parancs típusa ("SELECT", "INSERT", "UPDATE", "DELETE", ...)
     */
    _getCommand : function(){
        if (this.rawsql){
            return this.rawsql.trim().split(' ')[0].toUpperCase();
        }
        else {
            return false;
        }
    }

};

module.exports = DB;
