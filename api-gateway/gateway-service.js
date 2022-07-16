const 
  compression = require('compression'),
  port=process.env.PORT||3000,
  http = require('http'),
  express = require('express'),
  router = require('express-routemagic');
  //io = require('socket.io')(port);
  
var app = express();
app.use(compression());
router.use(app);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});