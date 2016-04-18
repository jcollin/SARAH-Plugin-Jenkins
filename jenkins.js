exports.action = function(data, callback, config, SARAH){



config = config.modules.jenkins;
var request = require('request');
var intervalQueue = 0;
var intervalBuild = 0;
var tendances = [];
tendances['blue'] = 'parfaite';
tendances['yellow'] = 'instable';
tendances['red'] = 'en erreur';

if (!config.protocol){
    console.log("Missing jenkins Protocol");
    return;
}
if (!config.domain){
    console.log("Missing jenkins domain/IP");
    return;
}
if (!config.port){
    console.log("Missing jenkins Port");
    return;
}
if (!config.login){
    console.log("Missing jenkins Login");
    return;
}
if (!config.password){
    console.log("Missing jenkins Password");
    return;
}

function buildStatus(build) {
    var url = build.replace(config.protocol, config.protocol+config.login+':'+config.password+'@');
    request.get(
    url+'api/json',
    {  },
    function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var json = JSON.parse(body);
            //console.log(json)
            console.log('ping build');
            if (json.result) {
                console.log(json.result);
                SARAH.speak('Job '+json.result);
                clearInterval(intervalBuild);
            }
        } else {
            console.log('job build ko ');
        }
    }
);
}

function queueStatus(queue) {
    var url = queue.replace(config.protocol, config.protocol+config.login+':'+config.password+'@');
    request.get(
    url+'api/json',
    {  },
    function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var json = JSON.parse(body);
            //console.log(json)
            console.log('ping queue');
            if (json.executable) {
                console.log('build number ' + json.executable.number);
                SARAH.speak('Le job a été lancé, le numéro du build est '+json.executable.number);
                clearInterval(intervalQueue);
                intervalBuild = setInterval(function() {buildStatus(json.executable.url);}, 15000);
            }
        } else {
            console.log('job queue ko ');
        }
    }
);
}

if (data.module == 'build') {
    var tts = '';
    var url = config.protocol+config.login+':'+config.password+'@'+config.domain+':'+config.port+'/view/PAGOR/job/'+data.job+'/build';
    request.post(
        url,
        { },
        function (error, response, body) {
            if (!error && response.statusCode == 201) {
                console.log('job ok '+data.job);
                var queue = response.headers['location'];
                //console.log(queue);
                intervalQueue = setInterval(function() {queueStatus(queue);}, 1000);
                tts = "j'ai lancé le job";
            } else {
                console.log('job ko '+data.job );
                tts = "je n'ai pas réussi à lancer le job";
            }
            SARAH.speak(tts);

        }
    );

}

if (data.module == 'info') {
    var last = 0;
    var url = config.protocol+config.login+':'+config.password+'@'+config.domain+':'+config.port+'/view/PAGOR/job/'+data.job+'/';
    request.get(
    url+'api/json',
    {  },
    function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var json = JSON.parse(body);
            //console.log(json)
            if (json.color) {
                console.log('color ' + json.color);
                SARAH.speak('La tendance du job '+data.name+' est '+tendances[json.color]);
                if (json.lastBuild) {
                    console.log('lastBuild ' + json.lastBuild.number);
                    SARAH.speak('Le dernier builde a le numero ' + json.lastBuild.number);
                    last = json.lastBuild.number;
                    if (json.lastSuccessfulBuild) {
                        console.log('lastSuccessfulBuild ' + json.lastSuccessfulBuild.number);
                        if (last == json.lastSuccessfulBuild.number) {
                            SARAH.speak('et ce fut un réel succès');
                        } else {
                            SARAH.speak('Le dernier builde réussi porte le numero ' + json.lastSuccessfulBuild.number);
                        }
                        
                    }
                }                
            }
        } else {
            console.log(error);
        }
        
    });
}

callback({}); 
};


