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

const BYE = ["Alright then, come back soon ! ","Well, goodbye. See you soon.","You're leaving yet ? Until next time !"];
const ONLYCOLOR = ["We only have this color. ",
"That's the only color we have. "];
const NOSIZE = ["I am sorry but it looks like we don't have any stock of this shoe for your size right now."];
const BUYED = ["The shoes will be delivered at "];
const COLORS = ["Here are the colors we have for this shoe."];
const VALIDATE = ["Is everything right ?",
"Should i finish the transaction ?",
"Do you like this shoe ?"];
const SHOE  = ["What shoe would you like ?",
"Here's our collection.",
"We recommand you those shoes."];
const SIZE = ["What's your feet size ? "];


// Create shoe finder by tags

function shoeByTagConstructor(){
  for (let modele in chaussures) {
    let tags = chaussures[modele].tags;
    for (let i=0;i<tags.length;i++) {
    if (!this[tags[i]]) {
     this[tags[i]] = [];
    }
    this[tags[i]].push(modele);
  }}
}

const shoeByTag = new shoeByTagConstructor();
console.log(JSON.stringify(shoeByTag));


// Function Handler


app.post('/', function (req, res) {
    const assistant = new ApiAiApp({request: req, response: res});

    // Pour selectionner un element d'une liste

    function R(array) {
        return array[Math.floor(Math.random() * (array.length))];
    }

    function possibleColor(assistant) {
      
      let shoe = assistant.data.shoe;
      let size = assistant.data.size;

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
        assistant.ask(R(NOSIZE));
      } else {
        if (assistant.data.colours.length == 1) {
          assistant.data.color = assistant.data.colours[0];
          assistant.data.message = R(ONLYCOLOR);
          recapCard(assistant);
          return;
        }
      outputColor(assistant);
      }
    }

    function outputColor(assistant) {

      let prompt = R(COLORS);
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
      possibleColor(assistant);

    }

    function selectedColor(assistant){
      assistant.data.color = assistant.getArgument("colour")? assistant.getArgument("colour"):assistant.getContextArgument('actions_intent_option','OPTION').value;
      recapCard(assistant);
    }

    function selectedShoe(assistant){
      assistant.data.shoe = assistant.getContextArgument('actions_intent_option','OPTION').value;
      assistant.data.size = assistant.getContextArgument('shoe-finder','size').value;
      possibleColor(assistant);
    }

    function validate(assistant){
      let n = chaussures[assistant.data.shoe].color.indexOf(assistant.data.color);
      chaussures[assistant.data.shoe].size[assistant.data.size][n]--;
      console.log(chaussures[assistant.data.shoe].size[assistant.data.size][n]);
      let address = assistant.getArgument('address');
      assistant.ask(R(BUYED)+address);
    }

    function shoeFinder(assistant){
      let activity = assistant.getContextArgument('shoe-finder','activity').value;
      let conditions = assistant.getContextArgument('shoe-finder','conditions').value;

      outputShoe(activity,conditions,assistant);
    }

    function outputShoe(activity,conditions,assistant) {
      var choices = [];
      let shoesByTag = JSON.parse(JSON.stringify(shoeByTag));
      choices = shoesByTag[conditions]
      for (let i=0;i<shoesByTag[activity].length;i++) {
        let shoe = shoesByTag[activity][i];
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
      assistant.askWithCarousel(assistant.buildRichResponse().addSimpleResponse(R(SHOE)),carousel);
    }

    function change(assistant){
      let c = assistant.getArgument('changes');
      if (c=='shoe') {
        let tags = chaussures[assistant.data.shoe].tags;
        outputShoe(tags[0],tags[1],assistant);
      } else if (c=='color') {
        outputColor(assistant);
      } else if (c=='size') {
        assistant.setContext('changeSize',1);
        assistant.ask(R(SIZE));
      }
    }

    function recapCard(assistant){
      let message = assistant.data.message?assistant.data.message:'';
      let prompt = R(VALIDATE);
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

    function changedSize(assistant) {
      assistant.data.size = assistant.getArgument('sizes');
      possibleColor(assistant);
    }

    function quit (assistant) {
        assistant.tell(R(BYE));
    }

    // Mapping intentions

    let actionMap = new Map();

    actionMap.set('commander', commander);
    actionMap.set('selectedColor', selectedColor);
    actionMap.set('validate',validate);
    actionMap.set('change',change);
    actionMap.set('shoe-finder',shoeFinder);
    actionMap.set('selectedShoe', selectedShoe);
    actionMap.set('quit', quit);
    actionMap.set('changedSize',changedSize);

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