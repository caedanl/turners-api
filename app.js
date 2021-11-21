// Package imports
const express = require('express');
const app = express();
const axios = require('axios');
const cors = require('cors');
const setCookie = require('set-cookie-parser');

// Setting up port variale
const PORT = process.env.PORT || 4000

const mongoBaseUrl = 'https://data.mongodb-api.com/app/data-xelyu/endpoint/data/beta/'

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

// ENDPOINTS

// Welcome
app.get('/', (req, res) => {
	res.send("Welcome to the Turners API")
})

// Endpoint for retrieving vehicle model from registration
app.get('/plate', (req, res) => {
	console.log(req.query.plate)
	const plate = req.query.plate + ""
	const regex = /(?<=Report - )(.*)(?=\| CARJAM)/g;

	axios.get('https://www.carjam.co.nz/car/?plate=' + plate)
		.then(response => {
			const htmlData = response.data + ""
			const carData = htmlData.match(regex)[0]
			res.send(carData.split('-')[1].trim())
		})
		.catch(() => {
			console.log("There was a catch error")
			res.status(400)
		})
})

// Endpoint for getting address search suggestions
app.get('/address', (req, res) => {
	console.log("Searching for " + req.query.prefix)
	const data = `{ prefix:'${req.query.prefix}', topN:3}`;
	let cookie;

	axios.get('https://verifyaddress.courierpost.co.nz')
		.then((response) => cookie = setCookie.parse(response, { decodeValues: true }))
		.then(() => {
			const config = {
				method: 'get',
				url: 'https://verifyaddress.courierpost.co.nz/AddressLookupServicePage.aspx?servicemethod=getaddresssuggestions',
				headers: {
					'Connection': 'keep-alive',
					'sec-ch-ua': '"Chromium";v="94", ";Not A Brand";v="99"',
					'Accept': 'application/json, text/javascript, */*',
					'Content-Type': 'application/json; charset=UTF-8',
					'X-Requested-With': 'XMLHttpRequest',
					'sec-ch-ua-mobile': '?0',
					'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.114 Safari/537.36',
					'sec-ch-ua-platform': '"macOS"',
					'Origin': 'https://verifyaddress.courierpost.co.nz',
					'Sec-Fetch-Site': 'same-origin',
					'Sec-Fetch-Mode': 'cors',
					'Sec-Fetch-Dest': 'empty',
					'Referer': 'https://verifyaddress.courierpost.co.nz/',
					'Accept-Language': 'en,en-GB;q=0.9,en-US;q=0.8',
					'Cookie': `${cookie[0].name}=${cookie[0].value}; ${cookie[1].name}=${cookie[1].value};`
				},
				data: data
			};
			axios(config)
				.then((response) => res.send(response.data))
				.catch((error) => console.log(error));
		})
})

// Sending new quotes to MongoDB database
app.post('/quotes/new', (req, res) => {
	console.log(req.query)
	const data = {
		dataSource: 'turners',
		database: 'quotedb',
		collection: 'quotes',
		document: {
			car: JSON.parse(req.query.carData),
			driver: [JSON.parse(req.query.driverData[0])]
		}
	};
	console.log(data)
	const config = {
		method: 'post',
		url: mongoBaseUrl + 'action/insertOne',
		headers: {
			'Content-Type': 'application/json', 
    		'Access-Control-Request-Headers': '*', 
    		'api-key': 'mB3Z0dFPLZ4SvXq4GfhL7XDJZydkMCiRFkwi05prBBz6YLgU9tW0aMEZR4WrOM98'
		},
		data: data
	};

	axios(config)
	.then(response => {
		console.log("Entry added with id: " + response.data.insertedID)
		res.send(response.data)
	})
	.catch(() => console.log("There was a catch error"))
})

app.listen(PORT, () => console.log("App running on port: " + PORT));