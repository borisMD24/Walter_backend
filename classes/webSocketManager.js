import { WebSocketServer } from 'ws';

class WebSocketManager {
  constructor() {
    if (WebSocketManager.instance) return WebSocketManager.instance;
    this.wss = null;
    this.clients = new Set();

    this.rooms = new Map(); // roomName -> Set of sockets
    this.clientRooms = new Map(); // socket -> Set of roomNames

    // Callbacks: roomName -> callback(socket)
    this.roomMessageHandlers = new Map();
    this.roomSubscribeHandlers = new Map();   // when client joins
    this.roomUnsubscribeHandlers = new Map(); // when client leaves

    WebSocketManager.instance = this;
  }

  initialize(server) {
    if (this.wss) return; // prevent double initialization
    this.wss = new WebSocketServer({ server });

    this.wss.on('connection', (socket, req) => {
      this.clients.add(socket);
      this.clientRooms.set(socket, new Set());
      console.log('📡 New client connected');

      socket.on('message', (msg) => this.handleMessage(socket, msg));
      socket.on('close', () => this.handleDisconnect(socket));
      socket.on('error', (err) => console.error('💥 WebSocket error:', err));
    });

    console.log('✅ WebSocketManager initialized');
  }

  createRoom(roomName, {
    messageHandler = null,
    onSubscribe = null,
    onUnsubscribe = null
  } = {}) {
    if (this.rooms.has(roomName)) {
      throw new Error(`Room "${roomName}" already exists.`);
    }
    this.rooms.set(roomName, new Set());

    if (messageHandler) this.roomMessageHandlers.set(roomName, messageHandler);
    if (onSubscribe) this.roomSubscribeHandlers.set(roomName, onSubscribe);
    if (onUnsubscribe) this.roomUnsubscribeHandlers.set(roomName, onUnsubscribe);

    console.log(`🎩 Room "${roomName}" created`);
  }

  deleteRoom(roomName) {
    if (!this.rooms.has(roomName)) return;
    const clients = this.rooms.get(roomName);
    for (const client of clients) {
      const clientRooms = this.clientRooms.get(client);
      if (clientRooms) clientRooms.delete(roomName);
      if (client.readyState === client.OPEN) {
        client.send(JSON.stringify({
          deletion: `Room "${roomName}" has been deleted`
        }));
      }
    }
    this.rooms.delete(roomName);
    this.roomMessageHandlers.delete(roomName);
    this.roomSubscribeHandlers.delete(roomName);
    this.roomUnsubscribeHandlers.delete(roomName);
    console.log(`🗑️ Room "${roomName}" deleted.`);
  }

  handleDisconnect(socket) {
    const rooms = this.clientRooms.get(socket);
    if (rooms) {
      for (const room of rooms) {
        this.leaveRoom(socket, room, true);
      }
    }
    this.clientRooms.delete(socket);
    this.clients.delete(socket);
    console.log('❌ Client disconnected');
  }

  handleMessage(socket, message) {
    const msgStr = message.toString();
    console.log('📨 Message received:', msgStr);

    let data;
    try {
      data = JSON.parse(msgStr);
    } catch (e) {
      socket.send(JSON.stringify({ error: '❌ JSON expected.' }));
      return;
    }

    switch(data.action) {
      case 'join':
        this.joinRoom(socket, data.room);
        break;
      case 'leave':
        this.leaveRoom(socket, data.room);
        break;
      case 'message':
        this.sendRoomMessage(socket, data.room, data.data);
        break;
      default:
        socket.send(JSON.stringify({ error: '❌ Unknown action.' }));
    }
  }

  joinRoom(socket, roomName) {
    if (!this.rooms.has(roomName)) {
      socket.send(JSON.stringify({
        error: `The room "${roomName}" does not exist.`
      }));
      return;
    }
    const room = this.rooms.get(roomName);
    room.add(socket);

    const clientRooms = this.clientRooms.get(socket);
    clientRooms.add(roomName);

    const onSubscribe = this.roomSubscribeHandlers.get(roomName);
    if (onSubscribe) {
      try {
        onSubscribe(socket);
      } catch (err) {
        console.error(`💥 Error in onSubscribe for room ${roomName}:`, err);
      }
    } else {
      socket.send(JSON.stringify({
        success: `✅ You joined the "${roomName}" room`
      }));
    }

    console.log(`🛎️ Client joined room "${roomName}"`);
  }

  leaveRoom(socket, roomName, isDisconnect = false) {
    if (!this.rooms.has(roomName)) return;
    const room = this.rooms.get(roomName);
    if (!room.has(socket)) return;

    room.delete(socket);

    const clientRooms = this.clientRooms.get(socket);
    if (clientRooms) clientRooms.delete(roomName);

    const onUnsubscribe = this.roomUnsubscribeHandlers.get(roomName);
    if (onUnsubscribe) {
      try {
        onUnsubscribe(socket, isDisconnect);
      } catch (err) {
        console.error(`💥 Error in onUnsubscribe for room ${roomName}:`, err);
      }
    } else if (!isDisconnect) {
      socket.send(JSON.stringify({
        message: `You have left the room "${roomName}"`
      }));
    }

    console.log(`🚪 Client left room "${roomName}"`);
  }

  sendRoomMessage(senderSocket, roomName, message) {
    if (!this.rooms.has(roomName)) {
      senderSocket.send(JSON.stringify({
        error: `❌ The room "${roomName}" does not exist.`
      }));
      return;
    }
    const room = this.rooms.get(roomName);

    if (!room.has(senderSocket)) {
      senderSocket.send(JSON.stringify({
        error: `❌ You are not in the room "${roomName}".`
      }));
      return;
    }

    const handler = this.roomMessageHandlers.get(roomName);
    if (handler) {
      try {
        handler(message, senderSocket);
      } catch (err) {
        console.error(`💥 Error in message handler for room "${roomName}":`, err);
      }
    }
    for (const client of room) {
      if (client !== senderSocket && client.readyState === client.OPEN) {
        client.send(JSON.stringify({
          room: roomName,
          message
        }));
      }
    }
  }

  broadcast(message, exclude = null) {
    const jsonMessage = JSON.stringify(message);
    for (const client of this.clients) {
      if (client !== exclude && client.readyState === client.OPEN) {
        client.send(jsonMessage);
      }
    }
  }

  sendTo(socket, message) {
    if (socket.readyState === socket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  }
}

const instance = new WebSocketManager();
export default instance;
