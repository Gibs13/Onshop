const WELCOME_STATE = 'welcome';
const RESERVE_STATE = 'reserve';
const CHOOSE_STATE = 'choose';
const CONFIRM_STATE = 'confirm';
const YES_NO_STATE = 'yes_no';
const GIVE_NAME_STATE = 'give_name';
const CHANGE_STATE= "change";

const PROPOSITION = ["My suggestion is ","I may suggest you ","A possible choice would be ","I allowed myself to choose ","Maybe "];
const MISUNDERSTAND = ["Sorry, I didn't understand. ","What did you just said ? ","I didn't heared well. "];
const AGREE = ["Do you agree ? ","Is it ok for you ? ","Is it alright ? "];
const FINISH = ["May I place a reservation ? ","Is everything right ? ","May I proceed ? "];
const READY = ["A table is available ","There's still place ","It's possible to reserve "];
const SUCCESS = ["Your reservation was completed under the name of ","Everything went well. The table was ordered with the name ","The reservation was made under the name : "];
const WELCOME = ["Welcome ! You can book a restaurant's table in Strasbourg. ","Hello ! I'm able to get a reservation for a restaurant in Strasbourg. ","Howdy ! Do you want a reservation in a Strasbourg's restaurant ? "];
const BYE = ["Alright then, come back soon ! ","Well, goodbye. See you soon.","You're leaving yet ? Until next time !"];
const CHANGE = ["What should I change ? ","Tell me what has to be modified. ","What has to be replaced ? "];
const NOROOM = ["There is no room ","They haven't got any seats ","It's not possible to book "];


    function confirmation (assistant) {

        if (assistant.data.problem != false) {
            assistant.ask(assistant.data.problem);
            return;
        }
        let time = assistant.data.time;
        let minutes = parseInt(time.substring(0,2))*60 + parseInt(time.substring(3,5));
        let date = assistant.data.date;
        let T = false;
        let month = parseInt(date.substring(5,7));
        let day = parseInt(date.substring(8,10));
        let maxDays = new Date(date.substring(0,4),month,0).getDate();
        let tries = 0;

        while (T === false) {


        T = disponible(date,minutes);
        if (T === false) {
            //Pas de place ce jour
            console.log("Pas de place ce jour");
            if (tries == 0 && !assistant.data.proposition) {
                assistant.data.proposition = true;
                assistant.data.message += R(NOROOM) + "this day. ";
            }
            if (tries == 7) {
                break;
            }
            tries++;
            day++;
            if (day > maxDays) {
                month++;
                day = 1;
            }
            date = date.substring(0,4)+'-'+('0'+month.toString()).slice(-2)+'-'+('0'+day.toString()).slice(-2);

        } else {
            assistant.data.date = date;
            assistant.data.time = T;
        }

        }  
        if (T === false) {
            assistant.ask(R(NOROOM) + "this day and the week after. You may try another date. ");
            return;
        }

        let message = createMessage(assistant);
        
        assistant.data.state = YES_NO_STATE;
        if (assistant.data.proposition) {
            assistant.ask(assistant.data.message + R(PROPOSITION) + message + R(AGREE));
            return;
        } else {
            assistant.ask(assistant.data.message + R(READY) + message + R(FINISH));
            return;
        }        
    }

    function createMessage(assistant) {
        let cd = assistant.data.cd;
        let cr = assistant.data.cr;
        let cln = assistant.data.cln;
        let cn = assistant.data.cn;
        let ct = assistant.data.ct;
        let dateMessage;
        let timeMessage;
        if (!cd) {dateMessage="";}
        else {
            let date = assistant.data.date;
            let day = today.getDate();
        if (day == parseInt(date.substring(8,10))) {
            dateMessage = "today ";
        } else if (day+1 == parseInt(date.substring(8,10))) {
            dateMessage = "tomorrow ";
        } else if (day+2 == parseInt(date.substring(8,10))) {
            dateMessage = "in two days ";
        } else {
            dateMessage = "on the "+DAY[parseInt(date.slice(8))-1]+" of "+MONTH[parseInt(date.slice(5,7))-1]+" ";
        }}
        if (!ct) {timeMessage="";}
        else {
            let time = assistant.data.time;
            timeMessage = "at "+(time.slice(0,2)<10?time.slice(1,2):time.slice(0,2))+" hours "+(time.slice(3,5)!=0?time.slice(3,5)+" minutes ":"");
        }
        let message = (cn?"for "+assistant.data.places+" person"+(assistant.data.places>1?"s ":" "):"")+(cr?"the restaurant "+assistant.data.restaurant.toLowerCase()+" ":"")+dateMessage+timeMessage+(cln?"with the name "+assistant.data.name+" ":"")+". ";
        assistant.data.cd=0;
        assistant.data.cr=0;
        assistant.data.cln=0;
        assistant.data.cn=0;
        assistant.data.ct=0;
        return message;
    }


    function reserver (assistant) {
        let restaurant = assistant.data.restaurant;
        get(restaurant, function(horaires) {
            let placeRestante = parseInt(horaires[date][creneau].substring(6));
            let places = assistant.data.places;
            let name = assistant.data.name;
            console.log("reservation à " + horaires[date][creneau]);
            if (placeRestante-places>=0) {
                assistant.setContext('reserve', 0);
                console.log("valide");
                let valeur = horaires[date][creneau].substring(0,6) + (placeRestante-places).toString();
                modify(restaurant,horaires[date][horaires[date].length-1],String.fromCharCode(66 + creneau),places,valeur,name,assistant.data.time);
                assistant.tell(R(SUCCESS) + name);
            } else {
                console.log("invalide");
                assistant.ask("There was an error, the places are not available anymore. ");
            }
        });
        let date = assistant.data.date;
        let creneau = assistant.data.creneau;
        console.log(restaurant + " " + date + " " + creneau);
    }

    function disponible(date, time) {
        let heure;
        let possibleTime = [];
        let placeRestante;
        let horairesJour = horaires[date];
        if (isNaN(time)) {
            console.log("Nan");
        }
        if (horairesJour == undefined) {return false;}
        if (horairesJour.length <= 1) {return false;}
        for (let i = 0; i<horairesJour.length;i++) {
            if (!isNaN(horairesJour[i])) {
                continue;
            }
            placeRestante = parseInt(horairesJour[i].substring(6));
            heure = parseInt(horairesJour[i].substring(0,2))*60 + parseInt(horairesJour[i].substring(3,5));
            
            console.log("heure : "+heure+"time : "+time);

            // Teste si le créneau est bon
            // Si oui, assez de place => on revoit une heure acceptable, pas assez => On va annoncer qu'il n'y avait pas assez de place
            // Si non, est ce que le créneau avant ou celui après est disponible 

            if (heure<=time && time<heure+30) {
                if (placeRestante >= assistant.data.places) {
                    assistant.data.creneau = i;
                    let rightTime;
                    if (time != heure) {
                        if (!assistant.data.proposition) {
                            assistant.data.message += "You can only reserve a bit earlier. ";
                        }
                    } 
                    rightTime = heure;
                    console.log("rightTime : " + rightTime);
                    return ('0' + Math.floor(rightTime/60).toString()).slice(-2) + ':' + ('0' + (rightTime-Math.floor(rightTime/60)*60).toString()).slice(-2);
                } else {
                    if (!assistant.data.proposition) {
                        assistant.data.message += "There's only "+placeRestante+" seats at this hour. ";
                        assistant.data.proposition = true;
                        assistant.data.ct = 1;
                    }
                }
            } else if (placeRestante >= assistant.data.places ) {
                if (time>heure && today.getDate() != parseInt(date.substring(8,10) )) {
                    possibleTime[0] = heure;
                    possibleTime[2] = i;
                } else if (time<heure && possibleTime[1] == undefined) {
                    possibleTime[1] = heure;
                    possibleTime[3] = i;
                }
            }
        }
        let rightTime;
        if (!possibleTime[0] && !possibleTime[1]) {
            return false;
        } else if (!possibleTime[0]) {
            rightTime = possibleTime[1];
        } else if (!possibleTime[1]) {
            rightTime = possibleTime[0];
        } else {
            rightTime = possibleTime[1]-time <= time-possibleTime[0] ? possibleTime[1] : possibleTime[0];
        }
        assistant.data.creneau = rightTime == possibleTime[0] ? possibleTime[2] : possibleTime[3];
        assistant.data.ct = 1;
        assistant.data.proposition = true;
        let answer = ('0' + Math.floor(rightTime/60).toString()).slice(-2) + ':' + ('0' + (rightTime-Math.floor(rightTime/60)*60).toString()).slice(-2);
        console.log("temps proposé : " + answer);
        return answer;
    }

    // intents

    function start (assistant) {
        
        assistant.data.proposition = false;
        assistant.data.message = "";
        assistant.data.problem = false;
        assistant.data.date ="";
        assistant.data.name ="";
        assistant.data.restaurant ="";
        assistant.data.places="";
        assistant.data.time ="";


        assistant.data.state = WELCOME_STATE;
        assistant.ask(R(WELCOME));
    }

    function reserve (assistant) {

        assistant.data.proposition = false;
        assistant.data.message = "";
        assistant.data.problem = false;
        assistant.data.state = RESERVE_STATE;
        
        assistant.data.restaurant = assistant.getContextArgument('reserve','resto').value.toUpperCase();
        let datebis = assistant.getContextArgument('reserve','datebis').value;
        let timebis = assistant.getContextArgument('reserve','timebis').value;
        assistant.data.name = assistant.getContextArgument('reserve','last-name').value;
        assistant.data.places = parseInt(assistant.getContextArgument('reserve','number').value);
        let todayNormalized = today.getFullYear().toString()+'-'+('0' + (today.getMonth()+1).toString()).slice(-2)+'-'+('0' + (today.getDate()).toString()).slice(-2);
        assistant.data.cd = parseInt(assistant.getContextArgument('reserve','cd').value);
        assistant.data.cr = parseInt(assistant.getContextArgument('reserve','cr').value);
        assistant.data.cln = parseInt(assistant.getContextArgument('reserve','cln').value);
        assistant.data.cn = parseInt(assistant.getContextArgument('reserve','cn').value);
        assistant.data.ct = parseInt(assistant.getContextArgument('reserve','ct').value);

        let restaurant = assistant.data.restaurant;
        console.log(restaurant);

        get(restaurant,function(val) {

            horaires = val;

        if (!horaires) {
            assistant.ask("I don't know this restaurant. ");
            return;
        }

        confirmation(assistant);
        });

        if (isNaN(assistant.data.places)) {
                assistant.data.problem = "I didn't understand the number of persons. "
            }

        if (datebis == "today") {
            assistant.data.date = todayNormalized;
        } else if (isNaN(parseInt(datebis))) {
            assistant.data.problem = "What was the date ? ";
        } else {
            assistant.data.date = datebis;
        }
        let date = assistant.data.date;
        
        if (timebis && !isNaN(parseInt(timebis))) {
            assistant.data.time = timebis.substring(0,5);
        } else {
            assistant.data.problem = "At what time you wanted to reserve ? ";
        }
    }

    function yes (assistant) {
        let state = assistant.data.state;
        if (state == WELCOME_STATE) {
            assistant.data.state = RESERVE_STATE;
            assistant.ask("What do you want to do ? ")
            return;
        } else
        if (state == YES_NO_STATE) {
            assistant.data.proposition = false;
            reserver(assistant);;
        } else {
            assistant.ask("I'm not sure of what you wanted. ");
        }

    }

    function no (assistant) {
        let state = assistant.data.state;
        if (state == WELCOME_STATE) {
            quit(assistant);
            return;
        } else
        if (state == YES_NO_STATE) {
            assistant.data.state = RESERVE_STATE;
            assistant.ask(R(CHANGE));
            return;
        } else {
            assistant.ask("I'm not sure of what you wanted. ");
        }

    }

    function quit (assistant) {
        assistant.tell(R(BYE));
    }

    function selectionner (assistant) {
        assistant.data.state = RESERVE_STATE;
        let r = assistant.getContextArgument('actions_intent_option','OPTION').value;
        assistant.setContext('next',5,{"ok":r});
        assistant.ask("The restaurant "+r.toLowerCase()+" was selected. Please say next to continue. ");
    }

    function propose(assistant) {
        let restaurants = ['VELICIOUS','AKABE','LA CLOCHE A FROMAGE'];
        let prompt = 'Here are some cool restaurants. ';
        if (assistant.hasSurfaceCapability(assistant.SurfaceCapabilities.SCREEN_OUTPUT)) {
        assistant.askWithList(assistant.buildRichResponse()
            .addSimpleResponse(prompt),
            assistant.buildList()
            .addItems(assistant.buildOptionItem(restaurants[0],['first one',descriptions[restaurants[0]][0]])
                .setTitle(descriptions[restaurants[0]][0])
                .setDescription(descriptions[restaurants[0]][1])
                .setImage(IMAGE+descriptions[restaurants[0]][2],descriptions[restaurants[0]][0]))
            .addItems(assistant.buildOptionItem(restaurants[1],['second one',descriptions[restaurants[1]][0]])
                .setTitle(descriptions[restaurants[1]][0])
                .setDescription(descriptions[restaurants[1]][1])
                .setImage(IMAGE+descriptions[restaurants[1]][2],descriptions[restaurants[1]][0]))
            .addItems(assistant.buildOptionItem(restaurants[2],['third one',descriptions[restaurants[2]][0]])
                .setTitle(descriptions[restaurants[2]][0])
                .setDescription(descriptions[restaurants[2]][1])
                .setImage(IMAGE+descriptions[restaurants[2]][2],descriptions[restaurants[2]][0]))
        )}
        else {
            assistant.ask(prompt+descriptions[restaurants[0]][0]+'. '+descriptions[restaurants[0]][1]+descriptions[restaurants[1]][0]+'. '+descriptions[restaurants[1]][1]+descriptions[restaurants[2]][0]+'. '+descriptions[restaurants[2]][1]+'.');
        }
    }