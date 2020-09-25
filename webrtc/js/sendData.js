'use strict';

var isChannelReady = false;
var isInitiator = false;
var isStarted = false;
var pc;
var turnReady;
var dataChannel;
var dataResult;
var txt_input = document.getElementById("txt-input");
var btn_send = document.getElementById("btn-send");

var pcConfig = {
  'iceServers': [{
    'urls': 'stun:stun.l.google.com:19302'
  }]
};

var room = "lobby-01";
var socket = io.connect("https://mighty-ridge-80415.herokuapp.com/");


socket.emit('create or join', room);
console.log('Attempted to create or join room', room);

socket.on('created', function(room) {
  console.log('Created room ' + room);
  isInitiator = true;
});

socket.on('full', function(room) {
  console.log('Room ' + room + ' is full');
});

socket.on('join', function (room){
  console.log('Another peer made a request to join room ' + room);
  console.log('This peer is the initiator of room ' + room + '!');
  isChannelReady = true;
  maybeStart();
});

socket.on('joined', function(room) {
  console.log('joined: ' + room);
  isChannelReady = true;
  maybeStart();
});

socket.on('log', function(array) {
  console.log.apply(console, array);
});

////////////////////////////////////////////////

function sendMessage(message) {
  console.log('Client sending message: ', message);
  socket.emit('message', message);
}

// This client receives a message
socket.on('message', function(message) {
  console.log('Client received message:', message);
  if (message.type === 'offer') {
    if (!isStarted) {
      maybeStart();
    }
    pc.setRemoteDescription(new RTCSessionDescription(message));
    doAnswer();
  }else if (message.type === 'answer' && isStarted) {
    console.log("received answer");
    pc.setRemoteDescription(new RTCSessionDescription(message));
  } else if (message.type === 'candidate' && isStarted) {
    var candidate = new RTCIceCandidate({
      sdpMLineIndex: message.label,
      candidate: message.candidate
    });
    pc.addIceCandidate(candidate);
  } else if (message === 'bye' && isStarted) {
    handleRemoteHangup();
  }
  else{
    console.log("May be irresponsible message.",isStarted);
  }
});

////////////////////////////////////////////////////


function maybeStart() {
  console.log('>>>>>>> maybeStart() ', isStarted, isChannelReady);
  if (!isStarted && isChannelReady) {
    console.log('>>>>>> creating peer connection');
    createPeerConnection();
    isStarted = true;
    console.log('isInitiator', isInitiator);
    doCall();
  }
}

window.onbeforeunload = function() {
  sendMessage('bye');
};


/////////////////////////////////////////////////////////


function clbkDataChannelMsg(msg){
  console.log("Callback : ");
  console.log(msg.data);
  dataResult = msg;
}


function callback_ondatachannel(event){
  console.log("Data channel recieved.");
  dataChannel = event.channel;
  dataChannel.onmessage = clbkDataChannelMsg;
}


function onDataChannelOpen(event){
  console.log("Data channel opened. --------->>>>>>>");
}

function createPeerConnection() {
  try {
    pc = new RTCPeerConnection(pcConfig);
    pc.onicecandidate = handleIceCandidate;
    dataChannel = pc.createDataChannel("mousePoints");
    dataChannel.onopen = onDataChannelOpen;
    console.log('Created RTCPeerConnnection');
  } catch (e) {
    console.log('Failed to create PeerConnection, exception: ' + e.message);
    alert('Cannot create RTCPeerConnection object.');
    return;
  }
}

function handleIceCandidate(event) {
  console.log('icecandidate event: ', event);
  if (event.candidate) {
    sendMessage({
      type: 'candidate',
      label: event.candidate.sdpMLineIndex,
      id: event.candidate.sdpMid,
      candidate: event.candidate.candidate
    });
  } else {
    console.log('End of candidates.');
  }
}

function handleCreateOfferError(event) {
  console.log('createOffer() error: ', event);
}

function doCall() {
  console.log('Sending offer to peer');
  pc.createOffer(setLocalAndSendMessage, handleCreateOfferError);
}

function doAnswer() {
  console.log('Sending answer to peer.');
  pc.createAnswer().then(
    setLocalAndSendMessage,
    onCreateSessionDescriptionError
  );
}

function setLocalAndSendMessage(sessionDescription) {
  // Set Opus as the preferred codec in SDP if Opus is present.
  //  sessionDescription.sdp = preferOpus(sessionDescription.sdp);
  pc.setLocalDescription(sessionDescription);
  console.log('setLocalAndSendMessage sending message', sessionDescription);
  sendMessage(sessionDescription);
}

function onCreateSessionDescriptionError(error) {
  trace('Failed to create session description: ' + error.toString());
}


function hangup() {
  console.log('Hanging up.');
  stop();
  sendMessage('bye');
}

function handleRemoteHangup() {
  console.log('Session terminated.');
  stop();
  isInitiator = false;
}

function stop() {
  isStarted = false;
  // isAudioMuted = false;
  // isVideoMuted = false;
  pc.close();
  pc = null;
}

function sendMsgDataChannel(msg){
  if(dataChannel.readyState == "open"){
    dataChannel.send(msg);
  }else{
    console.log("Data Channel is not in open state.");
  }
}

btn_send.addEventListener("click", function(){
  var message = txt_input.value;
  if(message != ""){
    dataChannel.send(message);
    console.log("Message sent over data channel.");
  }else{
    console.log("Please fill some text in input box.");
  }
})