class TimeExtract {
    constructor(string, timezone = null) {
        this.timezone = timezone;

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

        if (string.indexOf('/') >= 0 || string.indexOf(':') >= 0) {
            this.process_type = TimeExtract.Types.EXPLICIT;
        } else {
            this.process_type = TimeExtract.Types.DISPLACEMENT;
        }
    }

    static validate_time_string(str) {
        var stripped = "".replace(' ', '');
        return true;
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
                }
                catch (ValueError) {
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
        return new Date(this.time_string);
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