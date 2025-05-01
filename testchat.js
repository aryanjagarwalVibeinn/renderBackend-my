const Ably = require("ably");

// ✅ Replace this with your actual Ably API Key
const ably = new Ably.Realtime("RWUoyA.ZM3Y2Q:xtgyQ6I9YcBJlLI9mAV1IvbmqO8DnTFXvWn1xuXmfiU");

const channel = ably.channels.get("chat-room");

channel.subscribe("message", (message) => {
  console.log("📩 New Message Received:", message.data);
});

console.log("✅ Listening for messages on 'chat-room'...");
  