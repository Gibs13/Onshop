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

// Create shoe finder by tags

let shoeByTag = {};

for (let modele in chaussures) {
  let tags = chaussures[modele].tags;
  for (let i=0;i<tags.length;i++) {
  if (!shoeByTag[tags[i]]) {
    shoeByTag[tags[i]] = [];
  }
  shoeByTag[tags[i]].push(modele);
}}
console.log(JSON.stringify(shoeByTag));


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
      if (assistant.data.colours === []) {
        assistant.ask("I am sorry but it looks like we don't have any stock of this shoe for your size right now.");
      } else {
        if (assistant.data.colours.length == 1) {
          assistant.data.color = assistant.data.colours[0];
          assistant.data.message = "We only have this color";
          recapCard(assistant);
          return;
        }
      outputColor(assistant);
      }
    }

    function outputColor(assistant) {

      let prompt = 'colors';
      let colours = assistant.data.colours;
        assistant.setContext('select-color',3);
        let list = assistant.buildList();
        for (let i=0;i<colours.length;i++) {
          list.addItems(assistant.buildOptionItem(colours[i],colours[i])
            .setTitle(colours[i])
            .setImage(IMAGE+colours[i].replace(/ /g,"_")+'.jpg',colours[i]));
        }

        assistant.askWithList(assistant.buildRichResponse()
        .addSimpleResponse(prompt),list);
    }

    function commander(assistant) {

      // On récupère la taille et le modèle de la chaussure puis on va chercher les couleurs possibles

      assistant.data.shoe = assistant.getContextArgument('commander','shoes').value;
      assistant.data.size = assistant.getContextArgument('commander','size').value;
      possibleColor(assistant.data.shoe,assistant.data.size,assistant);

    }

    function selectedColor(assistant){
      assistant.data.color = assistant.getArgument("colour")? assistant.getArgument("colour"):assistant.getContextArgument('actions_intent_option','OPTION').value;
      recapCard(assistant);
    }

    function selectedShoe(assistant){
      assistant.data.shoe = assistant.getContextArgument('actions_intent_option','OPTION').value;
      assistant.data.size = assistant.getContextArgument('shoe-finder','size').value;
      possibleColor(assistant.data.shoe,assistant.data.size,assistant);
    }

    function validate(assistant){

      let address = assistant.getArgument('address');
      assistant.ask("The reservation was made at "+address);
    }

    function shoeFinder(assistant){
      let activity = assistant.getContextArgument('shoe-finder','activity').value;
      let conditions = assistant.getContextArgument('shoe-finder','conditions').value;

      outputShoe(activity,conditions,assistant);
    }

    function outputShoe(activity,conditions,assistant) {
      let choices = shoeByTag[conditions];
      for (let i=0;i<shoeByTag[activity].length;i++) {
        let shoe = shoeByTag[activity][i]
        let index = choices.indexOf(shoe);
        if (index!=-1) {
          for (let j=index;j>0;j--) {
            choices[j] = choices[j-1];
          }
          choices[0] = shoe;
        } else {
          choices.push(shoe);
        }
      }
      let carousel = assistant.buildCarousel()
      for (let i=0;i<choices.length;i++) {
        let shoe = choices[i];
        carousel.addItems(assistant.buildOptionItem(shoe)
          .setTitle(shoe.toLowerCase())
          .setDescription(descriptions[shoe])
          .setImage(IMAGE+shoe.replace(/ /g,"_")+'_'+chaussures[shoe].colors[0].replace(/ /g,"_")+'.jpg', shoe.toLowerCase()));
      }
      assistant.setContext('select-shoe',3);
      assistant.askWithCarousel(assistant.buildRichResponse().addSimpleResponse('select shoe'),carousel);
    }

    function change(assistant){
      let c = assistant.getArgument('changes');
      if (c=='shoe') {
        if (!!assistant.getContext('commander')) {
          let tags = chaussures[assistant.data.shoe].tags;
          outputShoe(tags[0],tags[1],assistant);
        } else if (!!assistant.getContext('shoe-finder')){
          shoeFinder(assistant);
        }
      } else if (c=='color') {
        outputColor(assistant);
      }
    }

    function recapCard(assistant){
      let message = assistant.data.message?assistant.data.message:'';
      let prompt = 'validation';
      let color = assistant.data.color;
      let shoe = assistant.data.shoe;
      assistant.setContext('validate',3);
      let basicCard = assistant.buildBasicCard()
        .setTitle('PRICE : '+chaussures[shoe].price+" €")
        .setBodyText(descriptions[shoe])
        .setImage(IMAGE+shoe.replace(/ /g,"_")+'_'+color.replace(/ /g,"_")+'.jpg', shoe.toLowerCase());
      let richResponse = assistant.buildRichResponse()
        .addSimpleResponse(message + prompt)
        .addBasicCard(basicCard);
      assistant.ask(richResponse);
    }

    // Mapping intentions

    let actionMap = new Map();

    actionMap.set('commander', commander);
    actionMap.set('selectedColor', selectedColor);
    actionMap.set('validate',validate);
    actionMap.set('change',change);
    actionMap.set('shoe-finder',shoeFinder);
    actionMap.set('selectedShoe', selectedShoe);


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