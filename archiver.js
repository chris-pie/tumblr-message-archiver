// ==UserScript==
// @name         Messages Archiver
// @namespace    https://github.com/chris-pie/tumblr-message-archiver
// @version      0.1
// @description  Archives the messages
// @author       Chris Pie
// @match        https://www.tumblr.com/dashboard
// @grant        GM_xmlhttpRequest
// @grant        GM_log
// @require      https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js

// ==/UserScript==

(function() {
    'use strict';
    var convo_id ="";
    var messages;
    var done_gathering_messages = false;
    function get_messages(convo_id)
    {
        var waiting = false;
        var url = "/svc/conversations/messages?conversation_id=446786&participant=kreuz-unlimited.tumblr.com";
        var repeater;
        function get_messages_http()
        {
            if(waiting) return;
            waiting = true;
            GM_xmlhttpRequest({
                method: "GET",
                url: "https://www.tumblr.com"+url,
                headers: {
                    "Connection": "keep-alive",
                    "Accept": "application/json, text/javascript, */*; q=0.01",
                    "X-Requested-With": "XMLHttpRequest",
                    "Referer": "https://www.tumblr.com/dashboard",
                    "Accept-Encoding": "gzip, deflate, br",
                },
                onload: function(response)
                {
                    var parsed_response = JSON.parse(response.responseText);
                    var messages = parsed_response.response.messages;
                    waiting = false;
                    if (parsed_response.response.messages._links === undefined)
                    {
                        clearInterval(repeater);
                        waiting = false;
                        done_gathering_messages = true;
                        return;
                    }
                    else url = parsed_response.response.messages._links.next.href;
                }
            });
        }
        repeater = setInterval(get_messages_http, 200);
    }
    function begin_archiving(tumblog_this, tumblog_remote)
    {
        var waiting = false;
        var url = "/svc/conversations?participant="+tumblog_this+".tumblr.com";
        var repeater;

        function get_conversations()
        {
            if(waiting) return;
            waiting = true;
            GM_xmlhttpRequest({
                method: "GET",
                url: "https://www.tumblr.com"+url,
                headers: {
                    "Connection": "keep-alive",
                    "Accept": "application/json, text/javascript, */*; q=0.01",
                    "X-Requested-With": "XMLHttpRequest",
                    "Referer": "https://www.tumblr.com/dashboard",
                    "Accept-Encoding": "gzip, deflate, br",
                },
                onload: function(response)
                {
                    var parsed_response = JSON.parse(response.responseText);
                    for(var i = 0; i < parsed_response.response.conversations.length; i++)
                    {
                        for(var j = 0; j < parsed_response.response.conversations[i].participants.length; j++)
                        {
                            if (parsed_response.response.conversations[i].participants[j].name === tumblog_remote)
                            {
                                convo_id =  parsed_response.response.conversations[i].id;
                                waiting = false;
                                clearInterval(repeater);
                                return;
                            }

                        }
                    }
                    waiting = false;
                    if (parsed_response.response._links === undefined)
                    {
                        convo_id = "error";
                        clearInterval(repeater);
                        waiting = false;
                        return;
                    }
                    else url = parsed_response.response._links.next.href;
                }
            });
        }
        repeater = setInterval(get_conversations, 200);
    }
    begin_archiving("kreuz-unlimited", "--invalidurl--");
    var repeater;
    repeater = setInterval(function() {
        if (convo_id !== "")
        {
            clearInterval(repeater);
            get_messages(convo_id);
        }
    }, 200);

})();
