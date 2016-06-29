if (window.Worker) {
    (function () {
        var worker = new Worker('/local/templates/webprofy/js/WebWorker.php');
        worker.addEvent = function (type, category, action, label, value) {
            worker.postMessage(JSON.stringify({
                TYPE: "Event",
                DATA: {
                    TYPE: (type || ""),
                    CATEGORY: (category || ""),
                    ACTION: (action || ""),
                    LABEL: (label || ""),
                    VALUE: (value || "")
                },
                USER_ID: worker.getUserID()
            }));
        };
        worker.getUserID = function(){
            var UserID = Cookie.get("APIClientUserID");
            if(UserID == null){
                UserID = (new Date()).getTime()+"_"+Math.round(Math.random()*1000000);
                Cookie.set("APIClientUserID",UserID);
            }
            return UserID;
        };

        //worker.addEvent('send', 'page', 'pageview', 'view', window.location.pathname);
    })();
}