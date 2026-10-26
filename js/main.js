// jQuery for page scrolling feature - requires jQuery Easing plugin
$(function() {
    $('a.page-scroll').bind('click', function(event) {
        var $anchor = $(this);
        $('html, body').stop().animate({
            scrollTop: $($anchor.attr('href')).offset().top
        }, 1500, 'easeInOutExpo');
        event.preventDefault();
    });
});

// Closes the Responsive Menu on Menu Item Click
$('.navbar-collapse ul li a').click(function() {
  if ($(this).attr('class') != 'dropdown-toggle active' && $(this).attr('class') != 'dropdown-toggle') {
    $('.navbar-toggle:visible').click();
  }
});

// Toggles hidden divs on button click
$('.content-section button').click(function() {
    if (!($(this).hasClass('btn-selected')) && $(this).attr('id') != 'download-btn' && $(this).attr('id') != 'archive-download-btn') {
        $('.content-section button').removeClass('btn-selected');
        $(this).addClass('btn-selected');

        var oldHidden = $('.hidden');
        var oldShown = $('.shown');
        switch($(this).attr('id')) {
            case 'prot-btn':
                $('#prot-content').removeClass('hidden');
                $('#prot-content').addClass('shown');
                break;
            case 'bumb-btn':
                $('#bumb-content').removeClass('hidden');
                $('#bumb-content').addClass('shown');
                break;
            case 'sky-btn':
                $('#sky-content').removeClass('hidden');
                $('#sky-content').addClass('shown');
                break;
            default:
                oldHidden.removeClass('hidden');
                oldHidden.addClass('shown');
                break;
        }
        oldShown.removeClass('shown');
        oldShown.addClass('hidden');
    }
})

// Popup window for license agreements
function popup(link, windowName) {
    if (!window.focus) 
        return true;
    var href;
    if (typeof(link) == 'string') 
        href = link;
    else 
        href = link.href; 
    window.open(href, windowName, 'width=800,height=600,scrollbars=yes'); 
    return false; 
}

// Toggles currently shown license agreement
function switchLicense(className, eulaPath) {
    if ($('div.' + className).hasClass('hidden')) {
        var oldHidden = $('div.' + className);
        var oldShown = $('.shown');
        oldHidden.removeClass('hidden');
        oldHidden.addClass('shown');
        oldShown.removeClass('shown');
        oldShown.addClass('hidden');
        
        if (eulaPath) {
            fetch('https://api.github.com/repos/ProteoWizard/pwiz/contents/pwiz/data/vendor_readers/' + eulaPath)
                .then(function(response) {
                    return response.json();
                }).then(function(data) {
                    var iframe = document.getElementById(className + '-iframe');
                    iframe.contentDocument.head.innerHTML = '<link href="css/main.css" rel="stylesheet">\n<link href="css/template.css" rel="stylesheet">';
                    iframe.contentDocument.body.innerText = decodeURIComponent(escape(atob(data['content'])));
                });
        }
    }
}

// Software selector
$('#softwareType').change(function () {
    if ($(this).data('options') == undefined)
        $(this).data('options', $('#downloadType option').clone());
    var id = $(this).val();
    var options = $(this).data('options').filter('[value=' + id + ']');
    if (id == "sky") {
        window.open("https://skyline.ms/project/home/software/Skyline/begin.view");
        options = "<option>Visit Skyline website</option>";
    }
    $('#downloadType').html(options);
    $('#downloadType').change();
});

// Only the Windows installers (bt83) have a monthly channel; the other downloads are always
// the latest successful build, so the channel selector is hidden for them
var MONTHLY_CHANNEL_CONFIG = "bt83";
$('#downloadType').change(function () {
    var downloadType = $(this).find('option:selected').attr('data-value') || "";
    $('#releaseChannelGroup').toggle(downloadType.indexOf(MONTHLY_CHANNEL_CONFIG + "_") === 0);
});
$('#softwareType').change();

// Downloads specified software
function download() {
    /*var name = document.getElementById('inputName').value;
    if (!validateName(name)) {
        alert("The name field cannot be left blank.");
        return
    }*/

    var email = getValidatedEmail();
    if (email === null) {
        return;
    }

    var selected = document.getElementById('downloadType');
    var selectedData = selected.options[selected.selectedIndex];
    var downloadType = selectedData.getAttribute('data-value');
    var downloadTypeString = downloadType;
    var allowedDownloadTypePattern = /^[A-Za-z0-9._-]+$/;
    if (!downloadTypeString || !allowedDownloadTypePattern.test(downloadTypeString)) {
        alert("Invalid download type selected.");
        return;
    }
    if (downloadType.match(/ProteoWizardAndSkylineDockerContainerWineX8664/)) {
        window.location = "https://hub.docker.com/r/chambm/pwiz-skyline-i-agree-to-the-vendor-licenses";
        return;
    }
    if (downloadType === "pwiz_source") {
        window.location = "https://github.com/ProteoWizard/pwiz";
        return;
    }

    // An option's data-value is a TeamCity build configuration id, optionally followed by a
    // suffix that picks one artifact out of the several that configuration publishes. The
    // ProteoWizard-*Setup-* patterns name the whole file prefix after "content/", because
    // ProteoWizard-Setup- would otherwise also match inside ProteoWizard-NoNetRuntime-Setup-.
    //
    // Patterns are tried in order. The .NET options fall back to the C++ build's .msi and
    // .tar.bz2, which is all the published artifact list holds until the .NET builds of
    // bt83 and bt17 replace it.
    var msiPattern = /(\/guestAuth\/[\w\/\-.:]+\/content\/[\w\/\-.:]+.msi)/g;
    var tarBz2Pattern = /(\/guestAuth\/[\w\/\-.:]+\/content\/[\w\/\-.:]+.tar.bz2)/g;
    var artifactTypes = [
        { suffix: "_setup",             patterns: [/(\/guestAuth\/[\w\/\-.:]+\/content\/ProteoWizard-Setup-[\w\-.]+\.exe)/g, msiPattern] },
        { suffix: "_setup_noruntime",   patterns: [/(\/guestAuth\/[\w\/\-.:]+\/content\/ProteoWizard-NoNetRuntime-Setup-[\w\-.]+\.exe)/g, msiPattern] },
        { suffix: "_setup_vendorsdks",  patterns: [/(\/guestAuth\/[\w\/\-.:]+\/content\/ProteoWizard-WithVendorSdks-Setup-[\w\-.]+\.exe)/g, msiPattern] },
        { suffix: "_linux",             patterns: [/(\/guestAuth\/[\w\/\-.:]+\/content\/ProteoWizard-linux-x64-[\w\-.]+\.tar\.gz)/g, tarBz2Pattern] },
        { suffix: "_installer",         patterns: [msiPattern] },
        { suffix: "_without_tests",     patterns: [/(\/guestAuth\/[\w\/\-.:]+\/content\/bumbershoot-src-without-t-[\w\/\-.:]+.tar.bz2)/g] }
    ];
    var matchPatterns = [tarBz2Pattern];
    for (var i = 0; i < artifactTypes.length; i++) {
        var suffix = artifactTypes[i].suffix;
        if (downloadType.length > suffix.length && downloadType.slice(-suffix.length) === suffix) {
            matchPatterns = artifactTypes[i].patterns;
            downloadTypeString = downloadType.slice(0, -suffix.length);
            break;
        }
    }

    // The monthly channel's metadata is published beside the latest build's, in the same format,
    // by the job that pins each month's release
    var monthly = downloadTypeString === MONTHLY_CHANNEL_CONFIG &&
                  document.getElementById('releaseChannel').value === "monthly";
    var remoteURL = "/releases/" + downloadTypeString + (monthly ? "-monthly" : "") + ".xml";
    //alert("Remote URL: " + remoteURL);

    var teamCityInfoString = "";
    var request = createCORSRequest("GET", remoteURL);
    if (request) {
        request.onload = function(){
            if (request.status !== undefined && request.status !== 200) {
                alert("Unable to find the " + (monthly ? "monthly release" : "latest build") + " for this download.");
                return;
            }
            teamCityInfoString = request.responseText;

            // Change TeamCity artifact string to point directly at S3, e.g.
            // From /guestAuth/app/rest/builds/id:1461109/artifacts/content/pwiz-setup-3.0.21180.d45de83ec-x86_64.msi
            // To https://proteowizard-teamcity-artifacts.s3.us-west-2.amazonaws.com/ProteoWizard/bt83/1461109/pwiz-setup-3.0.21180.d45de83ec-x86_64.msi
            var matches = null;
            for (var p = 0; p < matchPatterns.length && !(matches && matches.length); p++) {
                matches = teamCityInfoString.match(matchPatterns[p]);
            }
            if (!matches || !matches.length) {
                alert("Unable to determine download artifact.");
                return;
            }
            var teamCityDownloadURL = matches[0];
            var hrefMatches = teamCityDownloadURL.match(/builds\/id:(\d+)\/artifacts\/content\/(.*)/);
            if (!hrefMatches || hrefMatches.length < 3) {
                alert("Invalid download metadata.");
                return;
            }
            var downloadURL = `https://mc-tca-01.s3.us-west-2.amazonaws.com/ProteoWizard/${downloadTypeString}/${hrefMatches[1]}/${hrefMatches[2]}`;
            
            // Bumbershoot is now a subproject so its artifact paths changed
            if (document.getElementById('softwareType').selectedIndex == 1)
            {
                downloadURL = downloadURL.replace("/ProteoWizard/", "/ProteoWizard_Bumbershoot/");
            }

            startDownload(downloadURL, hrefMatches[2], email);
        };
        request.send();
    }
}

// Returns the optional email address ("" when blank), or null after alerting when the email is
// invalid or the license agreements are not accepted
function getValidatedEmail() {
    var email = document.getElementById('inputEmail').value.trim();
    if (email && !validateEmail(email)) {
        alert("Invalid email address.");
        return null;
    }

    if (!document.getElementById('license-agreements').checked) {
        alert("You must accept the license agreements before downloading.");
        return null;
    }
    return email;
}

// Records the email (if any) and an analytics hit for fileName, then navigates to downloadURL
function startDownload(downloadURL, fileName, email) {
    var alreadyTriggered = false;
    var downloadArtifact = function()
    {
        if (alreadyTriggered) return;
        alreadyTriggered = true;

        if(email) {
            writeEmailToFile(email, function() {
                window.location = downloadURL;
            });
        } else {
            window.location = downloadURL;
        }
    };

    // Send Google Analytics hit for downloaded file, then trigger the artifact download;
    // always trigger the download after a timeout if the analytics hit fails for some reason
    (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){ (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o), m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)})
      (window,document,'script','//www.google-analytics.com/analytics.js','ga2');
    ga2("create", "UA-54926454-1", "auto");
    ga2("send", {"hitType": "pageview",
                 "page": "/download/" + fileName,
                 "hitCallback": downloadArtifact
    });
    setTimeout(downloadArtifact, 5000);
}

// Monthly release archive: /releases/bt83-archive.json, published by the job that pins the
// releases, lists every release newest first. Each is a month's release, or a "daily" release made
// between months; its tag carries the installer's commit date and git SHA, e.g.
//   {"releases": [{"tag": "release-2026-09-29-10aac2d9", "date": "2026-09-29", "daily": false,
//                  "version": "3.0.26272.10aac2d9", "buildId": 4230560, "commit": "10aac2d9...",
//                  "artifacts": ["pwiz-setup-3.0.26272.10aac2d9-x86_64.msi", "VERSION"]}]}
// A month's release is shown by its month (2026-09) and a daily release by its date (2026-10-23).
// Releases through 2026-09 are the C++ build's single .msi; later ones are the three .exe installers.
// Installer file name for each #archiveVariant value; a C++-era release has only its .msi,
// which is offered for every variant
var archiveVariantPatterns = {
    setup:      /^ProteoWizard-Setup-[\w\-.]+\.exe$/,
    noruntime:  /^ProteoWizard-NoNetRuntime-Setup-[\w\-.]+\.exe$/,
    vendorsdks: /^ProteoWizard-WithVendorSdks-Setup-[\w\-.]+\.exe$/
};
var archiveMsiPattern = /^pwiz-setup-[\w\-.]+\.msi$/;
var ARCHIVE_LABEL_WIDTH = "YYYY-MM-DD".length;
var NON_BREAKING_SPACE = String.fromCharCode(160);
var archiveReleases = [];

$(function() {
    var variantSelect = document.getElementById('archiveVariant');
    var releaseSelect = document.getElementById('archiveRelease');
    if (!variantSelect || !releaseSelect) {
        return;
    }
    $.getJSON("/releases/" + MONTHLY_CHANNEL_CONFIG + "-archive.json", function(archive) {
        var releases = (archive && archive.releases) || [];
        for (var r = 0; r < releases.length; r++) {
            var release = releases[r];
            if (/^release-[\w\-]+$/.test(release.tag) && /^\d{4}-\d{2}-\d{2}$/.test(release.date) &&
                /^\d+$/.test(String(release.buildId))) {
                archiveReleases.push(release);
            }
        }
        fillArchiveReleases();
        if (releaseSelect.options.length) {
            $('#monthly-archive').removeClass('hidden');
        }
    });
    $(variantSelect).change(fillArchiveReleases);

    // An option holds only its release's index into archiveReleases; the download URL is built
    // from that release's own data, never from text read back from the page
    $('#archive-download-btn').click(function() {
        var option = releaseSelect.options[releaseSelect.selectedIndex];
        var release = option ? archiveReleases[parseInt(option.value, 10)] : null;
        var fileName = release ? archiveFileName(release) : null;
        if (!fileName) {
            return;
        }
        var email = getValidatedEmail();
        if (email !== null) {
            startDownload(`https://mc-tca-01.s3.us-west-2.amazonaws.com/ProteoWizard/${MONTHLY_CHANNEL_CONFIG}/${release.buildId}/${fileName}`,
                          fileName, email);
        }
    });
});

// Lists each archived release that has an installer for the selected variant, keeping the
// selected release when the variant changes
function fillArchiveReleases() {
    var releaseSelect = document.getElementById('archiveRelease');
    var selected = releaseSelect.selectedIndex >= 0 ? releaseSelect.options[releaseSelect.selectedIndex].value : null;
    while (releaseSelect.options.length) {
        releaseSelect.remove(0);
    }
    for (var r = 0; r < archiveReleases.length; r++) {
        var release = archiveReleases[r];
        var fileName = archiveFileName(release);
        if (!fileName) {
            continue;
        }
        var option = document.createElement('option');
        option.value = String(r);
        // The select is monospace, and the label is padded with non-breaking spaces (an option
        // collapses ordinary ones), so versions line up for both month and daily labels
        var label = release.daily === true ? release.date : release.date.substring(0, 7);
        option.textContent = label.padEnd(ARCHIVE_LABEL_WIDTH, NON_BREAKING_SPACE) + " " + (release.version || "") +
                             (archiveMsiPattern.test(fileName) ? " (.msi)" : "");
        option.selected = option.value === selected;
        releaseSelect.appendChild(option);
    }
}

// The release's installer for the selected variant; a C++-era release's .msi serves every variant
function archiveFileName(release) {
    var variantPattern = archiveVariantPatterns[document.getElementById('archiveVariant').value];
    return findArchiveArtifact(release.artifacts || [], variantPattern) ||
           findArchiveArtifact(release.artifacts || [], archiveMsiPattern);
}

function findArchiveArtifact(artifacts, pattern) {
    for (var a = 0; a < artifacts.length; a++) {
        if (pattern && pattern.test(artifacts[a])) {
            return artifacts[a];
        }
    }
    return null;
}

// Writes email to file
function writeEmailToFile(email, callback) {

    $.post("js/ajax.php", {
        email: email
    }, function(data, status) {
        console.log(status);
        callback();
    });
}

// Validates name of downloader
function validateName(name) {
    var nameRegex = /^[A-Za-z\s]+$/;
    return nameRegex.test(name);
}

// Validates email of downloader
function validateEmail(email) {
    var emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return emailRegex.test(email);
}

// Cross-domain AJAX request 
// http://jquery-howto.blogspot.fr/2013/09/jquery-cross-domain-ajax-request.html#cors 
function createCORSRequest(method, url) {
    var xhr = new XMLHttpRequest();
    if ("withCredentials" in xhr){
        // XHR has 'withCredentials' property only if it supports CORS
        xhr.open(method, url, false);
    } else if (typeof XDomainRequest != "undefined"){ // if IE use XDR
        xhr = new XDomainRequest();
        xhr.open(method, url);
    } else {
        xhr = null;
    }
    return xhr;
}

// Javascript equivalent basename function in PHP 
// http://stackoverflow.com/questions/3820381/need-a-basename-function-in-javascript 
function baseName(str) {
   var base = new String(str).substring(str.lastIndexOf('/') + 1); 
    if(base.lastIndexOf(".") != -1)       
        base = base.substring(0, base.lastIndexOf("."));
   return base;
}
