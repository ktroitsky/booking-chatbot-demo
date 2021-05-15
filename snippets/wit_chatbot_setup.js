const { Wit } = require('node-wit');

const client = new Wit({
  accessToken: MY_TOKEN,
});

console.log(client.message('Make a reservation at 6am tomorrow'));