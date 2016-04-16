+function (global) {

    // global namespace
    var sh = {
        version    : '0.0.1-alpha',
        name       : 'Smoothie Happy',
        description: 'Smoothieware network communication API.',
        storage    : true,
        storageId  : 'sh'
    };

    // locale storage shortcut
    sh.store = function(index, value) {
        // no locale storage
        if (!this.storage) return;

        // get the store
        var store = JSON.parse(localStorage.getItem(this.storageId) || '{}');

        // load stored values
        if (! index) {
            for (var index in store) {
                this[index] = store[index];
            }
            return;
        }

        // get old value at index
        var oldValue = store[index] || undefined;

        // store the new value
        if (arguments.length > 1) {
            store[index] = value;
            localStorage.setItem(this.storageId, JSON.stringify(store));
        }

        // return the old value
        return oldValue;
    };

    // initialization message
    console.info(sh.name + ' - v' + sh.version);

    // load local settings
    sh.store();

    // -------------------------------------------------------------------------

    // network namespace
    sh.network = {
        version  : '0.0.1-alpha',
        timeout  : 1000,
        storage  : true,
        storageId: 'sh.network'
    };

    // locale storage shortcut
    sh.network.store = function(index, value) {
        sh.store.call(this, index, value);
    };

    // load local settings
    sh.network.store();

    // http request
    sh.network.request = function(type, uri, data, callback, timeout) {
        var xhr = new XMLHttpRequest();

        xhr.timeout = timeout || this.timeout;

        xhr.addEventListener('load', function() {
            callback && callback('load', xhr);
        });
        xhr.addEventListener('error', function() {
            callback && callback('error', xhr);
        });
        xhr.addEventListener('timeout', function() {
            callback && callback('timeout', xhr);
        });

        if (typeof data !== 'string' || !data.length) {
            data = null;
        }

        if (type === 'GET' && data) {
            uri += data;
            data = null;
        }

        xhr.open(type, uri, true);
        xhr.send(type === 'POST' && data);
    };

    // get request
    sh.network.get = function(uri, data, callback, timeout) {
        sh.network.request('GET', uri, data, callback, timeout);
    };

    // post request
    sh.network.post = function(uri, data, callback, timeout) {
        sh.network.request('POST', uri, data, callback, timeout);
    };

    // get firmaware versions
    sh.network.getEdgeFirmwareCommits = function(callback) {
        var url  = 'https://api.github.com/repos/Smoothieware/Smoothieware/commits';
        var data = '?sha=edge&path=FirmwareBin/firmware.bin';

        this.get(url, data, function(type, xhr) {
            if (type === 'load' && xhr.status === 200) {
                var response = JSON.parse(xhr.response);
                var i, il, commit, sha, commits = {};
                for (i = 0, il = response.length; i < il; i++) {
                    commit = response[i];
                    sha    = commit.parents[0].sha;
                    hash   = sha.substr(0, 7);
                    commits[hash] = i;
                }
                callback(commits);
            }
        });
    };

    // -------------------------------------------------------------------------

    // network scanner
    sh.network.scanner = {
        version   : '0.0.1-alpha',
        timeout   : 1000,
        scanning  : false,
        scanned   : 0,
        total     : 0,
        found     : 0,
        queue     : [],
        boards    : {},
        aborted   : false,
        storage   : true,
        storageId : 'sh.network.scanner',
        input     : '192.168.1.*',
        onStart   : function(queue) {},
        onBoard   : function(board) {},
        onProgress: function(ip, board, self) {},
        onAbort   : function(self) {},
        onResume  : function(self) {},
        onStop    : function(self) {},
        onEnd     : function(found) {}
    };

    // locale storage shortcut
    sh.network.scanner.store = function(index, value) {
        sh.network.store.call(this, index, value);
    };

    // load local settings
    sh.network.scanner.store();

    // scan an IP looking for a SmoothieBoard
    sh.network.scanner.processQueue = function() {
        if (!this.scanning) {
            return false;
        }

        var ip = this.queue.shift();

        if (! ip) {
            this.onEnd(this.found);
            this.scanning = false;
            return true;
        }

        var self  = this;
        var board = null;
        var uri   = 'http://' + ip + '/command';

        console.info('scan:', ip);

        sh.network.post(uri, 'version\n', function(type, xhr) {

            if (type === 'load' && xhr.status === 200) {
                var text = xhr.responseText;

                // expected : Build version: edge-94de12c, Build date: Oct 28 2014 13:24:47, MCU: LPC1769, System Clock: 120MHz
                var matches = text.match(/Build version: (.*), Build date: (.*), MCU: (.*), System Clock: (.*)/);

                if (matches) {
                    // board info
                    var version  = matches[1];
                    var branch   = version.split('-');
                    var hash     = branch[1];
                        branch   = branch[0];
                    var upToDate = sh.firmware.getEdgeCommitPosition(hash);
                    board = {
                        ip      : ip,
                        //version : version,
                        branch  : branch,
                        hash    : hash,
                        upToDate: upToDate,
                        date    : matches[2],
                        mcu     : matches[3],
                        clock   : matches[4]
                    };

                    // ISO date for GitHub update notification
                    // Mar 20 2016 11:51:24 -> 2016-03-20T18:52:15Z
                    board.update = new Date(board.date).toISOString();

                    //console.log(board.update);

                    self.found++;
                    self.boards[ip] = board;
                    self.onBoard(board);
                }
            }

            self.scanned++;
            self.onProgress(ip, board, self);
            self.processQueue();

        }, this.timeout);
    };

    // set timeout
    sh.network.scanner.setTimeout = function(timeout) {
        if (timeout < 100 || timeout > 2000) {
            throw new Error('Timeout is out of range [100, 2000].');
        }
        this.timeout = timeout;
        this.store('timeout', timeout);
    };

    // set the input and compute the scan queue
    sh.network.scanner.setInput = function(input) {
        // reset queue
        this.queue = [];

        // too short or not defined
        if (!input || input.length < 3) {
            throw new Error('Invalid input.');
        }

        // input array
        var inputArray = input;

        // split input on comma if not an array
        if (typeof inputArray === 'string') {
            inputArray = inputArray.split(',');
        }

        // trim input parts
        inputArray = inputArray.map(function(part) {
            return part.trim();
        });

        // for each parts
        for (var y = 0, yl = inputArray.length; y < yl; y++) {
            // current part
            var currentInput = inputArray[y];

            // Wildcard | ex.: [192.168.1.*]
            if (/^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.\*$/.test(currentInput)) {
                var currentInputParts = currentInput.split('.');
                currentInputParts.pop(); // remove last part (*)
                var baseIp = currentInputParts.join('.');
                for (var i = 0; i <= 255; i++) {
                    this.queue.push(baseIp + '.' + i);
                }
            }

            // Single ip | ex.: [192.168.1.55]
            else if (/^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/.test(currentInput)) {
                this.queue.push(currentInput);
            }

            // Ip's range | ex.: [192.168.1.50-100]
            else if (/^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\-[0-9]{1,3}$/.test(currentInput)) {
                var currentInputParts = currentInput.split('.');
                var currentInputRange = currentInputParts.pop().split('-'); // last part (xxx-xxx)
                var baseIp     = currentInputParts.join('.');
                for (var i = currentInputRange[0], il = currentInputRange[1]; i <= il; i++) {
                    this.queue.push(baseIp + '.' + i);
                }
            }

            // Hostname | ex.: [www.host.name]
            else if (/^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/.test(currentInput)) {
                this.queue.push(currentInput);
            }

            // Invalid...
            else {
                throw new Error('Invalid input.');
            }
        }

        // set input
        this.input = input;
        this.store('input', input);

        // return the queue
        return this.queue;
    };

    // scan the network looking for a SmoothieBoard
    sh.network.scanner.scan = function(input, timeout) {
        if (this.scanning) {
            throw new Error('Already in scan mode.');
        }

        input && this.setInput(input);
        timeout && this.setTimeout(timeout);

        this.scanning = true;
        this.aborted  = false;
        this.total    = this.queue.length;
        this.scanned  = 0;
        this.boards   = {};
        this.found    = 0;

        this.onStart(this.queue);
        this.processQueue();
    };

    // stop scanning
    sh.network.scanner.stop = function(silent) {
        if (this.scanning || this.aborted) {
            !silent && this.onStop(this);
            this.scanning = false;
            this.aborted  = false;
            return true;
        }
        return false;
    };

    // abort scanning
    sh.network.scanner.abort = function() {
        if (this.stop(true)) {
            this.aborted = true;
            this.onAbort(this);
            return true;
        }
        return false;
    };

    // resume aborted scanning
    sh.network.scanner.resume = function(timeout) {
        if (this.aborted) {
            timeout && this.setTimeout(timeout);
            this.scanning = true;
            this.aborted = false;
            this.onResume(this);
            this.processQueue();
            return true;
        }
        return false;
    };

    // -------------------------------------------------------------------------

    // firmware namspace
    sh.firmware = {
        version  : '0.0.1-alpha',
        storage  : true,
        storageId: 'sh.firmware',
        edge     : {
            update : 0,
            commits: {}
        }
    };

    // locale storage shortcut
    sh.firmware.store = function(index, value) {
        sh.store.call(this, index, value);
    };

    // load local settings
    sh.firmware.store();

    // update edge firmware commits from the git
    sh.firmware.updateEdgeFirmwareCommits = function() {
        var self = this;
        sh.network.getEdgeFirmwareCommits(function(commits) {
            self.edge.update  = Date.now();
            self.edge.commits = commits;
            self.store('edge', self.edge);
        });
    };

    // return the version position
    sh.firmware.getEdgeCommitPosition = function(hash) {
        if (this.edge.commits[hash] === undefined) {
            return -1;
        }
        return parseInt(this.edge.commits[hash]);
    };

    // -------------------------------------------------------------------------

    // export global namespace
    global.smoothieHappy = sh;

}(window);
