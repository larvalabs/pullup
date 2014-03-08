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
        $list.append("<li>"+log+"</li>");
        if($list.children().length > 1000) {
            $list.children().first.remove();
        }

        if(doScroll) {
            forcedScroll = true;
            $list.scrollTop($list.children().last().position().top + $list.scrollTop());
        }
    }
});
