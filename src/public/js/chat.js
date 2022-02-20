const socket = io();
const inputMessage = document.querySelector('#message');
const form = document.querySelector('form');
const messageButton = document.querySelector('#btn1');
const locationButton = document.querySelector('#send-location');
const messages = document.querySelector('#messages');

// Templates

const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-message-template').innerHTML;
const sideBarTemplate = document.querySelector('#sidebar-template').innerHTML;

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoScroll = () => {
  // New message element
  const $newMessages = messages.lastElementChild;

  // Height of the new message
  const newMessageStyles = getComputedStyle($newMessages);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessages.offsetHeight + newMessageMargin;
  // Visibeheight
  const visibleHeight = messages.offsetHeight;

  // Height of messages
  const containerHeight = messages.scrollHeight;

  // How far have I scrolled
  const scrollOffset = messages.scrollTop + visibleHeight;
  if (containerHeight - newMessageHeight <= scrollOffset) {
    messages.scrollTop = messages.scrollHeight;
  }
};
form.addEventListener('submit', e => {
  // disable the form
  e.preventDefault();
  messageButton.disabled = true;
  if (!inputMessage.value.trim()) {
    return;
  }
  const message = inputMessage.value;
  socket.emit('sendMessage', message, error => {
    messageButton.disabled = false;
    inputMessage.value = '';
    form.focus();
    // enable
    if (error) {
      return console.log(error);
    }
    console.log('The message was delivered!');
  });
});

locationButton.addEventListener('click', () => {
  locationButton.disabled = true;
  if (!navigator.geolocation) {
    return window.alert('Geolocation is not supported');
  }
  navigator.geolocation.getCurrentPosition(position => {
    socket.emit(
      'sendLocation',
      {
        longitude: position.coords.longitude,
        latitude: position.coords.latitude,
      },
      () => {
        locationButton.disabled = false;
        console.log('Location shared');
      }
    );
  });
});

socket.on('message', msg => {
  const html = Mustache.render(messageTemplate, {
    message: msg.text,
    username: msg.username,
    createdAt: moment(msg.createdAt).format('h:mm a')
  });
  messages.insertAdjacentHTML('beforeend', html);
  autoScroll()
});
socket.on('locationMessage', msg => {
  const html = Mustache.render(locationTemplate, {
    url: msg.url,
    username: msg.username,
    createdAt: moment(msg.createdAt).format('h:mm a')
  });
  messages.insertAdjacentHTML("beforeend", html);
  autoScroll();
});
socket.on('roomData', ({ room, users }) => {
  const html = Mustache.render(sideBarTemplate, {
    users,
    room
  });
  document.querySelector('#sidebar').innerHTML = html;
})
socket.emit('join', { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = '/';
  }
});