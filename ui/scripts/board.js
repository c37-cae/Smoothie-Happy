// -----------------------------------------------------------------------------
// board model
// -----------------------------------------------------------------------------

var BoardModel = function(board) {
    // self alias
    var self = this;

    // sh.Board instance
    self.board = board;

    // get boards names (ip alias)
    var names = store.get('boards.names', {});
    var name  = names[board.address] || board.address;

    // set initial board info
    self.name = ko.observable(name);
    self.info = ko.observable(board.info);

    // set initial board state
    self.online        = ko.observable(board.online);
    self.connected     = ko.observable(board.connected);
    self.waitConnect   = ko.observable(false);
    self.waitLookup    = ko.observable(false);
    self.waitFilesTree = ko.observable(false);
    self.filesTree     = ko.observableArray();
    self.dirsTree      = ko.observableArray();


    // get board tooltip text
    self.tooltip = ko.pureComputed(function() {
        return self.name() == self.board.address
            ? '- You can change this label as you want.<br />- Leave blank to restore default value.'
            : 'Address: ' + self.board.address
    });

    // register some events callbacks
    board.on('connect', function(event) {
        self.updateInfo();
        self.updateState();
    })
    .on('disconnect', function(event) {
        if (self.connected()) {
            $.notify({
                icon: 'fa fa-warning',
                message: 'Loosed connection with ' + self.board.address + '. Reconnection in progress...'
            }, { type: 'danger' });
        }
        self.updateState();
    })
    .on('reconnectAttempt', function(event) {
        // attempts limit
        var limit = 5;

        // notify user
        $.notify({
            icon: 'fa fa-warning',
            message: 'Try to reconnect with ' + self.board.address + '. Attempts: ' + self.board.reconnectAttempts + '/' + limit
        }, { type: 'info' });

        // disconnect the board after x attempts
        if (self.board.reconnectAttempts == limit) {
            self.disconnect();
        }
    })
    .on('error', function(event) {
        //console.error('on.error:', event);
        self.updateState();
    });
};

BoardModel.prototype.changeName = function(board, event) {
    // make the names object
    var names = {};

    // get new name
    var newName = this.name().trim();
        newName = newName.length ? newName : this.board.address;

    // assign new name
    names[this.board.address] = newName;

    // merge in names list
    store.merge('boards.names', names);

    // update name (if empty)
    this.name(newName);

    // fix tooltip title
    $(event.target).attr({ 'data-original-title': this.tooltip() });
};

BoardModel.prototype.updateState = function() {
    this.connected(this.board.connected);
    this.online(this.board.online);
};

BoardModel.prototype.updateInfo = function() {
    this.info(this.board.info);
};

BoardModel.prototype.connect = function() {
    // self alias
    var self = this;

    // set we wait for connection
    self.waitConnect(true);

    // try to connect to the board
    self.board.connect().then(function(event) {
        self.updateInfo();
        return event;
    })
    .catch(function(event) {
        $.notify({
            icon: 'fa fa-warning',
            message: 'Unable to connect the board at ' + self.board.address
        }, { type: 'danger' });
        return event;
    })
    .then(function(event) {
        self.updateState();
        self.waitConnect(false);
    });
};

BoardModel.prototype.disconnect = function() {
    this.connected(false);
    this.board.disconnect();
};

BoardModel.prototype.lookup = function() {
    // self alias
    var self = this;

    // set we wait for lookup
    self.waitLookup(true);

    // try to get board version
    self.board.version().then(function(event) {
        self.updateInfo();
        return event;
    })
    .catch(function(event) {
        $.notify({
            icon: 'fa fa-warning',
            message: 'Unable to reach the board at ' + self.board.address
        }, { type: 'warning' });
        return event;
    })
    .then(function(event) {
        self.updateState();
        self.waitLookup(false);
    });
};

BoardModel.prototype._makeFileNode = function(node) {
    var isFile = node.type == 'file';
    var icon   = isFile ? 'file' : 'folder';

    node = {
        text        : node.name || '/',
        icon        : 'fa fa-' + icon + '-o',
        selectedIcon: 'fa fa-' + icon,
        node        : node
    };

    node.tags = [
        'size: ' + node.node.size
    ];

    return node;
};

BoardModel.prototype._makeFilesTree = function(nodes) {
    // some variables
    var node  = null;
    var tree  = [];
    var dirs  = [];
    var files = [];

    // find a parent node...
    var findParentNode = function(s, n) {
        for (var o, i = 0, il = s.length; i < il; i++) {
            o = s[i];

            if (o.node.path == n.node.root) {
                if (! o.nodes) {
                    o.nodes = [];
                }
                return o;
            }
        }
        return null;
    }

    // first pass, normalize nodes
    for (var i = 0, il = nodes.length; i < il; i++) {
        node = nodes[i];

        tree.push(this._makeFileNode(node));

        if (node.type == 'file') {
            files.push(this._makeFileNode(node));
        }
        else {
            dirs.push(this._makeFileNode(node));
        }
    }

    // second pass, push childs into parents nodes
    function makeTree(s) {
        for (var i = s.length - 1; i >= 0; i--) {
            // current node
            node = s[i];

            // find parent node
            var parentNode = findParentNode(s, node);

            if (parentNode) {
                // extract node from tree
                node = s.splice(i, 1)[0];

                // move node to parent nodes list
                parentNode.nodes.push(node);
            }
        }

        return s;
    }

    tree = makeTree(tree);
    dirs = makeTree(dirs);

    // console.log(nodes);
    // console.log(tree);
    return {
        tree : tree,
        dirs : dirs,
        files: files
    };
};

BoardModel.prototype._populateFilesTree = function(board, event) {
    var dirsTree  = this.dirsTree();
    var filesTree = this.filesTree();

    $('#board-dirs-tree').treeview({
        data          : dirsTree,
        levels        : 10,
        showTags      : true,
        onNodeSelected: function(event, node) {
            console.log(node.text);
        }
    });

    $('#board-files-tree').treeview({ data: filesTree, showTags: true });
};

BoardModel.prototype.refreshFilesTree = function(board, event) {
    // self alias
    var self = this;

    // set we wait for files list
    self.waitFilesTree(true);

    var filesTree = null;
    var dirsTree  = null;

    // get all files or directories
    self.board.lsAll().then(function(event) {
        //console.info('lsAll:', event.name, event.data);
        var ft = self._makeFilesTree(event.data);
        filesTree = ft.files;
        dirsTree  = ft.dirs;
    })
    .catch(function(event) {
        //console.error('lsAll:', event.name, event);
    })
    .then(function(event) {
        self.updateState();
        self.dirsTree(dirsTree);
        self.filesTree(filesTree);
        self.waitFilesTree(false);
        self._populateFilesTree();
    });
};
