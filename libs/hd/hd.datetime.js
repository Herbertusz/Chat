/*!
 * HD-keret DateTime v1.1.0
 * 2015.12.16.
 */

/* global HD */

"use strict";

var HD = global.HD || {};

/**
 * Dátum műveletek (Date objektum kiegészítései)
 * @type {Object}
 */
HD.DateTime = {

    /**
     * Hónapok nevei
     * @type {Array}
     */
    months : [
        "január", "február", "március", "április", "május", "június", "július",
        "augusztus", "szeptember", "október", "november", "december"
    ],

    /**
     * Hónapok sorszámai
     * @type {Array}
     */
    monthSigns : ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"],

    /**
     * Napok nevei
     * @type {Array}
     */
    days : ["vasárnap", "hétfő", "kedd", "szerda", "csütörtök", "péntek", "szombat"],

    /**
     * Napok rövid nevei
     * @type {Array}
     */
    shortDays : ["V", "H", "K", "Sze", "Cs", "P", "Szo"],

    /**
     * yyyy-mm-dd forma előállítása
     * @param {Date} date JS dátum objektum
     * @param {String} separator elválasztó
     * @returns {String}
     */
    progFormat : function(date, separator){
        if (typeof separator === "undefined") separator = "-";
        const y = date.getFullYear();
        const m = this.monthSigns[date.getMonth()];
        const d = HD.Number.fillZero(date.getDate(), 2);
        return y + separator + m + separator + d;
    },

    /**
     * Jelenlegi év
     * @returns {Number}
     */
    getCurrentYear : function(){
        return parseInt((new Date()).getFullYear());
    },

    /**
     * Jelenlegi hét sorszáma
     * @returns {Number}
     */
    getCurrentWeekOfYear : function(){
        const d = new Date();
        d.setHours(0, 0, 0);
        d.setDate(d.getDate() + 7 - (d.getDay() || 7));
        return Math.ceil((((d - new Date(d.getFullYear(), 0, 1)) / 86400000) + 1) / 7);
    },

    /**
     * Adott nap az év hanyadik hetében van
     * @param {Number} year
     * @param {Number} month (0-11)
     * @param {Number} day (1-31)
     * @returns {Number}
     */
    getWeekOfYear : function(year, month, day){
        year = parseInt(year);
        month = parseInt(month);
        day = parseInt(day);
        const d = new Date(year, month, day, 0, 0, 0);
        d.setDate(day + 7 - (d.getDay() || 7));
        return Math.ceil((((d - new Date(year, 0, 1)) / 86400000) + 1) / 7);
    },

    /**
     * Az adott hét napjai Date objektumok formájában
     * @param {Number} [year]
     * @param {Number} [week]
     * @returns {Object}
     */
    getDaysOfYearWeek : function(year, week){
        if (typeof year === "undefined") year = (new Date()).getFullYear();
        if (typeof week === "undefined") year = this.getCurrentWeekOfYear();
        const dayMS = 86400000;
        const d = new Date(`Jan 01, ${year} 01:00:00`);
        const corr = (d.getDay() || 7) - 1;
        const w = d.getTime() + (7 * (week - 1) - corr) * dayMS;
        return {
            "H"   : new Date(w),
            "K"   : new Date(w + dayMS),
            "Sze" : new Date(w + 2 * dayMS),
            "Cs"  : new Date(w + 3 * dayMS),
            "P"   : new Date(w + 4 * dayMS),
            "Szo" : new Date(w + 5 * dayMS),
            "V"   : new Date(w + 6 * dayMS)
        };
    },

    /**
     * Idő beolvasása
     * @param {String} str időt leíró string (formátum: "hh:mm:ss"|"mm:ss"|"ss")
     * @param {String} [from="s"] bemenet utolsó szegmensének mértékegysége ("s"|"m"|"h")
     *                 1 szegmens: "s"|"m"|"h", 2 szegmens: "s"|"m", 3 szegmens: "s"
     * @param {String} [to="s"] visszatérési mértékegység megadása ("ms"|"s"|"m"|"h")
     * @returns {Number} milliszekundumok/másodpercek/percek/órák száma
     */
    parseTime : function(str, from, to){
        if (typeof from === "undefined") from = "s";
        if (typeof to === "undefined") to = "s";
        let h = "00";
        let m = "00";
        let s = "00";
        const segments = str.split(":");
        let ret;
        if (segments.length === 1){
            if (from === "s"){
                s = segments[0];
            }
            else if (from === "m"){
                m = segments[0];
            }
            else {
                h = segments[0];
            }
        }
        else if (segments.length === 2){
            if (from === "s"){
                m = segments[0];
                s = segments[1];
            }
            else if (from === "m"){
                h = segments[0];
                m = segments[1];
            }
            else {
                return null;
            }
        }
        else if (from === "s"){
            h = segments[0];
            m = segments[1];
            s = segments[2];
        }
        else {
            return null;
        }
        const ms = Date.parse(`1 Jan 1970 ${h}:${m}:${s} GMT`);
        ret = null;
        if (to === "ms") ret = ms;
        if (to === "s") ret = Math.round(ms / 1000);
        if (to === "m") ret = Math.round(ms / 60000);
        if (to === "h") ret = Math.round(ms / 3600000);
        return ret;
    },

    /**
     * Idő kiírása olvasható formában
     * @param {Number} num időegység értéke
     * @param {String} from bemenet mértékegysége ("s"|"m"|"h")
     * @param {String} format formátum (makrók: h, m, s, H, M, S, hh, mm, ss)
     * @returns {String} kiírható string
     */
    printTime : function(num, from, format){
        let timeObj, h, m, s;
        if (from === "s") timeObj = new Date(num * 1000);
        if (from === "m") timeObj = new Date(num * 1000 * 60);
        if (from === "h") timeObj = new Date(num * 1000 * 60 * 60);
        h = timeObj.getHours() - 1;
        m = timeObj.getMinutes();
        s = timeObj.getSeconds();
        const H = h;
        const M = h * 60 + m;
        const S = h * 60 * 60 + m * 60 + s;
        const hh = (h < 10) ? `0${h}` : `${h}`;
        const mm = (m < 10) ? `0${m}` : `${m}`;
        const ss = (s < 10) ? `0${s}` : `${s}`;
        h = h.toString(); m = m.toString(); s = s.toString();
        format = format.replace("hh", hh);
        format = format.replace("mm", mm);
        format = format.replace("ss", ss);
        format = format.replace("h", h);
        format = format.replace("m", m);
        format = format.replace("s", s);
        format = format.replace("H", H);
        format = format.replace("M", M);
        format = format.replace("S", S);
        return format;
    },

    /**
     * A PHP date() függvényének implementációja milliszekundumos timestamp-re
     * @param {String} format
     * @param {Number} millitimestamp
     * @returns {String}
     */
    formatMS : function(format, millitimestamp){
        return this.format(format, Math.floor(millitimestamp / 1000));
    },

    /**
     * A PHP date() függvényének implementációja
     * @copyright http://phpjs.org/functions/date
     * @param {String} format
     * @param {Number} timestamp
     * @returns {String}
     */
    format : function(format, timestamp){
        var This = this;
        var jsdate, f;
        // Keep this here (works, but for code commented-out below for file size reasons)
        // var tal= [];
        var txt_words = [
            'Sun', 'Mon', 'Tues', 'Wednes', 'Thurs', 'Fri', 'Satur',
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        // trailing backslash -> (dropped)
        // a backslash followed by any character (including backslash) -> the character
        // empty string -> empty string
        var formatChr = /\\?(.?)/gi;
        var formatChrCb = function(t, s){
            return f[t] ? f[t]() : s;
        };
        var _pad = function(n, c){
            n = String(n);
            while (n.length < c){
                n = `0${n}`;
            }
            return n;
        };
        f = {
            // Day
            d : function(){
                // Day of month w/leading 0; 01..31
                return _pad(f.j(), 2);
            },
            D : function(){
                // Shorthand day name; Mon...Sun
                return f.l().slice(0, 3);
            },
            j : function(){
                // Day of month; 1..31
                return jsdate.getDate();
            },
            l : function(){
                // Full day name; Monday...Sunday
                return `${txt_words[f.w()]}day`;
            },
            N : function(){
                // ISO-8601 day of week; 1[Mon]..7[Sun]
                return f.w() || 7;
            },
            S : function(){
                // Ordinal suffix for day of month; st, nd, rd, th
                var j = f.j();
                var i = j % 10;
                if (i <= 3 && parseInt((j % 100) / 10, 10) === 1){
                    i = 0;
                }
                return ['st', 'nd', 'rd'][i - 1] || 'th';
            },
            w : function(){
                // Day of week; 0[Sun]..6[Sat]
                return jsdate.getDay();
            },
            z : function(){
                // Day of year; 0..365
                var a = new Date(f.Y(), f.n() - 1, f.j());
                var b = new Date(f.Y(), 0, 1);
                return Math.round((a - b) / 864e5);
            },

            // Week
            W : function(){
                // ISO-8601 week number
                var a = new Date(f.Y(), f.n() - 1, f.j() - f.N() + 3);
                var b = new Date(a.getFullYear(), 0, 4);
                return _pad(1 + Math.round((a - b) / 864e5 / 7), 2);
            },

            // Month
            F : function(){
                // Full month name; January...December
                return txt_words[6 + f.n()];
            },
            m : function(){
                // Month w/leading 0; 01...12
                return _pad(f.n(), 2);
            },
            M : function(){
                // Shorthand month name; Jan...Dec
                return f.F()
                    .slice(0, 3);
            },
            n : function(){
                // Month; 1...12
                return jsdate.getMonth() + 1;
            },
            t : function(){
                // Days in month; 28...31
                return (new Date(f.Y(), f.n(), 0))
                    .getDate();
            },

            // Year
            L : function(){
                // Is leap year?; 0 or 1
                var j = f.Y();
                return j % 4 === 0 & j % 100 !== 0 | j % 400 === 0;
            },
            o : function(){
                // ISO-8601 year
                var n = f.n();
                var W = f.W();
                var Y = f.Y();
                return Y + (n === 12 && W < 9 ? 1 : n === 1 && W > 9 ? -1 : 0);
            },
            Y : function(){
                // Full year; e.g. 1980...2010
                return jsdate.getFullYear();
            },
            y : function(){
                // Last two digits of year; 00...99
                return f.Y()
                    .toString()
                    .slice(-2);
            },

            // Time
            a : function(){
                // am or pm
                return jsdate.getHours() > 11 ? 'pm' : 'am';
            },
            A : function(){
                // AM or PM
                return f.a().toUpperCase();
            },
            B : function(){
                // Swatch Internet time; 000..999
                var H = jsdate.getUTCHours() * 36e2;
                // Hours
                var i = jsdate.getUTCMinutes() * 60;
                // Minutes
                // Seconds
                var s = jsdate.getUTCSeconds();
                return _pad(Math.floor((H + i + s + 36e2) / 86.4) % 1e3, 3);
            },
            g : function(){
                // 12-Hours; 1..12
                return f.G() % 12 || 12;
            },
            G : function(){
                // 24-Hours; 0..23
                return jsdate.getHours();
            },
            h : function(){
                // 12-Hours w/leading 0; 01..12
                return _pad(f.g(), 2);
            },
            H : function(){
                // 24-Hours w/leading 0; 00..23
                return _pad(f.G(), 2);
            },
            i : function(){
                // Minutes w/leading 0; 00..59
                return _pad(jsdate.getMinutes(), 2);
            },
            s : function(){
                // Seconds w/leading 0; 00..59
                return _pad(jsdate.getSeconds(), 2);
            },
            u : function(){
                // Microseconds; 000000-999000
                return _pad(jsdate.getMilliseconds() * 1000, 6);
            },

            // Timezone
            e : function(){
                // Timezone identifier; e.g. Atlantic/Azores, ...
                // The following works, but requires inclusion of the very large
                // timezone_abbreviations_list() function.
                /*                            return This.date_default_timezone_get();
                 */
                throw 'Not supported (see source code of date() for timezone on how to add support)';
            },
            I : function(){
                // DST observed?; 0 or 1
                // Compares Jan 1 minus Jan 1 UTC to Jul 1 minus Jul 1 UTC.
                // If they are not equal, then DST is observed.
                var a = new Date(f.Y(), 0);
                // Jan 1
                var c = Date.UTC(f.Y(), 0);
                // Jan 1 UTC
                var b = new Date(f.Y(), 6);
                // Jul 1
                // Jul 1 UTC
                var d = Date.UTC(f.Y(), 6);
                return ((a - c) !== (b - d)) ? 1 : 0;
            },
            O : function(){
                // Difference to GMT in hour format; e.g. +0200
                var tzo = jsdate.getTimezoneOffset();
                var a = Math.abs(tzo);
                return (tzo > 0 ? '-' : '+') + _pad(Math.floor(a / 60) * 100 + a % 60, 4);
            },
            P : function(){
                // Difference to GMT w/colon; e.g. +02:00
                var O = f.O();
                return (O.substr(0, 3) + ':' + O.substr(3, 2));
            },
            T : function(){
                // Timezone abbreviation; e.g. EST, MDT, ...
                // The following works, but requires inclusion of the very
                // large timezone_abbreviations_list() function.
                /*                            var abbr, i, os, _default;
                 if (!tal.length) {
                 tal = This.timezone_abbreviations_list();
                 }
                 if (This.php_js && This.php_js.default_timezone) {
                 _default = This.php_js.default_timezone;
                 for (abbr in tal) {
                 for (i = 0; i < tal[abbr].length; i++) {
                 if (tal[abbr][i].timezone_id === _default) {
                 return abbr.toUpperCase();
                 }
                 }
                 }
                 }
                 for (abbr in tal) {
                 for (i = 0; i < tal[abbr].length; i++) {
                 os = -jsdate.getTimezoneOffset() * 60;
                 if (tal[abbr][i].offset === os) {
                 return abbr.toUpperCase();
                 }
                 }
                 }
                 */
                return 'UTC';
            },
            Z : function(){
                // Timezone offset in seconds (-43200...50400)
                return -jsdate.getTimezoneOffset() * 60;
            },

            // Full Date/Time
            c : function(){
                // ISO-8601 date.
                return 'Y-m-d\\TH:i:sP'.replace(formatChr, formatChrCb);
            },
            r : function(){
                // RFC 2822
                return 'D, d M Y H:i:s O'.replace(formatChr, formatChrCb);
            },
            U : function(){
                // Seconds since UNIX epoch
                return jsdate / 1000 | 0;
            }
        };
        this.date = function(form, stamp){
            This = this;
            if (typeof stamp === "undefined"){
                jsdate = new Date(); // Not provided
            }
            else if (stamp instanceof Date){
                jsdate = new Date(stamp); // JS Date()
            }
            else {
                jsdate = new Date(stamp * 1000); // UNIX timestamp (auto-convert to int)
            }
            return form.replace(formatChr, formatChrCb);
        };
        return this.date(format, timestamp);
    }

};

exports.DateTime = HD.DateTime;
