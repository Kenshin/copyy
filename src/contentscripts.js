console.log( "=== copyy contentscripts load ===" )

import "./vender/notify/notify.css";

let $target;

/***********************
 * Entry
 ***********************/

createInput()
function createInput() {
    $( "html" ).append( `<input id="copyy-input" style="opacity: 0;">` );
}

/***********************
 * Copy
 ***********************/

function copy( value ) {
    console.log( value )
    $( "#copyy-input" )[0].value = value;
    $( "#copyy-input" )[0].select();
    document.execCommand( "copy" );
    new Notify().Render( "复制成功。" )
}

/***********************
 * Selected
 ***********************/

function selected() {
    try {
        const sel   = window.getSelection(),
              range = sel.getRangeAt( sel.rangeCount - 1 );
        console.log( "selected content is ", range.startContainer.parentNode )
        return $( range.startContainer.parentNode );
    } catch ( error ) {
        new Notify().Render( "请重新选择。" );
    }
}

/***********************
 * Image to base64
 ***********************/

/**
 * Image to base64
 * 
 * @param {string}   image url
 * @param {function} callback
 */
function base64( url, callback ) {
    const img         = new Image();
    img.crossOrigin   = "Anonymous";
    img.onerror       = error => {
        console.error( error );
        new Notify().Render( 2, "转换为 Base64 失败。" );
    }
    img.onload        = () => {
        let canvas    = document.createElement( "canvas" ),
            ctx       = canvas.getContext( "2d" );
        canvas.height = img.naturalHeight;
        canvas.width  = img.naturalWidth;
        ctx.drawImage( img, 0, 0) ;
        const dataURL = canvas.toDataURL( "image/png" );
        callback( dataURL );
        canvas        = null;
    };
    img.src           = url;
}

/***********************
 * Chrome onMessage
 ***********************/

chrome.runtime.onMessage.addListener( function( message, sender, sendResponse ) {
    console.log( "chrome.runtime.messge", message, sender )
    switch( message.type ) {
        case "link2md":
            $target = selected();
            if ( $target.is( "a" ) ) {
                let [ href, text ] = [ $target.attr("href"), $target.text() ];
                !href.startsWith( "http" ) && ( href = location.origin + href );
                ( href == "#" || href == ";" || href == "#;" || href.startsWith( "javascript" ))
                    && ( href = location.href );
                text == undefined && ( text = "" );
                copy( `[${text}](${href})` );
            } else {
                new Notify().Render( "当前选中的内容并不能转换为 Markdown。" )
            }
            break;
        case "global2txt":
        case "global2md":
            let [ href, text ] = [ location.href, $( "head title" ).text() ];
            text == undefined && ( text = "" );
            copy( message.type == "global2md" ? `[${text}](${href})` : text + " " + href );
            break;
        case "img2base64":
            console.log( message.content.srcUrl )
            let herf = message.content.srcUrl;
            !herf.startsWith( "http" ) && ( herf = location.origin + herf );
            new Notify().Render( "转换中，请稍等。" );
            base64( herf, result => {
                copy( result );
            });
            break;
        case "img2md":
            console.log( message.content.srcUrl )
            copy( `![${message.content.srcUrl}](${message.content.srcUrl})` );
            break;
    }
})