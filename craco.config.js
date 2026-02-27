const path = require("path");
const lessPlugin = require("craco-less");

module.exports = {
	plugins: [
		{
			plugin: lessPlugin,
			options: {
				lessLoaderOptions: {
					lessOptions: {
						javascriptEnabled: true
					}
				}
			}
		}
	],
	babel: {
		plugins: [["@babel/plugin-proposal-decorators", {legacy: true}]]
	}
}