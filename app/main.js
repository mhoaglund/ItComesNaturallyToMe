var app = require('app');
var sp = require('serialport-electron');
var ipc = require('ipc');
var CronJob = require('cron').CronJob;
var BrowserWindow = require('browser-window');

var fillPumpInterval = 1000;
var mainWindow = null;
//Essentially a debug flag; false unhooks serial writes. Just need a callback on the open method or something.
var isHardwareConnected = true;
var setupInterval = 2;
//Setupbuffer contains a byte from 1-9 that sets the speed of the sensor reading.
//1 is 0.1sec interval, 9 is 0.9sec interval.
//We don't want the hardware doing too much that we can't control easily if need be.
var setupBuffer = new Buffer(1);
	setupBuffer.writeUInt8(0x2, 0);
	
var pumpOnBuffer = new Buffer(1);
	pumpOnBuffer.writeUInt8(0x33, 0);
	
var pumpOffBuffer = new Buffer(1);
	pumpOffBuffer.writeUInt8(0x44, 0);
    
    var pumptestbool = false;

function randomInt (low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}

app.on('window-all-closed', function() {
 if (process.platform != 'darwin')
 app.quit();
});

app.on('ready', function() { 
	var SerialPort = sp.SerialPort;
    sp.list(function (err, ports) {
        ports.forEach(function(port) {
            console.log(port.comName);
            mainWindow.webContents.send('ping', port.comName);
            console.log(port.pnpId);
            console.log(port.manufacturer);
        });
    });
	if(isHardwareConnected){
		var serialPort = new SerialPort("COM4", {
			parser: sp.parsers.readline("d"),
			baudrate: 9600
		});
		serialPort.on("open", function () {
			console.log('open');
			serialPort.on('data', function(data) {
				reportReading(data);
			});
		});	
	}
	else{
		//simulate a sensor feed so we can test the UI without the hardware
		setInterval(function() { 
			var mod = randomInt(1,8);
			//reportReading(25 - mod);
			reportReading(30);
		}, setupInterval * 100);
	}
	

	var killjob = new CronJob({
		cronTime: '00 00 24 * * 0-6',
		onTick: function () {
			app.quit();
		},
		start: false,
		timeZone: 'America/Chicago'
	});
	killjob.start();
	
    var withinPumpInterval = false; //true for dev, false for prod
    var pumpStatus = false; //false is off, true is on
    //At 8am every morning, the pumping interval starts.
    var pumpStartJob = new CronJob({
		cronTime: '00 27 10 * * 0-6',
		onTick: function () {
            withinPumpInterval = true;
            pumpInterval.start();
		},
		start: false,
		timeZone: 'America/Chicago'
	});
	pumpStartJob.start();
    
    //At 9:25am every morning, the pumping interval stops.
    var pumpStopJob = new CronJob({
		cronTime: '00 40 10 * * 0-6',
		onTick: function () {
            withinPumpInterval = false;
            pumpInterval.stop();
            sendPumpStop();
            // if(pumpStatus){
            //     sendPumpStop();
            //     pumpStatus = false;
            // }
		},
		start: false,
		timeZone: 'America/Chicago'
	});
	pumpStopJob.start();
    
    //On and off in one minute intervals to keep electronics cool.
    var pumpInterval = new CronJob({
		cronTime: '00 */1 * * * *',
		onTick: function () {
            if(!pumpStatus){
                sendPumpStart();
                pumpStatus = true;
            }
            else{
                sendPumpStop();
                pumpStatus = false;
            }
		},
		start: false,
		timeZone: 'America/Chicago'
	});
	 

	function reportReading(value){
		console.log('data: ' + value);
		var packet = parseInt(value);
		if(packet == 99){
			console.log('sending setup');
			sendSetup();
		}
		else mainWindow.webContents.send('ping', packet);
	}
	
	function sendSetup(){
		serialPort.write(setupBuffer, function(err, results) {
			if(err) console.log('err ' + err);
		});
	}
    
    function sendPumpStart(){
        if(!isHardwareConnected) return;
        serialPort.write(pumpOnBuffer, function(err, results) {
			if(err) console.log('err ' + err);
		});
    }
    
    function sendPumpStop(){
        if(!isHardwareConnected) return;
        serialPort.write(pumpOffBuffer, function(err, results) {
			if(err) console.log('err ' + err);
		});
    }

	mainWindow = new BrowserWindow({width: 800, height: 600}); 
	mainWindow.loadUrl('file://' + __dirname + '/index.html'); 
	mainWindow.webContents.on('did-finish-load', function() {
		mainWindow.maximize();
		mainWindow.openDevTools();
		mainWindow.webContents.send('setup', setupInterval);
		//if(isHardwareConnected)  mainWindow.setFullScreen(true); UNCOMMENT THIS AFTER DEV
	});
    ipc.on('pump-test',function(){
        console.log("PUMP SETTING CHANGED");
        if(pumptestbool){
            sendPumpStop();
            pumptestbool = false;
        }
        else{
            sendPumpStart();
            pumptestbool = true;
        }
    });
	mainWindow.on('closed', function() {
	mainWindow = null;
	}); 
});