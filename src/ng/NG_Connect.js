/**
 * @author Philip Van Raalte
 * @date 2017-10-20.
 */
import Newgrounds from './newgroundsio';
import {ngAppID, ngKey} from '../config/keys';
import _ from 'lodash';

let ngio = new Newgrounds.io.core(ngAppID, ngKey);
let medals = [], scoreboards = [], sessionStarted = false, medalsLoaded = false;
const afterSessionStart = (result) => {console.log("Session has started", result);};
const afterMedalsLoaded = () => {console.log("Medals loaded", medals);};

export function startSession() {
  ngio.callComponent("App.startSession", {}, (result) => {
    ngio.queueComponent("Medal.getList", {}, onMedalsLoaded);
    ngio.queueComponent("ScoreBoard.getBoards", {}, onScoreboardsLoaded);
    ngio.executeQueue();
    sessionStarted = true;
    afterSessionStart(result);
  });
}

export function getMedals() {
  return medals;
}

function onMedalsLoaded(result) {
  if(result.success) {
    medals = result.medals;
    medalsLoaded = true;
  }
  afterMedalsLoaded();
}

function onScoreboardsLoaded(result) {
  if(result.success) {
    scoreboards = result.scoreboards;
  }
}

export function getDateTime() {
  ngio.callComponent("Gateway.getDatetime", {}, (result) => {
    if(result.success) {
      console.log(`The current date/time on the Newgrounds.io server is ${result.datetime}`);
    } else {
      console.log("ERROR!", result.error.message);
    }
  });
}

function onMedalUnlocked(medal) {
  console.log(`Unlocked: ${medal.unlocked}`);

  // show medal
}

export function unlockMedal(medalName) {
  // if no user is attached to ngio object, no one is logged in and medals can't be unlocked
  if(!ngio.user) {
    console.log("Cannot unlock medal - user not logged in");
    return;
  }

  let medal = _.find(medals, (medal) => {
    return medal.name === medalName;
  });

  if(_.isEmpty(medal)) {
    console.log(`${medalName} was not found`);
    return;
  }
  if(!medal.unlocked) {
    ngio.callComponent("Medal.unlock", {i: medal.id}, ({success, medal: newMedal}) => {
      if(success) {
        onMedalUnlocked(newMedal);
        medal.unlocked = true; // store locally to avoid calling API if the medal is already unlocked
        console.log(medal, medals);
      }
    });
  }
}

function onScorePosted(result) {
  console.log(`Score of ${result.score.value} was successfully posted`);
}

export function postScore(score, id) {
  console.log(`Posting score of ${score}`);

  if(!ngio.user) {
    console.log("Cannot post score - user not logged in");
  }
  ngio.callComponent("ScoreBoard.postScore", {id, value: score}, (result) => {
    if(result.success) {
      onScorePosted(result);
    }
  });
}

export function initSession() {
  ngio.getValidSession(() => {
    if(ngio.user) {
      /*
       * If we have a saved session, and it has not expired,
       * we will also have a user object we can access.
       * We can go ahead and run our onLoggedIn handler here.
       */
      onLoggedIn();
    } else {
      /*
       * If we didn't have a saved session, or it has expired
       * we should have been given a new one at this point.
       * This is where you would draw a 'sign in' button and
       * have it execute the following requestLogin function.
       */
      console.log("No session");
    }
  });
}

function onLoggedIn() {
  console.log(`Welcome ${ngio.user.name}!`);
}