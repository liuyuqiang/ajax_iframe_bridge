Bridge = {
  dispatchTable : {},
  nextCallbackId : 0,
  ready : false,
  queue: [],
  init : function(url, origin, callback) {
    //sample origin: https://api.example.com
    Bridge.origin = origin;
    Bridge.onReady = (callback === undefined) ? function(){} : callback;
    Bridge.iframe = document.createElement('iframe');
    Bridge.iframe.onload = Bridge.set_ready;
    Bridge.iframe.setAttribute('src', url);
    Bridge.iframe.setAttribute('style', 'display:none');
    if (Bridge.iframe.attachEvent) {
      Bridge.iframe.attachEvent("onload", Bridge.set_ready);
    }
    append = function() {
      document.body.appendChild(Bridge.iframe);
    };

    if(document.readyState === "loading") {
      document.addEventListener('DOMContentLoaded', append, false);
    } else {
      append();
    }
  },
  ajax : function(args) {
    if (!Bridge.ready) {Bridge.queue.push(args); return;}
    // add args to callback table
    var callbackId = Bridge.nextCallbackId++;
    Bridge.dispatchTable[callbackId] = {
      success: args.success,
      error: args.error
    }
    var message = {
      args:       args,
      callbackId: callbackId
    };
    Bridge.iframe.contentWindow.postMessage(
      JSON.stringify(message), Bridge.origin);
  },
  set_ready: function() {
    Bridge.ready = true;
    Bridge.onReady();
    for (var q = 0; q < Bridge.queue.length; q++) {
      Bridge.ajax(Bridge.queue[q]);
    }
  },
  receive : function(event) {
    // ensure that we're catching the right event
    if(event.origin.indexOf(Bridge.origin) !== 0) return;
    var message = JSON.parse(event.data);
    var func_to_call =
      Bridge.dispatchTable[message.callbackId][message.successOrFail];
    if(typeof(func_to_call) === "undefined"){
      throw "No callback for bridge to call on "+message.successOrFail+"; message: "+event.data;
    } else {
      func_to_call(message.response);
    }
  }
}

window.addEventListener('message', Bridge.receive, false);
