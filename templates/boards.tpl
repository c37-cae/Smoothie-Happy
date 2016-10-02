<div id="boards" class="panel panel-default">
    <div class="panel-heading">
        <h3 class="panel-title">
            <i class="fa fa-rocket"></i> Boards
            <a class="pull-right" role="button" data-toggle="modal" data-target="#boards-help">
                <i class="text-primary fa fa-question-circle-o"></i>
            </a>
        </h3>
    </div>
    <div class="panel-body">
        <!-- ko if: !boards().length && !autoload_addresses().length -->
        <div class="alert alert-warning" role="alert">
            <strong>No boards found!</strong> Please scan the network to find some boards to play with.
        </div>
        <!-- /ko -->
        <!-- ko if: autoload_addresses().length -->
        <div class="alert alert-info" role="alert">
            <i class="fa fa-spinner fa-pulse fa-fw"></i>
            <strong>Please wait...</strong>
            Lookup for known boards
            (
                <span data-bind="text: autoload_progression"></span> /
                <span data-bind="text: known_addresses().length"></span>
            ).
        </div>
        <!-- /ko -->
        <!-- ko if: boards().length -->
        <div data-bind="foreach: { data: boards, afterRender: afterRender }">
            <div data-bind="attr: { id: 'board-' + id }" class="form-group">
                <div class="input-group input-group-sm">
                    <input
                        data-bind="value: ob.name, event: { focusout: ob.changeName }, attr: { title: ob.tooltip }"
                        data-toggle="tooltip"
                        data-placement="top"
                        type="text"
                        class="form-control" />
                    <!-- ko if: ob.online -->
                    <!-- ko ifnot: ob.connected -->
                    <span class="input-group-btn">
                        <button data-bind="disable: ob.wait_connect, click: ob.connect" type="button" class="btn btn-success w100">
                            <i class="fa fa-plug"></i> connect
                        </button>
                    </span>
                    <!-- /ko -->
                    <!-- ko if: ob.connected -->
                    <span class="input-group-btn">
                        <button data-bind="click: ob.disconnect" type="button" class="btn btn-danger w100">
                            <i class="fa fa-plug"></i> disconnect
                        </button>
                    </span>
                    <!-- /ko -->
                    <!-- /ko -->
                    <!-- ko ifnot: ob.online -->
                    <span class="input-group-btn">
                        <button data-bind="disable: ob.wait_lookup, click: ob.lookup" type="button" class="btn btn-warning w100">
                            <i class="fa fa-search"></i> lookup
                        </button>
                    </span>
                    <!-- /ko -->
                    <span class="input-group-btn">
                        <button data-bind="attr: { 'data-target': '#board-' + id + '-info' }" type="button" class="btn btn-info" data-toggle="modal">
                            <i class="fa fa-info-circle"></i>
                        </button>
                    </span>
                </div>
                <div data-bind="attr: { id: 'board-' + id + '-info' }" class="modal fade" tabindex="-1" role="dialog">
                    <div class="modal-dialog" role="document">
                        <div class="modal-content">
                            <div class="modal-header modal-header-info">
                                <button type="button" class="pull-right btn btn-sm btn-info" data-dismiss="modal">
                                    <i class="fa fa-close"></i> Close
                                </button>
                                <h4 class="modal-title">
                                    <i class="fa fa-info-circle"></i> Board info
                                </h4>
                            </div>
                            <div class="modal-body">
                                <!-- ko ifnot: ob.online -->
                                <div class="alert alert-warning" role="alert">
                                    <strong>Oups!</strong> This board seems to be offline. Please, click ont the
                                    <button data-bind="click: ob.lookup" type="button" class="btn btn-sm btn-warning" data-dismiss="modal">
                                        <i class="fa fa-search"></i> lookup
                                    </button> button to try to reach it.
                                </div>
                                <!-- /ko -->
                                <!-- ko if: ob.info -->
                                <table class="table table-bordered">
                                    <tbody data-bind="with: ob.info">
                                        <tr><th>Address</th><td><span data-bind="text: $parent.address"></span></td></tr>
                                        <tr><th>Branch</th><td><span data-bind="text: branch"></span> (#<span data-bind="text: hash"></span>)</td></tr>
                                        <tr><th>Date</th><td><span data-bind="text: date"></span></td></tr>
                                        <tr><th>MCU</th><td><span data-bind="text: mcu"></span> at <span data-bind="text: clock"></span></td></tr>
                                    </tbody>
                                </table>
                                <!-- /ko -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- /ko -->
    </div>
</div>
<!-- #boards -->

<div id="boards-help" class="modal fade" tabindex="-1" role="dialog" aria-labelledby="boards-help-title">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header modal-header-primary">
                <button type="button" class="pull-right btn btn-sm btn-primary" data-dismiss="modal" aria-label="Close">
                    <i class="fa fa-close"></i> Close
                </button>
                <h4 class="modal-title" id="boards-help-title">
                    <i class="fa fa-question-circle-o"></i> Boards
                </h4>
            </div>
            <div class="modal-body">
                <p>Sorry, no help for this section.</p>
            </div>
        </div>
    </div>
</div>
<!-- #boards-help -->
