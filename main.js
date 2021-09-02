const {app, BrowserWindow, Tray, Menu, Notification, ipcMain} = require('electron');
const path = require('path');
const mqtt = require('mqtt');
const axios = require('axios');


let tray = null,
    win = null;

app.whenReady().then(() => {
    // createWindow()
    // app.on('activate', () => {
    //   if (BrowserWindow.getAllWindows().length === 0) {
    //     createWindow2()
    //   }
    // })
    // 隐藏dock
    // app.dock.hide();
    // 不设置菜单
    Menu.setApplicationMenu(null);
    //
    createTray();
    //
    createWindow();
    //
    doLogin();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

ipcMain.on('saveAlarms', (event, data) => {
    console.log('saveAlarms: ' + JSON.stringify(data));
    client.publish('world/water', JSON.stringify({
        'type': 'saveAlarms',
        'client': username,
        'data': data
    }));
});

function createTray() {
    tray = new Tray(path.join(process.resourcesPath, 'cup@3x.png'));
    const contextMenu = Menu.buildFromTemplate([
        {role: 'about', label: 'About'},
        {label: 'Preferences...', type: 'normal', click: showPreferences},
        {type: 'separator'},
        {type: 'normal', label: 'test', click: showNotification},
        {type: 'separator'},
        {role: 'quit', label: 'Quit'}
    ]);
    // tray.setContextMenu(contextMenu);
    tray.on('click', function () {
        showPreferences();
    });
    // 右击 打开菜单
    tray.on('right-click', function () {
        tray.popUpContextMenu(contextMenu)
    });
}

function showPreferences() {
    toggleWindow();
}

function showNotification() {
    let notify = new Notification({
        'title': '该喝水咯~',
        'subtitle': '2021/8/16 12:20',
        // 'icon': 'icons/256x256.png',
        'timeoutType': 'never',
        'closeButtonText': '关闭',
        'actions': [
            {
                title: "Close"
            }, {
                title: "Snooze"
            }]
    });
    notify.show();
    notify.on('click', () => {
        console.log('notify clicked')
    });
}

function createWindow() {
    win = new BrowserWindow({
        // width: 320,
        width: 640,
        // height: 240,
        height: 480,
        show: false,
        frame: false,
        fullscreenable: false,
        resizable: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    });
    // win.loadURL(`file://${path.join(__dirname, 'index.html')}`);
    win.loadURL(`file://${path.join(__dirname, 'preference.html')}`);
    win.on('blur', () => {
        if (!win.webContents.isDevToolsOpened()) {
            win.hide()
        }
    });
    // debug
    // win.openDevTools();
}

function showWindow() {
    const position = getWindowPosition();
    win.setPosition(position.x, position.y, false);
    win.show();
    win.focus();
}

function toggleWindow() {
    if (win.isVisible()) {
        win.hide();
    } else {
        showWindow();
    }
}

function getWindowPosition() {
    const windowBounds = win.getBounds();
    const trayBounds = tray.getBounds();
    // Center window horizontally below the tray icon
    const x = Math.round(trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2));
    // Position window 4 pixels vertically below the tray icon
    const y = Math.round(trayBounds.y + trayBounds.height + 4);
    return {x: x, y: y};
}


function doLogin() {
    axios.get('https://lemon.lpe234.xyz/common/im/userid/',)
        .then(function (response) {
            console.log(response.data);
            username = response.data.username;
            password = response.data.token;
            //
            connectMqtt();
        })
        .catch(function (error) {
            console.log(error);
        });

}


// ----------------------------------- MQTT -----------------------------------
let client = null,
    username = null, password = null;

function connectMqtt() {
    const opts = {
        'clientId': username + '@5js7g0',
        'username': username,
        'password': password
    };
    client = mqtt.connect('mqtt://5js7g0.cn1.mqtt.chat', opts);
    client.on('connect', function () {
        client.subscribe('world/water/' + opts.username, function (err) {
            if (!err) {
                console.log('connect success');
                client.publish('world/water', 'Hello mqtt, from: ' + username)
            } else {
                console.log(err)
            }
        })
    });

    client.on('message', function (topic, message) {
        // message is Buffer
        console.debug('topic: ' + topic + ', message: ' + message.toString());

        const msg = JSON.parse(message.toString());

        new Notification({
            'title': msg.title,
            'subtitle': msg.subtitle,
            'timeoutType': 'never',
            'actions': [{'type': 'button'}]
        }).show();
    });
}
