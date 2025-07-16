const socket = io();
let localStream, peerConnection;
const roomInput = document.getElementById('roomInput');
const joinBtn = document.getElementById('joinBtn');
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

const servers = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

joinBtn.onclick = async () => {
    const roomID = roomInput.value;
    if (!roomID) return alert('Enter a Room ID');

    socket.emit('join-room', roomID);

    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;

    peerConnection = new RTCPeerConnection(servers);
    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
    });

    peerConnection.ontrack = event => {
        remoteVideo.srcObject = event.streams[0];
    };

    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            socket.emit('ice-candidate', { candidate: event.candidate });
        }
    };

    socket.on('user-joined', async () => {
        showNotification("🔔 A user has joined the room.");

        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit('offer', { offer });
    });

    socket.on('offer', async data => {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.emit('answer', { answer });
    });

    socket.on('answer', async data => {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
    });

    socket.on('ice-candidate', async data => {
        if (data.candidate) {
            try {
                await peerConnection.addIceCandidate(data.candidate);
            } catch (e) {
                console.error('Error adding received ICE candidate', e);
            }
        }
    });

    socket.on('user-left', () => {
        showNotification("🔕 A user has left the room.");
        remoteVideo.srcObject = null;
        peerConnection.close();
    });
};

// 🔔 Helper function to show join/leave notifications
function showNotification(message) {
    const notification = document.createElement("div");
    notification.innerText = message;
    notification.style.position = "fixed";
    notification.style.top = "10px";
    notification.style.right = "10px";
    notification.style.padding = "10px 20px";
    notification.style.background = "#007bff";
    notification.style.color = "white";
    notification.style.borderRadius = "5px";
    notification.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";
    notification.style.zIndex = "1000";
    document.body.appendChild(notification);

    setTimeout(() => {
        document.body.removeChild(notification);
    }, 3000);
}



