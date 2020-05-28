import React, { Component } from 'react';
import io from 'socket.io-client'
// import './App.css';
// import Header from './Header.js';

class App extends Component {
  constructor(props){
    super(props)

    //https://reactjs.org/docs/refs-and-the-dom.html
    this.localVideoref = React.createRef()
    this.remoteVideoref = React.createRef()

    this.socket = null
    this.candidates = []
  }

  componentDidMount = () => {

    this.socket = io(
      '/webrtcPeer',
      {
        path: '/webrtc',
        query: {}
      }
    )

    this.socket.on('connection-success', success => {
      console.log(success)
    })

    this.socket.on('offerOrAnswer', (sdp) => {
      this.textref.value = JSON.stringify(sdp)
    })

    this.socket.on('candidate', (candidate) => {
      //console.log('From Peer...', JSON.stringify(candidate))
      this.candidates = [...this.candidates, candidate]
    })

    const pc_config = null

    // https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection
    // create an instance of RTCPeerConnection
    this.pc = new RTCPeerConnection(pc_config)

    // triggered when a new candidate is returned
    this.pc.onicecandidate = (e) => {
      // send the candidates to the remote peer
      // see addCandidate below to be triggered on the remote peer
      if (e.candidate) {
        // console.log(JSON.stringify(e.candidate))
        this.sendToPeer('candidate', e.candidate)
      }
    }

    // triggered when there is a change in connection state
    this.pc.oniceconnectionstatechange = (e) => {
      console.log(e)
    }

    // triggered when a stream is added to pc, see below - this.
    this.pc.onaddstream = (e) => {
      this.remoteVideoref.current.srcObject = e.stream
    }

    const constraints = { audio:false, video: true }

    const success = (stream) => {
      window.localStream = stream
      this.localVideoref.current.srcObject = stream
      this.pc.addStream(stream)
    }

    const failure = (e) => {
      console.log('getUserMedia Error: ', e)
    }

    // navigator.getUserMedia( constraints, success, failure )
    navigator.mediaDevices.getUserMedia( constraints ).then( success ).catch( failure )
    // (async () => {
    //   const stream = await navigator.mediaDevices.getUserMedia( constraints ) 
    //   success(stream)
    // })().catch( failure )
  }

  sendToPeer = (messageType, payload) => {
    this.socket.emit(messageType, {
      socketID: this.socket.id,
      payload
    })
  }
  
  createOffer = () => {
    console.log('Offer')
    this.pc.createOffer({offerToReceiveVideo: 1})
      .then(sdp => {
        // console.log(JSON.stringify(sdp))

        // set offer sdp as local description
        this.pc.setLocalDescription(sdp)

        this.sendToPeer('offerOrAnswer', sdp)
      })
  }

  setRemoteDescription = () => {
    const desc = JSON.parse(this.textref.value)
    this.pc.setRemoteDescription(new RTCSessionDescription(desc))
  }

  createAnswer = () => {
    console.log('Answer')
    this.pc.createAnswer({offerToReceiveVideo: 1})
      .then(sdp => {
        // console.log(JSON.stringify(sdp))
        // this.pc.setLocalDescription(sdp)
        this.pc.setLocalDescription(sdp)

        this.sendToPeer('offerOrAnswer', sdp)
      })
  }

  addCandidate = () => {
    // const candidate = JSON.parse(this.textref.value)
    // console.log('Adding candidate:', candidate)

    // this.pc.addIceCandidate(new RTCIceCandidate(candidate))
    this.candidates.forEach(candidate => {
      console.log(JSON.stringify(candidate))
      this.pc.addIceCandidate(new RTCIceCandidate(candidate))
    });
  }

  render(){
    return (
      <div className="App">
        <video style={{width: 240, height: 240, margin: 5, backgroundColor: 'black'}}ref={this.localVideoref} autoPlay></video>
        <video style={{width: 240, height: 240, margin: 5, backgroundColor: 'black'}}ref={this.remoteVideoref} autoPlay></video>
        <br />
        <button onClick={this.createOffer}>Offer</button>
        <button onClick={this.createAnswer}>Answer</button>
        <br />
        <textarea ref={ref => { this.textref = ref }}/>
        <button onClick={this.setRemoteDescription}>Set Remote Desc</button>
        <button onClick={this.addCandidate}>Add Candidate</button>
      </div>
    );
  }
}

export default App;
