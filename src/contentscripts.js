console.log( "=== copyy contentscripts load ===" )

import "./vender/notify/notify.css";
import "./assets/css/style.css";

import domtoimage from 'dom2image';
import FileSaver  from 'filesaver';
import toMarkdown from 'markdown';

let $target;

/***********************
 * Entry
 ***********************/

createInput()
function createInput() {
    $( "html" ).append( `<textarea id="copyy-input" style="opacity: 0;">` );
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
 * to Markdown
 ***********************/

/**
 * @param {string} data
 * @param {string} name
 * @param {function} 0: base64; 1: error
 */
function markdown( data, name, callback ) {
    try {
        const md     = toMarkdown( data, { gfm: true }),
              base64 = "data:text/plain;charset=utf-8," + encodeURIComponent( md );
        name ? download( base64, name ) : callback( md );
    } catch( error ) {
        callback( undefined, error );
    }
}

/**
 * Clear Html to MD, erorr <tag>
 * 
 * @param {string} convert string
 */
function clearMD( str ) {
    str = str.replace( /<\/?(dl|dt|ins|font|span|div|canvas|noscript|fig\w+)[ -\w*= \w=\-.:&\/\/?!;,%+()#'"{}\u4e00-\u9fa5]*>/ig, "" )
             .replace( /<\/?sr(-[a-z]*)+[\w-\[\]="'.:&;% ]*>|<fab [\S ]*>/ig, "" )
             .replace( /sr-blockquote/ig, "blockquote" )
             .replace( /<\/?style[ -\w*= \w=\-.:&\/\/?!;,+()#"\S]*>/ig, "" )
             .replace( /(name|lable)=[\u4e00-\u9fa5 \w="-:\/\/:#;]+"/ig, "" )
    return str;
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
        case "selected2png":
            highlight().done( result => {
                console.log( result )
                result && new Notify().Render( "开始转换，成功后自动下载，请稍等。" );
                png( result, $( "head title" ).text().trim() + ".png", result => {
                    !result && new Notify().Render( 2, "转换失败，请重新选择。" );
                });
            });
            break;
        case "selected2md":
            highlight().done( result => {
                console.log( result )
                $( result ).find( "img" ).each( ( idx, ele ) => {
                    const src = $( ele ).attr( "src" );
                    src.startsWith( "/" ) && $( ele ).attr( "src", ele.src );
                });
                new Notify().Render( "开始转换，成功后自动下载，请稍等。" );
                markdown( clearMD( result.outerHTML.trim()), $( "head title" ).text().trim() + ".md" );
            });
            break;
        case "selected2code":
            $target = selected();
            let $parent = $target.parent(),
                tag     = $parent[0].tagName,
                tagName = "pre";
            location.host == "gist.github.com" && ( tagName = "table" );
            while ( tag && tag.toLowerCase() != tagName ) {
                $parent = $parent.parent();
                tag     = $parent[0].tagName;
            }
            console.log( $parent[0] )
            if ( $parent && $parent.is( tagName )) {
                copy( $parent[0].innerText );
            } else {
                new Notify().Render( "代码段的复制需要包含 &lt;pre&gt; 或 &lt;code&gt; 标签内。" );                    
            }
            break;
    }
})