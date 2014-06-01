var proxy = require('smart-proxy').createServer("localhost",8080);
var express = require('express.io');
var _ = require('underscore');

var app = express();

app.http().io();

var map = {}
var options = {
    listening: false
}

var getMap = function() {
	var result = [];
	for(var url in map) {
		result.push({ 
			url: url,
			data: map[url].data,
			active: map[url].active
		});
	}
	return result;
}

var parseJSON = function(res) {
		var jres;
	  	try{
	  		jres = JSON.parse(res);
	  	}
	  	catch(ex){
	  		return null;
	  	}
	  	return jres;
};

proxy.setResponseListener(function(url, res){
	if(map[url] && map[url].active) {
		return map[url].active;
	}
	else if(options.listening) {
        if(!map[url]) {
            map[url] = {
				data: []
			};
        } 
		else {
			// interception
			if(map[url].active) {
				return map[url].active;
			}
		}
        var found = false;
        for(var index in map[url].data) {
            var obj = map[url][index];
            if(obj && res == JSON.stringify(obj.data)) {
                found = true;
                break;
            }
        }
        if(!found) {
			var obj = {
				url: url,
				data: res,
				date: Math.round(+new Date()/1000)
			}
            map[url].data.push(obj);
            app.io.broadcast('interception',obj);
        }
    }
});

app.io.on("connection",function(req){
    req.emit("init", {
        map: getMap(),
        options: options
    });
});

app.io.route("setOptions",function(req){
    _.extend(options, req.data);
    app.io.broadcast("updateOptions", options);
});

app.io.route("setURL",function(req){
	if(!req.data.active) delete map[req.data.url].active;
	else map[req.data.url].active = req.data.active;
	//_.extend(map[req.data.url], req.data);
	app.io.broadcast("updateURL", req.data);
});

// static fronend
app.use("/", express.static("admin"));

// restful api
app.get("/api",function(req,res){
	res.send(getMap());
});

proxy.listen(9090);
app.listen(9091);