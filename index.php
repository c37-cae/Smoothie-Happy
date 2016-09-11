<?php
// -----------------------------------------------------------------------------
// Smoothie-Happy : Source compiler - v0.01-alpha
// -----------------------------------------------------------------------------
// library modules
$modules = ['network', 'board', 'network.scanner'];

// library settings
$settings = [
    'version'     => '0.2.0-dev',
    'build'       => 'auto',
    'date'        => date(DATE_RSS),
    'id'          => 'smoothie-happy',
    'name'        => 'Smoothie-Happy',
    'description' => 'A SmoothieBoard network communication API',
    'author'      => 'Sébastien Mischler (skarab) <sebastien@onlfait.ch>',
    'keywords'    => 'SmoothieBoard, SmoothieWare, Smoothie Firmware, Network, API, js, JavaScript',
    'demo_url'    => 'http://lautr3k.github.io/Smoothie-Happy/',
    'src_url'     => 'https://github.com/lautr3k/Smoothie-Happy',
    'bugs_url'    => 'https://github.com/lautr3k/Smoothie-Happy/issues',
    'git_url'     => 'git://github.com/lautr3k/Smoothie-Happy.git',
    'license'     => 'MIT'
];

// library template
$library_template = './src/smoothie-happy.js';
$library_file     = './dist/smoothie-happy.js';

// index template
$index_template = './index.tpl';
$index_file     = './index.html';

// examples file
$example_file = './main.js';

// docs directory
$docs_directory = './docs';

// cache directory
$cache_directory = './cache';

// =============================================================================
//    !!!    DO NOT EDIT BELOW IF YOU DO NOT KNOW WHAT YOU ARE DOING.    !!!
// =============================================================================

// -----------------------------------------------------------------------------
// Auto set build version based on current time
// -----------------------------------------------------------------------------
if ($settings['build'] === 'auto') {
    $settings['build'] = md5(time());
}

// -----------------------------------------------------------------------------
// User build options
// -----------------------------------------------------------------------------
$noCache = isset($_GET['noCache']);
$noDocs  = isset($_GET['noDocs']);

// -----------------------------------------------------------------------------
// check paths
// -----------------------------------------------------------------------------
// library paths
$library_directory = dirname($library_file);

if (! is_file($library_template)) {
    throw new Exception('$library_template [ ' . $library_template . ' ] is not a file');
}

if (! is_dir($library_directory)) {
    throw new Exception('$library_directory [ ' . $library_directory . ' ] is not a directory.');
}

// index paths
$index_directory = dirname($index_file);

if (! is_file($index_template)) {
    throw new Exception('$index_template [ ' . $index_template . ' ] is not a file');
}

if (! is_dir($index_directory)) {
    throw new Exception('$index_directory [ ' . $index_directory . ' ] is not a directory.');
}

// docs path
if (! is_dir($docs_directory)) {
    throw new Exception('$docs_directory [ ' . $docs_directory . ' ] is not a directory.');
}

// cache path
if (! is_dir($cache_directory)) {
    throw new Exception('$cache_directory [ ' . $cache_directory . ' ] is not a directory.');
}

// examples file
if (! is_file($example_file)) {
    throw new Exception('$example_file [ ' . $example_file . ' ] is not a file');
}

// -----------------------------------------------------------------------------
// replace all tags in input string
// -----------------------------------------------------------------------------
function tags_replace($tags, $str) {
    foreach ($tags as $tag => $value) {
        $str = str_replace('{$' . $tag . '}', $value, $str);
    }
    return $str;
}

// -----------------------------------------------------------------------------
// get cache
// -----------------------------------------------------------------------------
function cache($file, $value = null) {
    global $noCache, $cache_directory;

    if ($noCache) {
        return null;
    }

    $cache_file = $cache_directory . '/' . md5($file);

    if (func_num_args() > 1) {
        file_put_contents($cache_file, json_encode($value));
        is_file($file) and touch($cache_file, filemtime($file));
        return true;
    }

    if (! is_file($cache_file) or filemtime($cache_file) != filemtime($file)) {
        return null;
    }

    return json_decode(file_get_contents($cache_file), true);
}

// -----------------------------------------------------------------------------
// extract examples
// -----------------------------------------------------------------------------
// get cached examples
$examples = cache($example_file);

// rebuild modules
$examples_modules = [];

// no cache or modified
if (! $examples) {
    // examples collection
    $examples    = [];
    $example     = null;
    $section     = null;
    $lastSection = null;
    $commented   = false;

    // get the file contents
    $examples_contents = file_get_contents($example_file);
    $example_lines     = preg_split("/\r\n|\n|\r/", $examples_contents);

    foreach ($example_lines as $line) {
        if (preg_match('/\/\/ ?\-{70,}/', $line)) {
            continue;
        }

        if (preg_match('/^\/\/(\/\/)? +\@example +([^ ]+) +\- +([^\n]+)/', $line, $matches)) {
            $lastSection = $section or $matches[2];
            $section     = $matches[2];
            $title       = trim($matches[3]);
            $commented   = $matches[1] == '//';

            $namesapce = explode('.', $section);
            $namesapce = $namesapce[1];
            $examples_modules[$namesapce] = true;

            if (! isset($examples[$section])) {
                $examples[$section] = [];
            }

            if (is_array($example)) {
                $example[1] = trim($example[1]);
                $examples[$lastSection][] = $example;
            }

            $example = [$title, ''];

            continue;
        }

        if (is_array($example)) {
            if ($commented) {
                $line = preg_replace('/^\/\//', '', $line);
            }

            $example[1] .= $line . "\n";
        }
    }

    if (is_array($example)) {
        $example[1] = trim($example[1]);
        $examples[$section][] = $example;
    }

    cache($example_file, $examples);
}

// -----------------------------------------------------------------------------
// compile library files
// -----------------------------------------------------------------------------
// modules buffer
$modules_buffer = '';

// for each modules
foreach ($modules as $module) {
    // module file path
    $module_template = dirname($library_template) . '/' . $module . '.js';

    // if file not found
    if (! is_file($module_template)) {
        throw new Exception('$module_template [ ' . $module_template . ' ] is not a file.');
    }

    // get cached module
    $module_buffer = isset($examples_modules[$module]) ? null : cache($module_template);

    // no cache or modified
    if (! $module_buffer) {
        // get and parse the input buffer
        $module_buffer = file_get_contents($module_template);
        $module_buffer = tags_replace($settings, $module_buffer);
        $module_buffer = preg_split("/\r\n|\n|\r/", $module_buffer);
        $module_buffer = implode("\n", array_slice($module_buffer, 2, -2));

        // parse example tags
        $module_buffer = preg_replace_callback('/ +\* +\{\$examples +([^\}]+)\}/', function($matches) {
            global $examples;
            $buffer  = '';
            $section = $matches[1];
            if (isset($examples[$section])) {
                foreach ($examples[$section] as $example) {
                    $buffer .= "\n\n@example\n";
                    $buffer .= '### ' . $example[0] . "\n";
                    $buffer .= "```\n" . $example[1] . "\n```";
                }
            }
            return preg_replace('/^([^\n]*)$/m', '    * $1', trim($buffer));
        }, $module_buffer);

        cache($module_template, $module_buffer);
    }

    // append to modules buffer
    $modules_buffer .= "\n    " . trim($module_buffer) . "\n";
}

// modules placeholder regex pattern
$modules_placeholder_pattern = "/\n *\/\/ \[modules placeholder\].*\n/";

// get and parse the input buffer
$library_buffer = file_get_contents($library_template);
$library_buffer = tags_replace($settings, $library_buffer);
$library_buffer = preg_replace($modules_placeholder_pattern, $modules_buffer, $library_buffer);

// write the buffer to output file
file_put_contents($library_file, trim($library_buffer) . "\n");

// -----------------------------------------------------------------------------
// compile index file
// -----------------------------------------------------------------------------
if (! cache($index_template)) {
    // get and parse the input buffer
    $index_buffer = file_get_contents($index_template);
    $index_buffer = tags_replace($settings, $index_buffer);

    // write the buffer to output file
    file_put_contents($index_file, trim($index_buffer) . "\n");

    cache($index_template, true);
}

// -----------------------------------------------------------------------------
// print index file
// -----------------------------------------------------------------------------
ob_start();
require $index_file;
ob_flush();
flush();
ob_end_flush();

// -----------------------------------------------------------------------------
// compile docs
// -----------------------------------------------------------------------------
if ($noDocs) {
    exit();
}

if (! cache($docs_directory . '/jsdoc.tpl.json')) {
    // get and parse the input buffer
    $jsdoc_buffer = file_get_contents($docs_directory . '/jsdoc.tpl.json');
    $jsdoc_buffer = tags_replace($settings, $jsdoc_buffer);

    // write the buffer to output file
    file_put_contents($docs_directory . '/jsdoc.json', trim($jsdoc_buffer) . "\n");

    cache($docs_directory . '/jsdoc.tpl.json', true);
}

if (! cache($docs_directory . '/package.tpl.json')) {
    // get and parse the input buffer
    $package_buffer = file_get_contents($docs_directory . '/package.tpl.json');
    $package_buffer = tags_replace($settings, $package_buffer);

    // write the buffer to output file
    file_put_contents($docs_directory . '/package.json', trim($package_buffer) . "\n");

    cache($docs_directory . '/package.tpl.json', true);
}

// -----------------------------------------------------------------------------
// run jsdoc
// -----------------------------------------------------------------------------
$command = 'node ./node_modules/jsdoc/jsdoc.js -c ./jsdoc.json';
$command.=' -P ./package.json -R ../README.md';
$command.=' -r ../dist/smoothie-happy.js -d .';
$command.=' -t ./node_modules/jaguarjs-jsdoc';
$command.=' --verbose';

$cwd = getcwd();
chdir($docs_directory);
exec($command, $output, $error);
chdir($cwd);

//var_dump($output, $error);

$iter = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator(
        $docs_directory, RecursiveDirectoryIterator::SKIP_DOTS
    ),
    RecursiveIteratorIterator::SELF_FIRST,
    RecursiveIteratorIterator::CATCH_GET_CHILD
);

$src = realpath($library_directory) . '/';
$src = str_replace('\\', '/', $src);

$href = str_replace('C:/', 'C__', $src);
$href = str_replace('/', '_', $href);

foreach ($iter as $path => $dir) {
    if ($dir->isDir()) continue;
    if ($dir->getExtension() !== 'html') continue;

    $html = file_get_contents($path);
    $html = str_replace($src, '', $html);
    $html = str_replace($href, '', $html);

    file_put_contents($path, $html);

    if (preg_match("/$href/", $path)) {
        rename($path, str_replace($href, '', $path));
    }
}
