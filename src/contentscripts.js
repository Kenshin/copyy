console.log( "=== copyy contentscripts load ===" )

import "./vender/notify/notify.css";
import "./assets/css/style.css";

import domtoimage from 'dom2image';
import FileSaver  from 'filesaver';

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
 * Highlight
 ***********************/

function highlight() {
    let $prev;
    const highlight_class = "copyy-highlight-selector",
          dtd             = $.Deferred(),
          mousemoveEvent  = event => {
            if ( !$prev ) {
                $( event.target ).addClass( highlight_class );
            } else {
                $prev.removeClass( highlight_class );
                $( event.target ).addClass( highlight_class );
            }
            $prev = $( event.target );
    };
    $( "html" ).one( "click", event => {
        if ( !$prev ) return;
        $( event.target ).removeClass( highlight_class );
        $( "html"       ).off( "mousemove", mousemoveEvent );
        $prev = undefined;
        dtd.resolve( event.target );
    });
    $( "html" ).one( "keydown", event => {
        if ( event.keyCode == 27 && $prev ) {
            $( event.target ).find( `.${highlight_class}` ).removeClass( highlight_class );
            $( "html"       ).off( "mousemove", mousemoveEvent );
            $prev = undefined;
        }
    });
    $( "html" ).on( "mousemove", mousemoveEvent );
    return dtd;
}

/***********************
 * Download
 ***********************/

/**
 * @param {string} image base64 code
 * @param {string} name
 */
function download( data, name ) {
    const $a   = $( `<a style="display:none" href=${data} download="${name}"></a>` ).appendTo( "body" );
    $a[0].click();
    $a.remove();
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
 * to Image
 ***********************/

/**
 * Create PNG
 * 
 * @param {html}     html element
 * @param {string}   name
 * @param {function} callback
 */
function png( element, name, callback ) {
    try {
        domtoimage.toBlob( element )
        .then( blob => {
            blob && FileSaver.saveAs( blob, name );
            callback( !!blob );
        });
    } catch ( error ) {
        callback( false );        
    }
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
        case "global2png":
            highlight().done( result => {
                console.log( result )
                result && new Notify().Render( "开始转换，成功后自动下载，请稍等。" );
                png( result, $( "head title" ).text().trim() + ".png", result => {
                    !result && new Notify().Render( 2, "转换失败，请重新选择。" );
                });
            });
            break;
    }
})