'use strict';
const axios = require('axios');
const config = require('../config');


module.exports = async function(geoCity){
    const url = "https://api.openweathermap.org/data/2.5/weather";
    let weatherCondition;
                await axios.get(url, {
                params: {
                    q: geoCity,
                    appId: config.WEATHER_API_KEY
                } //Query string data
                })
                .then(response => {
					if( response.status === 200) {
                    	const weather = response.data;
                    	if (weather.hasOwnProperty("weather")) {
                            //console.log(weather["weather"][0]["description"]);
                        	weatherCondition = weather["weather"][0]["description"];
                    	} else {
                        	weatherCondition = null;
                        }
                    } else {
                        console.error(response.error);
						weatherCondition = null;
                    }
                })
                .catch(function (error) {
                    // handle error
                    console.log(error);
                });
    
                return weatherCondition;
} 