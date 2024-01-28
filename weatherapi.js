const now = new Date();
console.log(now); //your Date object for the current day/time

const body = document.body;

/*---------------------------------------------------
First, we need location data so that we can use
latitutde/longitude values to get the local weather.
We’ll try to use the Browser’s native geolocation API
https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API
---------------------------------------------------*/
if (navigator.geolocation) {
	navigator.geolocation.getCurrentPosition(processLocation, locationError);
}else{
	console.log("Sorry, gelocation is not supported")
}

function processLocation(pos) {
	const crd = pos.coords;
	console.log("Your current position is:");
	console.log(`Latitude: ${crd.latitude}`);
	console.log(`Longitude: ${crd.longitude}`);
	getWeatherData(crd.latitude, crd.longitude);
}

function locationError(err) {
	console.warn(`ERROR(${err.code}): ${err.message}`);
}

/*---------------------------------------------------
This is the main API call to the Open weather API.
The documentation is here: https://openweathermap.org/current
Usually, you’ll want to keep your API Key in a repository
"secret" instead of directly in your code for security reasons.
---------------------------------------------------*/
function getWeatherData( lat, lon){
	const appId = 'a0be2ca7d3101a5b3e8a3bbf580143f6'; 
	const	url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${appId}&units=imperial`;
	fetch(url)
		.then(response => response.json())
		.then(data => {
			if( data.cod == '404' ){
				//error in getting data, display error
				console.log( data.message );
			}else{
				processWeatherData(data);
			}      
		})
		.catch(error => console.log(error));
}


/*---------------------------------------------------
Process the data we received from the API
into formats that are useful for us
---------------------------------------------------*/
function processWeatherData(data){
	// let’s first log our full data result, then
	// store the data we need in variables for later use

	console.log(data);
	const temp = data.main.temp;

	const utcSunsetMS = data.sys.sunset * 1000; 
	const utcSunriseMS = data.sys.sunrise * 1000; 
	//the Open Weather API returns times in UNIX timestamps.
	//UNIX timestamps are in seconds, but JS uses milliseconds, so let’s *10000
	
	//setup Date objects for the sunset / sunrise times
	//so that we can use them for comparison
	let sunsetTime = new Date(utcSunsetMS);
	let sunriseTime = new Date(utcSunriseMS);

	if( now < sunriseTime ){
		body.dataset.mode = "beforedawn";
		console.log('before dawn');
		document.body.classList.add('before-dawn');
	}else if( now > sunriseTime && now < sunsetTime ){
		body.dataset.mode = "day";
		console.log('day');
		document.body.classList.add('day');
	} else{
		body.dataset.mode = "afterdusk";
		console.log('after dusk');
		document.body.classList.add('after-dusk');
	}

	//calculate the bloomtime in milliseconds. the flower blooms 9 hours after sunset
	let utcBloomMS = utcSunsetMS + hoursToMS(9);
	
	if( now < sunsetTime){
		/*-- if we are looking at the site before today’s sunset, 
		let’s use the previous day’s sunset time instead by subtracting 24hours 
		though technically, we should pull new data for that particular date, 
		since sunset times change a little bit every day..
		--*/
		utcBloomMS = utcBloomMS - hoursToMS(24);
	}

	//setup Date objects for the bloom and close times
	let bloomTime =  new Date(utcBloomMS); 
	let closeTime = new Date(utcBloomMS + hoursToMS(6)); // let’s just assume 6 hours of bloom time

	//add our data into HTML placeholders
	displayData(now, sunsetTime, bloomTime, closeTime, temp)
	
	//check if flower should be blooming and update the flower status
	updateFlower(now, bloomTime, closeTime)

	//update the background colors according to time of day
	updateDayMode(now, sunriseTime, sunsetTime)

	//update the flower color according to the temperature
	updateFlowerColor(temp)
}


/*---------------------------------------------------
Our functions for using the data with our HTML elements
------------------------------------------------------*/
function displayData(now, sunsetTime, sunriseTime){
	let nowDiv = document.getElementById('now');
	nowDiv.innerText = formatDate( now );

	let duskDiv = document.getElementById('dusk');
	duskDiv.innerText = formatDate( sunsetTime );

	let daybreakDiv = document.getElementById('daybreak');
	daybreakDiv.innerText = formatDate( sunriseTime );

}

function updateFlower(now, bloomTime, closeTime){
	const statusDiv = document.getElementById('status');
	if( now >= bloomTime && now < closeTime ){
		//if it is currently after the bloom time and before the closing time
		body.dataset.flower = "open";
		statusDiv.innerText = "open";
	}else{
		body.dataset.flower = "closed";
		statusDiv.innerText = "closed";
	}
}

function updateDayMode(now, sunriseTime, sunsetTime){
	if( now < sunriseTime ){
		body.dataset.mode = "beforedawn";
		console.log('before dawn');
	}else if( now > sunriseTime && now < sunsetTime ){
		body.dataset.mode = "day";
		console.log('day');
	} else{
		body.dataset.mode = "afterdusk";
		console.log('after dusk');
	}
}

function updateFlowerColor(temp){
	const tempMin = 20;
	const tempMax = 90;
	let ratio;
	//limit range to maximum / minimum values of tempRange
	if( temp > tempMax){
	  ratio = 1;
	}else if( temp < tempMin){
	  ratio = 0;
	}else{
		ratio = (temp - tempMin)/(tempMax-tempMin)
	}

	let redValue = Math.round(ratio*255) //255 is the full saturation of the color, let’s get a range from 0–255
	body.style.setProperty('--red', redValue);
	console.log('redtint value', redValue);

}

/*---------------------------------------------------
Utility functions that help us calculate things
---------------------------------------------------*/
function hoursToMS( hours ){
	// given a number of hours, returns the equivalent milliseconds
	// hours * 60 min/hour * 60sec/min * 1000ms/sec
	return hours * 60 * 60 * 1000;
}

function formatDate( date ){
	// see this reference for formatting options:
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#options
	return date.toLocaleTimeString('default', { timeStyle: 'short' })
}