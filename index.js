'use strict';

let express = require('express');
let bodyParser = require('body-parser');
let chaussures = require('./ressources/chaussures.js');

let app = express();
app.use(bodyParser.json({type: 'application/json'}));
app.use('/ressources/images', express.static('images'));

const IMAGE = 'https://on-running.herokuapp.com/images/'

// Function Handler


app.post('/', function (req, res) {
    const assistant = new ApiAiApp({request: req, response: res});

    // Pour selectionner un element d'une liste

    function R(array) {
        return array[Math.floor(Math.random() * (array.length))];
    }

    function possible(shoes,size,assistant) {
      
      let number = chaussures[shoes]['size'][size];
      let colors = chaussures[shoes]['colors'];
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
      if (assistant.hasSurfaceCapability(assistant.SurfaceCapabilities.SCREEN_OUTPUT)) {

        let list = assistant.buildList();
        for (let i=0;i<colours.length;i++) {
          list.addItems(assistant.buildOptionItem(colours[i]))
            .setTitle(colours[i])
            .setImage(IMAGE+colours[i].replace(" ","_")+'.jpg');
        }

        assistant.askWithList(assistant.buildRichResponse()
        .addSimpleResponse(),list);
      } else {
          assistant.ask(prompt);
      }
    }

    function navigate(assistant) {

      // On regarde si l'utilisateur souhaite naviguer vers l'avant ou l'arrière puis on lui fourni les couleurs correspondantes

      
    }

    function commander(assistant) {

      // On récupère la taille et le modèle de la chaussure puis on va chercher les couleurs possibles

      assistant.data.shoes = assistant.getContextArgument('commander','shoes').value;
      assistant.data.size = assistant.getContextArgument('commander','size').value;
      possible(assistant.data.shoes,assistant.data.size,assistant);

    }

    function giveColor(){}

    function giveShoe(){}

    function change(){}

    function validate(){}

    function shoeInfo(){}

    function recapCard(){}

    // Mapping intentions

    let actionMap = new Map();

    actionMap.set('commander', commander);


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