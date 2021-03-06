var Chat = require("./chat/Chat");
var ContactList = require("./contactlist/ContactList");
var Settings = require("./settings/Settings");
var SettingsMenu = require("./settings/SettingsMenu");
var VideoLayout = require("../videolayout/VideoLayout");
var ToolbarToggler = require("../toolbars/ToolbarToggler");
var UIUtil = require("../util/UIUtil");

/**
 * Toggler for the chat, contact list, settings menu, etc..
 */
var PanelToggler = (function(my) {

    var currentlyOpen = null;
    var buttons = {
        '#chatspace': '#chatBottomButton',
        '#contactlist': '#contactListButton',
        '#settingsmenu': '#settingsButton'
    };

    /**
     * Resizes the video area
     * @param isClosing whether the side panel is going to be closed or is going to open / remain opened
     * @param completeFunction a function to be called when the video space is resized
     * @param panel, the panel that needs to be opened/closed
     */
    var resizeVideoArea = function(isClosing, completeFunction, panel) {
        var videospace = $('#videospace');

        if  (panel == "ContactList"){
            var panelSize = isClosing ? 0 : 250;    
        }
        else {
            var panelSize = isClosing ? 0 : 300;    
        }
        
        var videospaceWidth = window.innerWidth - panelSize;
        var videospaceHeight = window.innerHeight;
        var videoSize
            = VideoLayout.getVideoSize(null, null, videospaceWidth, videospaceHeight);
        var videoWidth = videoSize[0];
        var videoHeight = videoSize[1];
        var videoPosition = VideoLayout.getVideoPosition(
            videoWidth,
            videoHeight,
            videospaceWidth,
            videospaceHeight);
        var horizontalIndent = videoPosition[0];
        var verticalIndent = videoPosition[1];

        var thumbnailSize = VideoLayout.calculateThumbnailSize(videospaceWidth);
        var thumbnailsWidth = thumbnailSize[0];
        var thumbnailsHeight = thumbnailSize[1];
        //for chat

        // need to know which panel i'm handling....
        if (panel == "ContactList"){
            videospace.animate({
                    left: panelSize,
                    width: videospaceWidth,
                    height: videospaceHeight
                },
                {
                    queue: false,
                    duration: 500,
                    complete: completeFunction
                });
        }
        else {
            videospace.animate({
                    right: panelSize,
                    width: videospaceWidth,
                    height: videospaceHeight
                },
                {
                    queue: false,
                    duration: 500,
                    complete: completeFunction
                });   
        }    

        $('#remoteVideos').animate({
                height: thumbnailsHeight
            },
            {
                queue: false,
                duration: 500
            });

        $('#remoteVideos>span').animate({
                height: thumbnailsHeight,
                width: thumbnailsWidth
            },
            {
                queue: false,
                duration: 500,
                complete: function () {
                    $(document).trigger(
                        "remotevideo.resized",
                        [thumbnailsWidth,
                            thumbnailsHeight]);
                }
            });

        
        $('#largeVideoContainer').animate({
                width: videospaceWidth,
                height: videospaceHeight
            },
            {
                queue: false,
                duration: 500
            });
            
        
        if (panel == "ContactList"){
            $('#largeVideo').animate({
                    width: videoWidth,
                    height: videoHeight,
                    top: verticalIndent,
                    bottom: verticalIndent,
                    left: horizontalIndent * -1,
                    right: horizontalIndent * -1
                },
                {
                    queue: false,
                    duration: 500
                });
        }
        else {
            $('#largeVideo').animate({
                    width: videoWidth,
                    height: videoHeight,
                    top: verticalIndent,
                    bottom: verticalIndent,
                    left: horizontalIndent,
                    right: horizontalIndent  
                },
                {
                    queue: false,
                    duration: 500
                });   
        }
    };

    /**
     * Toggles the windows in the side panel
     * @param object the window that should be shown
     * @param selector the selector for the element containing the panel
     * @param onOpenComplete function to be called when the panel is opened
     * @param onOpen function to be called if the window is going to be opened
     * @param onClose function to be called if the window is going to be closed
     */
    var toggle = function(object, selector, onOpenComplete, onOpen, onClose) {
        UIUtil.buttonClick(buttons[selector], "active");

        if (object.isVisible()) {
            $("#toast-container").animate({
                    right: '5px'
                },
                {
                    queue: false,
                    duration: 500
                });
            if (selector == "#contactlist"){
                $(selector).hide("slide", {
                    direction: "left",
                    queue: false,
                    duration: 500
                });
            }
            else {
                $(selector).hide("slide", {
                    direction: "right",
                    queue: false,
                    duration: 500
                });
            }
            if(typeof onClose === "function") {
                onClose();
            }

            currentlyOpen = null;
        }
        else {
            // Undock the toolbar when the chat is shown and if we're in a
            // video mode.
            if (VideoLayout.isLargeVideoVisible()) {
                ToolbarToggler.dockToolbar(false);
            }

            /*if(currentlyOpen) {
                if (selector == "contactlist"){
                    var current = selector;
                }
                else if (selector == "Chat"){
                    var current = selector;   
                }
                UIUtil.buttonClick(buttons[currentlyOpen], "active");
                current.css('z-index', 4);
                setTimeout(function () {
                    current.css('display', 'none');
                    current.css('z-index', 5);
                }, 500);
            }
*/
            
            $("#toast-container").animate({
                    right: (PanelToggler.getPanelSize + 5) + 'px'
                },
                {
                    queue: false,
                    duration: 500
                });

            if (selector == "#contactlist"){
                    $(selector).show("slide", {
                    direction: "left",
                    queue: false,
                    duration: 500,
                    complete: onOpenComplete
                });
            }
            else {
                $(selector).show("slide", {
                    direction: "right",
                    queue: false,
                    duration: 500,
                    complete: onOpenComplete
                });
            }    

            if(typeof onOpen === "function") {
                onOpen();
            }

            currentlyOpen = selector;
        }
    };

    /**
     * Opens / closes the chat area.
     */
    my.toggleChat = function() {
        var chatCompleteFunction = Chat.isVisible() ?
            function() {} : function () {
            Chat.scrollChatToBottom();
            $('#chatspace').trigger('shown');
        };

        resizeVideoArea(Chat.isVisible(), chatCompleteFunction, "Chat");

        toggle(Chat,
            '#chatspace',
            function () {
                // Request the focus in the nickname field or the chat input field.
                if ($('#nickname').css('visibility') === 'visible') {
                    $('#nickinput').focus();
                } else {
                    $('#usermsg').focus();
                }
            },
            null,
            Chat.resizeChat,
            null);
    };

    /**
     * Opens / closes the contact list area.
     */
    my.toggleContactList = function () {
        var completeFunction = ContactList.isVisible() ?
            function() {} : function () { $('#contactlist').trigger('shown');};
        //resizeVideoArea(ContactList.isVisible(), completeFunction, "ContactList");

        toggle(ContactList,
            '#contactlist',
            null,
            function() {
                ContactList.setVisualNotification(false);
            },
            null);
    };

    /**
     * Opens / closes the settings menu
     */
    my.toggleSettingsMenu = function() {
        resizeVideoArea(SettingsMenu.isVisible(), function (){}, settings);
        toggle(SettingsMenu,
            '#settingsmenu',
            null,
            function() {
                var settings = Settings.getSettings();
                $('#setDisplayName').get(0).value = settings.displayName;
                $('#setEmail').get(0).value = settings.email;
            },
            null);
    };

    /**
     * Returns the size of the side panel.
     */
    my.getPanelSize = function () {
        var availableHeight = window.innerHeight;
        var availableWidth = window.innerWidth;

        var panelWidth = 300;
        if (availableWidth * 0.2 < 300) {
            panelWidth = availableWidth * 0.2;
        }

        return [panelWidth, availableHeight];
    };

    my.isVisible = function() {
        return (Chat.isVisible() || ContactList.isVisible() || SettingsMenu.isVisible());
    };

    return my;

}(PanelToggler || {}));

module.exports = PanelToggler;