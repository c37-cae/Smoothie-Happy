<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{$name} - v{$version}</title>
        <meta name="keywords" content="{$keywords}">
        <meta name="description" content="{$description}">
        <link rel="stylesheet" type="text/css" href="vendor/bootstrap/css/bootstrap.min.css?v=3.3.5" />
        <link rel="stylesheet" type="text/css" href="style.css?v={$version}&amp;b={$build}" />
    </head>
    <body id="{$id}">
        <nav id="navbar" class="navbar navbar-inverse navbar-fixed-top">
            <div class="container-fluid">
                <div class="navbar-header">
                    <a class="navbar-brand" href="#">{$name} <sup>(v{$version})</sup></a>
                </div>
                <ul class="nav navbar-nav navbar-right">
                    <li><a href="docs/smoothie-happy/{$version}/" target="_blank">Docs</a></li>
                    <li><a href="https://github.com/lautr3k/Smoothie-Happy" target="_blank">GitHub</a></li>
                </ul>
            </div>
        </nav>
        <div id="body" class="row">
            <div class="col-xs-12 col-sm-6 col-md-6">
                <div id="scanner">
                    <h4>
                        HTTP scanner
                        <a class="pull-right" role="button" data-toggle="collapse" href="#com-http-scanner-info" aria-expanded="false" aria-controls="com-http-scanner-info">
                            <i class="fa fa-question-circle-o"></i>
                        </a>
                    </h4>
                    <div class="info well bg-info collapse" id="com-http-scanner-info">
                        <strong>Alowed inputs :</strong><br />
                        Wildcard <code>192.168.1.*</code><br />
                        Single IP <code>192.168.1.100</code><br />
                        IP Range <code>192.168.1.100-120</code><br />
                        Hostname <code>my.smoothie.net</code><br />
                        Mixed <code>192.168.1.100, my.smoothie.net</code>
                    </div>
                    <div class="form-group">
                        <div class="input-group input-group-sm">
                            <span class="input-group-addon"><i class="fa fa-search"></i></span>
                            <input data-bind="value: http_scan_address" type="text" class="form-control" placeholder="192.168.1.*" />
                            <span class="input-group-btn">
                                <button data-bind="visible: !http_scan_run() && !http_scan_aborted(), click: http_start_scan" class="btn btn-sm btn-success" type="button">
                                    Start
                                </button>
                            </span>
                            <span class="input-group-btn">
                                <button data-bind="visible: http_scan_run(), click: http_pause_scan" class="btn btn-sm btn-warning" type="button">
                                    Pause
                                </button>
                            </span>
                            <span class="input-group-btn">
                                <button data-bind="visible: http_scan_aborted(), click: http_resume_scan" class="btn btn-sm btn-success" type="button">
                                    Resume
                                </button>
                            </span>
                            <span class="input-group-btn">
                                <button data-bind="visible: http_scan_run() || http_scan_aborted(), click: http_stop_scan" class="btn btn-sm btn-danger" type="button">
                                    Stop
                                </button>
                            </span>
                            <span class="input-group-btn"></span>
                        </div>
                    </div>

                    <div class="form-group" data-bind="with: http_scann_progression">
                        <span class="label label-default">Total : <span data-bind="text: total">0</span></span>
                        <span class="label label-info">Scanned : <span data-bind="text: scanned">0</span></span>
                        <span class="label" data-bind="css: found === 0 ? 'label-danger' : 'label-success'">Found : <span data-bind="text: found">0</span></span>
                    </div>

                    <div class="progress">
                        <div data-bind="style: { width: http_scann_percent() + '%' }" class="progress-bar progress-bar-striped" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="min-width: 2em;">
                            <span data-bind="text: http_scann_percent() + '%'">0%</span>
                        </div>
                    </div>
                </div><!-- #scanner -->

            </div>
            <div class="col-xs-12 col-sm-6 col-md-6">...</div>
        </div>
        <script src="vendor/jquery.min.js?v=2.2.3"></script>
        <script src="vendor/bootstrap/js/bootstrap.min.js?v=3.3.5"></script>
        <script src="vendor/es6-promise.auto.min.js?v=4.0.3"></script>
        <script src="dist/smoothie-happy.js?v={$version}&amp;b={$build}"></script>
        <script src="examples.js?v={$version}&amp;b={$build}"></script>
    </body>
</html>
