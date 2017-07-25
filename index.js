'use strict';

let ApiAiApp = require('actions-on-google').ApiAiApp;
let express = require('express');
let bodyParser = require('body-parser');
let chaussures = require('./ressources/chaussures.js');
let descriptions = require('./ressources/descriptions.js');
let app = express();
app.use(bodyParser.json({type: 'application/json'}));
app.use('/images', express.static('ressources'));

const IMAGE = 'https://on-running.herokuapp.com/images/images/'

// Function Handler


app.post('/', function (req, res) {
    const assistant = new ApiAiApp({request: req, response: res});

    // Pour selectionner un element d'une liste

    function R(array) {
        return array[Math.floor(Math.random() * (array.length))];
    }

    function possibleColor(shoe,size,assistant) {
      
      assistant.data.colours = [];
      let number = chaussures[shoe]['size'][size];
      let colors = chaussures[shoe]['colors'];
      let i = 0;
      let a = 0;
      for (i;i<colors.length;i++) {
        if (number[i] > 0) {
          assistant.data.colours[a] = colors[i];
          a++
        }
      }
      outputColor(assistant);
      // On propose des couleurs avec une carte si on a un écran sinon on prends les trois premières couleurs et on permet de naviguer

    }

    function outputColor(assistant) {

      let prompt = 'colors';
      let colours = assistant.data.colours;
      assistant.hasSurfaceCapability(assistant.SurfaceCapabilities.SCREEN_OUTPUT)
        assistant.setContext('validate',3);
        let list = assistant.buildList();
        for (let i=0;i<colours.length;i++) {
          list.addItems(assistant.buildOptionItem(colours[i],colours[i])
            .setTitle(colours[i])
            .setImage(IMAGE+colours[i].replace(/ /g,"_")+'.jpg',colours[i]));
        }

        assistant.askWithList(assistant.buildRichResponse()
        .addSimpleResponse(prompt),list);
    }

    function navigate(assistant) {

      // On regarde si l'utilisateur souhaite naviguer vers l'avant ou l'arrière puis on lui fourni les couleurs correspondantes

      
    }

    function commander(assistant) {

      // On récupère la taille et le modèle de la chaussure puis on va chercher les couleurs possibles

      assistant.data.shoe = assistant.getContextArgument('commander','shoes').value;
      assistant.data.size = assistant.getContextArgument('commander','size').value;
      possibleColor(assistant.data.shoe,assistant.data.size,assistant);

    }

    function selectedColor(assistant){
      assistant.data.color = assistant.getContextArgument('actions_intent_option','OPTION').value;
      recapCard(assistant);
    }

    function selectedShoe(){}

    function change(){}

    function validate(assistant){
      assistant.askForDeliveryAddress('to send your new shoes');
      
    }

    function shoeInfo(){}

    function change(assistant){
      let c = assistant.getArgument('changes');

    }

    function recapCard(assistant){
      let prompt = 'validation';
      let color = assistant.data.color;
      let shoe = assistant.data.shoe;
      assistant.setContext('select-color',1);
      let basicCard = assistant.buildBasicCard()
        .setTitle('PRICE : '+chaussures[shoe].price+" €")
        .setBodyText(descriptions[shoe])
        .setImage(IMAGE+shoe+'_'+color.replace(/ /g,"_")+'.jpg', shoe.toLowerCase());
      let richResponse = assistant.buildRichResponse()
        .addSimpleResponse(prompt)
        .addBasicCard(basicCard);
        assistant.ask(richResponse);
    }

    // Mapping intentions

    let actionMap = new Map();

    actionMap.set('commander', commander);
    actionMap.set('selectedColor', selectedColor);
    actionMap.set('validate',validate);
    actionMap.set('change',change);


    assistant.handleRequest(actionMap);
});

// Server 

if (module === require.main) {
  // [START server]
  // Start the server
  let server = app.listen(process.env.PORT || 8080, function () {
    let port = server.address().port;
    console.log('app listening on port %s', port);
  });
  // [END server]
}