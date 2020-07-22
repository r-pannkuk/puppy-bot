const date = require('date-and-time');

/**
 * Ensures proper formatting for a date string.
 * @param {string} string Formats a date string to be proper for Date conversions.
 * @returns {string} The input formatted properly.
 */
function convertProperDateString(string) {
    return string.replace(/([[1-9]*[0-9])((st)|(nd)|(rd)|(th))/g, "$1");
}

class TimeExtract {
    constructor(string, timezone = null) {
        this.timezone = timezone;
        string = convertProperDateString(string);

        if (string.length > 0) {
            this.inverted = string[0] == '-';
        } else {
            this.inverted = false;
        }

        if (this.inverted) {
            this.time_string = string.substring(1);
        } else {
            this.time_string = string;
        }

        var delimeterMatch = string.match(/([0-9]+y)|([0-9]+mo)|([0-9]+w)|([0-9]+d)|([0-9]+h)|([0-9]+m)|([0-9]+s)/g);

        if (delimeterMatch && delimeterMatch.length > 0) {
            this.process_type = TimeExtract.Types.DISPLACEMENT;
        } else if (parseInt(string) || string.indexOf('/') >= 0 || string.indexOf(':') >= 0) {
            this.process_type = TimeExtract.Types.EXPLICIT;
        }
    }

    static validate_time_string(str) {
        if (str === undefined || str === '') {
            return false;
        }

        str = convertProperDateString(str);

        // Checking if there's nothing but duration tokens in the string.
        var stripped = str.trim().replace(/([0-9]+y)|([0-9]+mo)|([0-9]+w)|([0-9]+d)|([0-9]+h)|([0-9]+m)|([0-9]+s)/g, '');

        var int = parseInt(str);

        // Converting to milliseconds
        if (int && int < 999999999999) {
            int *= 1000;
        }

        // Checking if the string makes a valid date object.
        var date = (int && new Date(int)) || new Date(str);

        return (stripped.length === 0) || (date instanceof Date && !isNaN(date.getTime()));
    }

    static time_string_to_object() {
        var tokens = this.time_string.match(/[a-z]+|[^a-z]+/gi);
        var obj = {};

        for (var i in tokens) {
            var token = tokens[i].toLowerCase();

            if (token === 's') {
                obj.seconds = value;
            } else if (token === 'm') {
                obj.minutes = value;
            } else if (token === 'h') {
                obj.hours = value;
            } else if (token === 'd') {
                obj.days = value;
            } else if (token === 'w') {
                obj.weeks = value;
            } else if (token === 'mo') {
                obj.months = value;
            } else if (token === 'y') {
                obj.years = value;
            } else {
                try {
                    value = parseInt(token);
                } catch (ValueError) {
                    throw InvalidTime();
                }
            }
        }

        return obj;
    }

    /**
     * Processes the time_string and extracts a date from it.
     */
    extract() {
        var currentOffset = this._process_spaceless();

        var d = new Date();

        if (this.inverted) {
            d.setTime(d.getTime() - currentOffset.getTime());
        } else {
            d.setTime(d.getTime() + currentOffset.getTime());
        }

        return d;
    }

    interval() {
        var currentOffset = this._process_spaceless();

        return currentOffset.getTime();
    }

    _process_spaceless() {
        if (this.process_type === TimeExtract.Types.EXPLICIT) {
            var d = this._process_explicit();
            return d;
        } else {
            var d = this._process_displacement();
            return d;
        }
    }

    /**
     * processing times that dictate a specific time
     */
    _process_explicit() {
        var date = ((parseInt(this.time_string)) ? new Date(parseInt(this.time_string)) : new Date(this.time_string));
        return new Date(date.getTime() - Date.now());
    }

    /**
     * processing times that dictate a time relative to now
     */
    _process_displacement() {
        var currentOffset = new Date(0);
        var value = 0;

        var tokens = this.time_string.match(/[a-z]+|[^a-z]+/gi);

        for (var i in tokens) {
            var token = tokens[i].toLowerCase();

            if (token === 's') {
                currentOffset.setSeconds(currentOffset.getSeconds() + value);
            } else if (token === 'm') {
                currentOffset.setMinutes(currentOffset.getMinutes() + value);
            } else if (token === 'h') {
                currentOffset.setHours(currentOffset.getHours() + value);
            } else if (token === 'd') {
                currentOffset.setDate(currentOffset.getDate() + value);
            } else if (token === 'w') {
                currentOffset.setDate(currentOffset.getDate() + value * 7);
            } else if (token === 'mo') {
                currentOffset.setMonth(currentOffset.getMonth() + value);
            } else if (token === 'y') {
                currentOffset.setMonth(currentOffset.getMonth() + value * 12);
            } else {
                value = parseInt(token);
                if (value === null) {
                    throw InvalidTime();
                }
            }
        }

        return currentOffset;
    }
}

TimeExtract.Types = {
    EXPLICIT: 0,
    DISPLACEMENT: 1
};

module.exports = TimeExtract;