$(document).ready(function() {
    $list = $("#log-list");

    var socket = io.connect("http://sysinct.herokuapp.com:80");
    socket.on('log', function(message) {
        writeLog(message);
    });
    socket.on('catchup', function(messages) {
        for(var i=0,max=messages.length; i<max; i++) {
            writeLog(messages[i]);
        }
    });
    socket.emit('catchup', 'pullup');
    socket.emit('subscribe', 'pullup');

    var doScroll = true;
    var forcedScroll = false;

    $list.scroll(function(e) {
        if(!forcedScroll) {
            doScroll = false;
        }
        forcedScroll = false;
    });

    function writeLog(log) {
        var data = /^(\d+) <(\d+)>(\d) ([\d\-T\:\.\+]+) (\w+) (\w+) ([\w\.\d]+) - (.*)$/.exec(log);
        var date = d = new Date(Date.parse(data[4]));
        $list.append('<div class="row"><div class="col-xs-2">' + date.toLocaleString() + '</div><div class="col-xs-1">' + data[7] + '</div><div class="col-xs-8">' + ansi_up.ansi_to_html(data[8]) + '</div></div>');
        if($list.children().length > 1000) {
            $list.children().first.remove();
        }

        if(doScroll) {
            forcedScroll = true;
            $list.scrollTop($list.children().last().position().top + $list.scrollTop());
        }
    }
});
