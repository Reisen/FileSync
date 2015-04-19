function template(name) {
    var container = document.getElementById('template-' + name);
    return _.template(container.innerHTML, null, {
        variable: 'data'
    });
}

var Player = new (function() {
    var this$  = this;
    this.parse = new DOMParser();
    this.sync  = new WebSocket('ws://' + window.location.hostname + ':5005/sync');
    this.video = document.getElementById('player');
    this.state = {
        paused: true,
        time: 0,
        name: 'Guest' + Math.floor(Math.random() * 1000)
    };

    // Templates.
    this.templates = {
        'user': template('user')
    };

    // Update State. Sent to server to keep people within sync.
    this.updateState = function() {
        this$.state.time   = this$.video.currentTime;
        this$.state.paused = this$.video.paused;
    }

    // Utility Functions
    function addUserToList(username) {
        /* Add ourself to the user list. */
        var elem = document.createElement('div');
        var user = this$.templates.user({
            username: username
        });

        elem.innerHTML = user;
        elem = elem.firstElementChild;
        elem.setAttribute('id', 'user-' + username);
        document.getElementById('users').appendChild(elem);
    }

    function removeUserFromList(username) {
        var elem = document.getElementById('user-' + username);
        elem.parentNode.removeChild(elem);
    }

    // Define Handlers.
    this.onOpen = function() {
        this$.updateState();
        this$.sync.send(JSON.stringify({
            command: 'join',
            state: this$.state
        }));

        addUserToList(this$.state.name);
    }

    this.onMessage = function(e) {
        var data     = JSON.parse(e.data);
        var username = data.state.name;
        var command  = data.command;

        if(username === this$.state.name) {
            return;
        }

        switch(command) {
            case 'join':
                addUserToList(username);
                break;

            case 'quit':
                removeUserFromList(username);
                break;

            default:
                break;
        }

    }

    this.onTick = function() {
        this$.updateState();
        this$.sync.send(JSON.stringify({
            command: 'tick',
            state: this$.state
        }));
    }

    /* Register Handlers */
    this.sync.onopen    = this.onOpen;
    this.sync.onmessage = this.onMessage;
    this.video.onplay   = this.updateState;
    this.video.onpause  = this.updateState;
    this.interval       = setInterval(this.onTick, 5000);
})();
