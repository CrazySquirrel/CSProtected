/**
 * API клиент для логирования активностей
 * @author Sergey Yastrebov <info@crazysquirrel.ru>
 * @version 1.0.0
 * @copyright CrazySquirrel 2016
 * @description Клиент логирования и ассинхронной передачи данных об активностей пользователя
 */
(function (APIClient) {
    /**
     * Адрес сервера
     * @type {string}
     */
    var serverAPI = "/ajax/JSServer.php";
    /**
     * Текущий аказатель на буфер
     * @type {number}
     */
    var sendBufferID = 0;
    /**
     * Буфер данных
     * @type {object}
     */
    var sendBuffer = {};
    /**
     * Статус состояния отправки (true - свободен | false - отправляет)
     * @type {boolean}
     */
    var sendStatus = true;
    /**
     * Метод отправки данных в лог из буфера
     */
    var sendData = function () {
        /**
         * Проверка статуса отправки и размера буфера
         */
        if (sendStatus && Object.keys(sendBuffer).length > 0) {
            /**
             * Блокируем буфер
             * @type {boolean}
             */
            sendStatus = false;
            /**
             * Шифруем данные перед отрпавкой по алгоритму AES-128
             * @type {string|*}
             */
            var iv = CryptoJS.MD5((new Date).getTime().toString()).toString();
            var _iv = CryptoJS.enc.Hex.parse(iv);
            var key = CryptoJS.enc.Hex.parse(APIClient);
            var data = {
                    APIClient: APIClient,
                    DATA: sendBuffer
                };
                data = CryptoJS.AES.encrypt(JSON.stringify(data), key, {iv:_iv});
                data = data.ciphertext.toString(CryptoJS.enc.Base64);
            /**
             * Создаем http подключение и отправляем данные
             * @type {XMLHttpRequest}
             */
            var xhttp = new XMLHttpRequest();
                xhttp.open("POST", serverAPI, true);
                xhttp.setRequestHeader("APIClient", iv);
                xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                xhttp.setRequestHeader("Content-length", data.length);
                xhttp.setRequestHeader("Connection", "close");
                xhttp.onreadystatechange = function () {
                    /**
                     * Проверка статуса ответа
                     */
                    if (
                        xhttp.readyState == 4 &&
                        xhttp.status == 200
                    ) {
                        /**
                         * Дешифруем даннные ответа
                         * @type {string}
                         */
                        data = xhttp.responseText;
                        if(data) {
                            data = CryptoJS.AES.decrypt(data, key, {iv: _iv});
                            data = data.toString(CryptoJS.enc.Utf8);
                            if(data) {
                                data = data.replace(/[^\x20-\x7E]+/g, '');
                                data = decodeURIComponent(data);
                                data = JSON.parse(data);
                                if(data) {
                                    if(data.DATA && data.DATA.length>0){
                                        for(var i in data.DATA){
                                            if(data.DATA.hasOwnProperty(i)){
                                                /**
                                                 * Удаляем данные принятые логом
                                                 */
                                                delete sendBuffer[data.DATA[i]];
                                            }
                                        }
                                    }
                                    if(data.APIClient) {
                                        APIClient = data.APIClient;
                                    }
                                    sendStatus = true;
                                }
                            }
                        }
                        /**
                         * Сохраняем буфер
                         */
                        saveBuffer();
                    }
                };
                xhttp.send(data);
        }
    };
    /**
     * Таймер проверки состояния буфера
     */
    setInterval(
        function () {
            sendData();
        },
        1000
    );
    /**
     * Получение внешнего ID пользователя
     * @returns {*}
     */
    var getUserID = function(){
        var UserID = Cookie.get("OK.HOCKEY.USER.ID");
        if(UserID == null){
            UserID = (new Date()).getTime()+"_"+Math.round(Math.random()*1000000);
            Cookie.set("OK.HOCKEY.USER.ID",UserID);
        }
        return UserID;
    };
    /**
     * Загрузка сохраненного состояния буфера
     */
    var loadBuffer = function(){
        /**
         * Дешифрация данных буфера
         * @type {*|number}
         */
        var iv = CryptoJS.enc.Hex.parse(CryptoJS.MD5(getUserID()));
        var key = CryptoJS.enc.Hex.parse(CryptoJS.MD5(getUserID()));
        var data = Cookie.get("APIClientData");
        if(!data) {
            data = CryptoJS.AES.decrypt(data, key, {iv: iv});
            data = data.toString(CryptoJS.enc.Utf8);
            data = JSON.parse(data);
            sendBuffer = data;
            for (var i in sendBuffer) {
                if (
                    sendBuffer.hasOwnProperty(i)
                ) {
                    sendBufferID = Math.max(sendBufferID, i);
                }
            }
            sendBufferID++;
            sendData();
        }
    };
    loadBuffer();
    /**
     * Сохранение буфера
     */
    var saveBuffer = function(){
        /**
         * Шифрование и запись данных буфера
         * @type {*|number}
         */
        var iv = CryptoJS.enc.Hex.parse(CryptoJS.MD5(getUserID()));
        var key = CryptoJS.enc.Hex.parse(CryptoJS.MD5(getUserID()));
        var data = JSON.stringify(sendBuffer);
        data = CryptoJS.AES.encrypt(data, key, {iv: iv});
        data = data.ciphertext.toString(CryptoJS.enc.Base64);
        Cookie.set("APIClientData",data);
    };
    /**
     * Метод добавление данных в лог
     * @param type {string}
     * @param data {object}
     */
    var addData = function (type,data) {
        sendBuffer[sendBufferID] = {
            ID: sendBufferID,
            TYPE: "Data",
            DATA: data,
            USER_ID: getUserID(),
            DATA_TIME: (new Date).getTime(),
            TIME_ZONE: -((new Date).getTimezoneOffset())/60
        };
        sendBufferID++;
        saveBuffer();
    };
    /**
     * Метод добавления события в лог по аналогии с ga
     * @param type {string} - тип
     * @param category {string} - категория
     * @param action {string} - действие
     * @param label {string} - метка
     * @param value {string} - значение метки
     */
    var addEvent = function (type, category, action, label, value) {
        addData("Event",{
            TYPE: (type || ""),
            CATEGORY: (category || ""),
            ACTION: (action || ""),
            LABEL: (label || ""),
            VALUE: (value || "")
        });
    };
    /**
     * Метод добавления интерфейсного события
     * @param obj
     * @param event
     */
    var addUIEvent = function(obj,event){
        var data = {};
        event = event || window.event;
        for (var key in event) {
            if(
                typeof event[key] != "function" &&
                typeof event[key] != "object"
            ) {
                data[key] = event[key];
            }
        };
        addData("UIEvent",data);
    };
})(APIClient);
delete APIClient;
document.getElementById("APIClient").parentNode.removeChild(document.getElementById("APIClient"));