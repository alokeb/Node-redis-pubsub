var client = new Pubsub({
    port: 8000
  });
  
  client.connect();
  
  client.on("connect", function() {
    client.subscribe("trololo", function(data){
        console.log('Received a message from the server: ' + data);
    });	  
});  