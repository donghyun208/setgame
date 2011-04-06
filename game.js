module.exports = function Game(hash, client) {
  this.deck = [];
  this.board = [];
  this.players = [new Player(client), null, null, null, null, null, null, null];
  this.hash = hash;
  for (var i = 0; i < 81; i++) {
    this.deck.push( new Card(i) );
  }
  shuffle(this.deck);
  for (var i = 0; i < 12; i++) {
    this.board.push(this.deck.pop());
  }
  
  this.getActivePlayers = function() {
    return this.players.filter( function(player) { return player !== null; });
  }
  
  this.numPlayers = function() {
    return this.getActivePlayers().length;
  }
  
  this.firstAvailablePlayerSlot = function() {
    for (var i = 0; i < this.players.length; i++) {
      if (this.players[i] === null) return i;
    }
    return 0;
  }
  
  this.getPlayerIdx = function(client) {
    for (var i = 0; i < this.players.length; i++) {
      if (this.players[i] !== null &&
          this.players[i].client.sessionId === client.sessionId)
        return i;
    }
    return -1;
  }
  
  this.playerScores = function() {
    ret = {};
    for (var i = 0; i < this.players.length; i++) {
      if (this.players[i] !== null) ret[i] = this.players[i].score;
    }
    return ret;
  }
  
  this.registerClient = function(client) {
    if (this.numPlayers() === this.players.length) return; //TODO ERROR CALLBACK
    if (this.players.every( function(player) {
      return (player === null || player.client.sessionId !== client.sesionId);
    })) { 
      var playerIdx = this.firstAvailablePlayerSlot();
      this.broadcast({action: 'join', player: playerIdx});
      this.players[playerIdx] = new Player(client);
    }
  }
  
  this.unregisterClient = function(client, gameOver) {
    var playerIdx = this.getPlayerIdx(client);
    this.players[playerIdx] = null;
    this.broadcast({action: 'leave', player: playerIdx});
    var that = this;
    setTimeout( function delayGameover() {
      if (that.numPlayers() === 0) gameOver();
    }, 5000);
  }
  
  this.broadcast = function(message) {
    this.players.forEach( function(player) {
      if (player !== null) player.client.send(message);
    });
  }
  
  this.message = function(client, message) {
    if (message.action === 'init') {
      client.send({ action: 'init'
                  , board: this.board
                  , players: this.playerScores() });
      return;
    }
    if (message.action === 'take') {
      if (this.checkSet(message.selected)) {
        console.log('take set succeed');
        var update = {};
        message.selected.forEach( function(val) {
          var c = this.deck.pop();
          update[val] = c;
          this.board[val] = c;
        }, this );
        var playerIdx = this.getPlayerIdx(client);
        this.players[playerIdx].score += 3;
        var playerUpdate = {};
        playerUpdate[playerIdx] = this.players[playerIdx].score;
        this.broadcast({action: 'taken'
                      , update: update
                      , players: playerUpdate});
      } else {
        console.log('take set failed');
      }
      return;
    }
  }
  
  this.checkSet = function(indexes) {
    indexes = indexes.unique();
    if (indexes.length != 3) return false;
    if (!indexes.every( function valid(index) {
      return (index >= 0 && index <= this.board.length);
    }, this)) {
      return false;
    }
    return this.verifySet(this.board[indexes[0]], this.board[indexes[1]], this.board[indexes[2]]);
  }
  
  // hardcoding and unrolling all this for speed, possibly premature optimization
  this.verifySet = function(c0, c1, c2) {
    var s = c0.number + c1.number + c2.number;
    if (s != 0 && s != 3 && s != 6) return false;
    s = c0.color + c1.color + c2.color;
    if (s != 0 && s != 3 && s != 6) return false;
    s = c0.shape + c1.shape + c2.shape;
    if (s != 0 && s != 3 && s != 6) return false;
    s = c0.shading + c1.shading + c2.shading;
    if (s != 0 && s != 3 && s != 6) return false;
    return true;
  }
}

function Card(idx) {
  this.number = idx % 3;
  idx = Math.floor(idx / 3);
  this.color = idx % 3;
  idx = Math.floor(idx / 3);
  this.shape = idx % 3;
  idx = Math.floor(idx / 3);
  this.shading = idx % 3;
}

function Player(client) {
  this.client = client;
  this.score = 0;
}

//+ Jonas Raoni Soares Silva
//@ http://jsfromhell.com/array/shuffle [rev. #1]
function shuffle(v){
    for(var j, x, i = v.length;
      i;
      j = parseInt(Math.random() * i), x = v[--i], v[i] = v[j], v[j] = x)
    ;
    return v;
};

// **************************************************************************
// Copyright 2007 - 2009 Tavs Dokkedahl
// Contact: http://www.jslab.dk/contact.php
//
// This file is part of the JSLab Standard Library (JSL) Program.
//
// JSL is free software; you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation; either version 3 of the License, or
// any later version.
//
// JSL is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.
// ***************************************************************************

// Return new array with duplicate values removed
Array.prototype.unique =
  function() {
    var a = [];
    var l = this.length;
    for(var i=0; i<l; i++) {
      for(var j=i+1; j<l; j++) {
        // If this[i] is found later in the array
        if (this[i] === this[j])
          j = ++i;
      }
      a.push(this[i]);
    }
    return a;
  };