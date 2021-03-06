'use strict';

var isChannelReady = false;
var isInitiator = false;
var isStarted = false;
var localStream;
var pc;
var dataChannel;
var vid_div = document.getElementById("vid-div");

var pcConfig = {
  'iceServers': [{
    'urls': 'stun:stun.l.google.com:19302'
  }]
};


var room = "room-videoMousePoints";
var socket = io.connect("https://remoteassistance.coughrecorder.com/signal");

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
  if (message.type === 'answer' && isStarted) {
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

var localVideo = document.querySelector('#localVideo');

navigator.mediaDevices.getUserMedia({
  video: true
})
.then(gotStream)
.catch(function(e) {
  alert('getUserMedia() error: ' + e.name);
});

function gotStream(stream) {
  console.log('Adding local stream.');
  if ('srcObject' in localVideo) {
    localVideo.srcObject = stream;
  } else {
    // deprecated
    localVideo.src = window.URL.createObjectURL(stream);
  }
  localStream = stream;
  maybeStart();
}

function maybeStart() {
  console.log('>>>>>>> maybeStart() ', isStarted, localStream, isChannelReady);
  if (!isStarted && typeof localStream !== 'undefined' && isChannelReady) {
    console.log('>>>>>> creating peer connection');
    createPeerConnection();
    pc.addStream(localStream);
    isStarted = true;
    console.log('isInitiator', isInitiator);
    doCall();
  }
}

window.onbeforeunload = function() {
  sendMessage('bye');
};

function callback_ondatachannel(){
  console.log("Data channel opened.");
}

function clbkDataChannelMsg(msg){
  console.log("Callback : ");
  console.log(msg.data);
}

/////////////////////////////////////////////////////////

function createPeerConnection() {
  try {
    pc = new RTCPeerConnection(pcConfig);
    pc.onicecandidate = handleIceCandidate;
    dataChannel = pc.createDataChannel("mousePoints");
    dataChannel.onopen = callback_ondatachannel;
    dataChannel.onmessage = clbkDataChannelMsg;
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

function handleRemoteStreamAdded(event) {
  console.log('Remote stream added.');
  if ('srcObject' in remoteVideo) {
    remoteVideo.srcObject = event.streams[0];
  } else {
    // deprecated
    remoteVideo.src = window.URL.createObjectURL(event.stream);
  }
  remoteStream = event.stream;
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

function handleRemoteStreamRemoved(event) {
  console.log('Remote stream removed. Event: ', event);
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

var mouse_coordinates = [];

vid_div.addEventListener("mousedown", function(){

  vid_div.onmousemove = function(){
    mouse_coordinates.push([(event.clientX-vid_div.offsetLeft), event.clientY-vid_div.offsetTop]);
  }
});

vid_div.addEventListener("mouseup", function(){
  vid_div.onmousemove = null;
  console.log("mouse coordinates : "+mouse_coordinates);
  sendMsgDataChannel(JSON.stringify(mouse_coordinates))
  mouse_coordinates = [];
});
