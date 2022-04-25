const socket = io();
//elements
const $msgForm = document.querySelector("#message-form");
const $msgFormInput = $msgForm.querySelector("input");
const $msgFormButton = $msgForm.querySelector("button");
const $sendLocationButton = document.querySelector("#send-location");
const $msgs = document.querySelector("#msgs");

//templates
const msgTemplate = document.querySelector("#msg-template").innerHTML;
const locationMsgTemplate = document.querySelector(
  "#location-msg-template"
).innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

//options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const autoscroll = () => {
  //new msg element
  const $newMsg = $msgs.lastElementChild;
  //height of new msg
  const newMsgStyles = getComputedStyle($newMsg);
  const newMsgMargin = parseInt(newMsgStyles.marginBottom);
  const newMsgHeight = $newMsg.offsetHeight + newMsgMargin;
  //visible height
  const visibleHeight = $msgs.offsetHeight;
  //height of msgs container
  const containerHeight = $msgs.scrollHeight;
  //how far scrolled
  const scrollOffset = $msgs.scrollTop + visibleHeight;
  // containerHeight - newMsgHeight <= scrollOffset
  if (containerHeight - newMsgHeight == scrollOffset || containerHeight - newMsgHeight < scrollOffset + 1) {
    $msgs.scrollTop = $msgs.scrollHeight;
  }
};

socket.on("message", (message) => {
  const html = Mustache.render(msgTemplate, {
    username: message.username,
    msg: message.text,
    createdAt: moment(message.createdAt).format("h:mm a"),
  });
  $msgs.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

socket.on("locationMessage", (msg) => {
  const html = Mustache.render(locationMsgTemplate, {
    username: msg.username,
    url: msg.url,
    createdAt: moment(msg.createdAt).format("h:mm a"),
  });
  $msgs.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

socket.on("roomData", ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users,
  });
  document.querySelector("#sidebar").innerHTML = html;
});

$msgForm.addEventListener("submit", (event) => {
  event.preventDefault();

  $msgFormButton.setAttribute("disabled", "disabled");

  const message = event.target.elements.message.value;
  socket.emit("sendMessage", message, (error) => {
    $msgFormButton.removeAttribute("disabled");
    $msgFormInput.value = "";
    $msgFormInput.focus();
    if (error) {
      return console.log(error);
    }
    //console.log("message delivered");
  });
});

$sendLocationButton.addEventListener("click", (event) => {
  if (!navigator.geolocation) {
    return alert("Geolocation is not supported");
  }

  $sendLocationButton.setAttribute("disabled", "disabled");

  navigator.geolocation.getCurrentPosition((pos) => {
    socket.emit(
      "sendLocation",
      {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      },
      () => {
        $sendLocationButton.removeAttribute("disabled");
        //console.log("Location shared");
      }
    );
  });
});

socket.emit("join", { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});
